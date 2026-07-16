import "server-only";
import {createPublicClient} from "@/lib/supabase/public";

export const leaderboardPeriods = ["day", "month", "year"] as const;
export type LeaderboardPeriod = (typeof leaderboardPeriods)[number];

export type LeaderboardSkill = Readonly<{
  rank: number;
  skill_id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  current_version: string | null;
  author_id: string;
  author_name: string;
  author_handle: string;
  author_avatar_url: string | null;
  mcp_calls: number;
  average_rating: number;
  review_count: number;
}>;

export function parseLeaderboardPeriod(value: string | undefined): LeaderboardPeriod {
  return leaderboardPeriods.includes(value as LeaderboardPeriod) ? value as LeaderboardPeriod : "month";
}

export async function getSkillLeaderboard(period: LeaderboardPeriod, locale: string) {
  const supabase = createPublicClient();
  const {data, error} = await supabase.rpc("get_skill_leaderboard", {
    p_period: period,
    p_locale: locale === "vi" ? "vi" : "en",
  });
  if (error) throw new Error(`Could not load skill leaderboard: ${error.message}`);

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    rank: Number(row.rank),
    skill_id: String(row.skill_id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    current_version: row.current_version ? String(row.current_version) : null,
    author_id: String(row.author_id),
    author_name: String(row.author_name),
    author_handle: String(row.author_handle),
    author_avatar_url: row.author_avatar_url ? String(row.author_avatar_url) : null,
    mcp_calls: Number(row.mcp_calls),
    average_rating: Number(row.average_rating),
    review_count: Number(row.review_count),
  })) satisfies LeaderboardSkill[];
}
