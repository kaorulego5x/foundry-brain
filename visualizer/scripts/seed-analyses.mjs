#!/usr/bin/env node
/** Copy committed brain fixtures into visualizer/public/analyses/ (runtime dir). */
import { cpSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { existsSync } from "fs";

const visualizerRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
// primary source: the brain's fixtures; fallback: the in-app copy (used on
// deploy hosts where .claude/ isn't uploaded)
const brainSrc = join(visualizerRoot, "../.claude/skills/foundry-brain/fixtures/analyses");
const localSrc = join(visualizerRoot, "scripts/seed-data");
const src = existsSync(brainSrc) ? brainSrc : localSrc;
const dest = join(visualizerRoot, "public/analyses");

mkdirSync(dest, { recursive: true });
for (const name of readdirSync(src)) {
  if (!name.endsWith(".json") || name.endsWith(".feedback.json")) continue;
  cpSync(join(src, name), join(dest, name), { force: true });
}
console.log(`Seeded ${dest} from foundry-brain/fixtures/analyses/`);
