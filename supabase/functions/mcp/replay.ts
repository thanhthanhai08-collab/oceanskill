export type ReplayUsageEvent = Readonly<{
  skill_id: string;
  skill_version_id: string;
  tool_name: string;
}>;

export function hasReplayScopeConflict(
  event: ReplayUsageEvent,
  expected: Readonly<{skillId: string; skillVersionId: string; toolName: string}>,
) {
  return event.skill_id !== expected.skillId
    || event.skill_version_id !== expected.skillVersionId
    || event.tool_name !== expected.toolName;
}
