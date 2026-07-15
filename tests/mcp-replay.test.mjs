import assert from "node:assert/strict";
import test from "node:test";
import {hasReplayScopeConflict} from "../supabase/functions/mcp/replay.ts";

const event = {
  skill_id: "skill-1",
  skill_version_id: "version-1",
  tool_name: "get_skill_content",
};

test("accepts a replay only for the originally charged skill version", () => {
  assert.equal(hasReplayScopeConflict(event, {
    skillId: "skill-1",
    skillVersionId: "version-1",
    toolName: "get_skill_content",
  }), false);
});

test("rejects replaying an old requestId after the current version changes", () => {
  assert.equal(hasReplayScopeConflict(event, {
    skillId: "skill-1",
    skillVersionId: "version-2",
    toolName: "get_skill_content",
  }), true);
});

test("rejects reuse across skills and tools", () => {
  assert.equal(hasReplayScopeConflict(event, {
    skillId: "skill-2",
    skillVersionId: "version-1",
    toolName: "get_skill_content",
  }), true);
  assert.equal(hasReplayScopeConflict(event, {
    skillId: "skill-1",
    skillVersionId: "version-1",
    toolName: "list_skills",
  }), true);
});
