# The Gilded Mouse — a midnight gallery heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Baozhahuangjinlian/best-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Baozhahuangjinlian/best-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

You are the Mouse, a thief with three nights to empty a gallery. Cross each
room, lift the marked target, grab what else you can, and reach the green
EXIT before the alarm hits 100. Guards patrol with vision cones, cameras
sweep the halls, and on later nights laser tripwires blink across the floor.
Read the patrols before you move: toss a coin to lure a guard away, vanish
in smoke, or black out the cameras with an EMP.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No network, no build
step — `game/` is plain static files.

## Controls

- **WASD / arrows** — move · **Shift** — sneak (slower, harder to spot)
- **Click** — toss a coin to lure a nearby guard · **Space** — smoke pellet
- **E** — EMP pulse (cameras dark for 6s) · **P** — pause · **M** — mute

## The nights

1. **The Gallery** — two guards, one camera, the Star Sapphire.
2. **The Vault Hall** — three guards, two cameras, lasers, the Vault Crown.
3. **The Grand Vault** — four guards, three cameras, three lasers, the Gilded Heart.

Being spotted freezes the alarm at 55 for a short grace window — break line
of sight and it falls again. Finish a night without ever being spotted for a
$500 ghost bonus.

## Layout

- `game/` — the game: `index.html` plus one clear job per file under `src/`
  (`config`, `levels`, `vision`, `guards`, `player`, `input`, `audio`,
  `render`, `shots`, `main`)
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`
- `screenshots/` — four renders of the game's own code in a browser
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

An original game: its rooms, names, art and sounds were made for this heist.

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-heist-game-20261122-0559) — my invite link: https://make.fun/r/9pgnb7y6</sub>
