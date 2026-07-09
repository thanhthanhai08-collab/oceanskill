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
  reviewer_avatar_url: string | null;
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

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function normalizeSkillReviews(rows: unknown[]): SkillReview[] {
  return rows.map((row) => {
    const record = row as Record<string, unknown>;
    const profile = record.profiles as Record<string, unknown> | null | undefined;
    const profileName = stringOrNull(profile?.display_name);
    const storedName = stringOrNull(record.reviewer_name);
    return {
      id: String(record.id),
      skill_id: String(record.skill_id),
      user_id: String(record.user_id),
      rating: Number(record.rating),
      body: String(record.body ?? ""),
      reviewer_name: profileName ?? storedName ?? "OceanSkill user",
      reviewer_avatar_url: stringOrNull(profile?.avatar_url),
      created_at: String(record.created_at),
      updated_at: String(record.updated_at),
    };
  });
}

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

export async function getSkillReviewStatsBySkillIds(skillIds: readonly string[]) {
  const uniqueIds = [...new Set(skillIds)].filter(Boolean);
  if (!uniqueIds.length) return {} as Record<string, SkillReviewStats>;

  const publicClient = createPublicClient();
  const {data, error} = await publicClient
    .from("skill_reviews")
    .select("skill_id,rating")
    .in("skill_id", uniqueIds);

  if (error) return {} as Record<string, SkillReviewStats>;

  const grouped = new Map<string, SkillReview[]>();
  for (const row of data ?? []) {
    const skillId = String(row.skill_id);
    const review = {
      id: "",
      skill_id: skillId,
      user_id: "",
      rating: Number(row.rating),
      body: "",
      reviewer_name: "",
      reviewer_avatar_url: null,
      created_at: "",
      updated_at: "",
    };
    grouped.set(skillId, [...(grouped.get(skillId) ?? []), review]);
  }

  return Object.fromEntries(uniqueIds.map((skillId) => [skillId, summarizeReviews(grouped.get(skillId) ?? [])])) as Record<string, SkillReviewStats>;
}

export async function getSkillReviewState(skillId: string): Promise<SkillReviewState> {
  const publicClient = createPublicClient();
  const {data, error} = await publicClient
    .from("skill_reviews")
    .select("id,skill_id,user_id,rating,body,reviewer_name,created_at,updated_at,profiles!skill_reviews_user_id_fkey(display_name,avatar_url)")
    .eq("skill_id", skillId)
    .order("updated_at", {ascending: false});

  if (error) return {reviews: [], stats: emptyStats, ownReview: null};

  const reviews = normalizeSkillReviews(data ?? []);
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null;
  const ownReview = userId ? reviews.find((review) => review.user_id === userId) ?? null : null;

  return {reviews, stats: summarizeReviews(reviews), ownReview};
}
