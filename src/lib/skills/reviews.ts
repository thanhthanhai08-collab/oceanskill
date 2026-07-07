import "server-only";
import {createPublicClient} from "@/lib/supabase/public";
import {createClient} from "@/lib/supabase/server";

export type SkillReview = Readonly<{
  id: string;
  skill_id: string;
  user_id: string;
  rating: number;
  body: string;
  reviewer_name: string;
  created_at: string;
  updated_at: string;
}>;

export type SkillReviewStats = Readonly<{
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}>;

export type SkillReviewState = Readonly<{
  reviews: SkillReview[];
  stats: SkillReviewStats;
  ownReview: SkillReview | null;
}>;

const emptyStats: SkillReviewStats = {average: 0, count: 0, distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}};

export function summarizeReviews(reviews: SkillReview[]): SkillReviewStats {
  if (!reviews.length) return emptyStats;
  const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0} as Record<1 | 2 | 3 | 4 | 5, number>;
  let total = 0;
  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[rating] += 1;
    total += rating;
  }
  return {average: Number((total / reviews.length).toFixed(1)), count: reviews.length, distribution};
}

export async function getSkillReviewState(skillId: string): Promise<SkillReviewState> {
  const publicClient = createPublicClient();
  const {data, error} = await publicClient
    .from("skill_reviews")
    .select("id,skill_id,user_id,rating,body,reviewer_name,created_at,updated_at")
    .eq("skill_id", skillId)
    .order("updated_at", {ascending: false});

  if (error) return {reviews: [], stats: emptyStats, ownReview: null};

  const reviews = (data ?? []) as SkillReview[];
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null;
  const ownReview = userId ? reviews.find((review) => review.user_id === userId) ?? null : null;

  return {reviews, stats: summarizeReviews(reviews), ownReview};
}
