export type ReplayUsageEvent = Readonly<{
  skill_id: string;
  skill_version_id: string;
  tool_name: string;
  resource_key?: string | null;
}>;

export function hasReplayScopeConflict(
  event: ReplayUsageEvent,
  expected: Readonly<{skillId: string; skillVersionId: string; toolName: string; resourceKey?: string | null}>,
) {
  return event.skill_id !== expected.skillId
    || event.skill_version_id !== expected.skillVersionId
    || event.tool_name !== expected.toolName
    || (event.resource_key ?? null) !== (expected.resourceKey ?? null);
}
