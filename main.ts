// main.ts — the hand-in program for The Gilded Mouse (Node 22, standard
// library only). It copies this repository's game/ and screenshots/ into the
// grader's output directory and writes dossier.json with the vendored
// make.fun library, so the judge can read the game. It writes the same
// bytes on every run: plain copies, no timestamps, no randomness.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function countFiles(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    total += statSync(full).isDirectory() ? countFiles(full) : 1;
  }
  return total;
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier caps come from the scorer's own reference: the text is capped
// at 160 KiB, screenshots at four files of 256 KiB, and game/ at 993 files
// and 48 MiB. Anything over those lines is refused by the gate, so the
// program hands in exactly what the scorer accepts.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A short report on stdout, so a local run shows the hand-in is complete.
const shotCount = existsSync(join(outputDir, 'screenshots'))
  ? readdirSync(join(outputDir, 'screenshots')).filter((n) => !n.startsWith('.')).length
  : 0;
console.log(`handed in ${countFiles(join(outputDir, 'game'))} game files and ${shotCount} screenshots; dossier.json is ${dossier.length} bytes`);
