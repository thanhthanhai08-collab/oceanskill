import {NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {normalizeSkillReviews, summarizeReviews} from "@/lib/skills/reviews";

type ReviewBody = Readonly<{rating?: unknown; body?: unknown}>;

function cleanReviewBody(input: unknown): {rating: number; body: string} | null {
  const value = input as ReviewBody;
  const rating = Number(value?.rating);
  const body = typeof value?.body === "string" ? value.body.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  if (body.length > 1000) return null;
  return {rating, body};
}

export async function POST(request: Request, {params}: {params: Promise<{skillId: string}>}) {
  const {skillId} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub ? String(claims.sub) : null;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error: "invalid_json"}, {status: 400}); }
  const input = cleanReviewBody(body);
  if (!input) return NextResponse.json({error: "invalid_review"}, {status: 400});

  const {data: profile} = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  const email = typeof claims?.email === "string" ? claims.email : "";
  const reviewerName = (typeof profile?.display_name === "string" && profile.display_name.trim()) || email.split("@")[0] || "OceanSkill user";

  const {data: existingReview, error: existingError} = await supabase
    .from("skill_reviews")
    .select("id")
    .eq("skill_id", skillId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) return NextResponse.json({error: "review_lookup_failed", detail: existingError.code}, {status: 500});

  const saveResult = existingReview
    ? await supabase
      .from("skill_reviews")
      .update({rating: input.rating, body: input.body, reviewer_name: reviewerName})
      .eq("id", existingReview.id)
      .eq("user_id", userId)
    : await supabase
      .from("skill_reviews")
      .insert({
        skill_id: skillId,
        user_id: userId,
        rating: input.rating,
        body: input.body,
        reviewer_name: reviewerName,
      });

  if (saveResult.error) return NextResponse.json({error: "review_save_failed", detail: saveResult.error.code}, {status: 500});

  const {data, error} = await supabase
    .from("skill_reviews")
    .select("id,skill_id,user_id,rating,body,reviewer_name,created_at,updated_at,profiles!skill_reviews_user_id_fkey(display_name,avatar_url)")
    .eq("skill_id", skillId)
    .order("updated_at", {ascending: false});

  if (error) return NextResponse.json({error: "review_reload_failed"}, {status: 500});

  const reviews = normalizeSkillReviews(data ?? []);
  const ownReview = reviews.find((review) => review.user_id === userId) ?? null;
  revalidatePath("/vi/skills");
  revalidatePath("/en/skills");

  return NextResponse.json({reviews, ownReview, stats: summarizeReviews(reviews)}, {headers: {"Cache-Control": "no-store"}});
}
