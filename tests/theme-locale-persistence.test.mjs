import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("theme preference is restored before paint whenever the locale changes", async () => {
  const source = await readFile(new URL("../src/components/ThemeToggle.tsx", import.meta.url), "utf8");

  assert.match(source, /useLocale\(\)/);
  assert.match(source, /useLayoutEffect\(\(\) => \{/);
  assert.match(source, /localStorage\.getItem\("theme"\)/);
  assert.match(source, /classList\.toggle\("dark", theme === "dark"\)/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /\}, \[locale\]\)/);
  assert.match(source, /localStorage\.setItem\("theme", nextTheme\)/);
});
