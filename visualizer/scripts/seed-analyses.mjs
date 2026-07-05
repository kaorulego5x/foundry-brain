#!/usr/bin/env node
/** Copy committed brain fixtures into visualizer/public/analyses/ (runtime dir). */
import { cpSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const visualizerRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(visualizerRoot, "../.claude/skills/foundry-brain/fixtures/analyses");
const dest = join(visualizerRoot, "public/analyses");

mkdirSync(dest, { recursive: true });
for (const name of readdirSync(src)) {
  if (!name.endsWith(".json") || name.endsWith(".feedback.json")) continue;
  cpSync(join(src, name), join(dest, name), { force: true });
}
console.log(`Seeded ${dest} from foundry-brain/fixtures/analyses/`);
