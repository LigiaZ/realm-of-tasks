# ⚔️ The Realm of Tasks

**A household quest board.** Chores and goals, turned into a small fantasy game for the people you live with.

- **⚔️ Weekly quests:** put chores in the quest pool, then let *Fate* draw this week's board. Shared quests need two adventurers to finish them.
- **🕯️ Daily deeds:** small habits that reset every day, with optional "N times a week" goals and a bonus for hitting them.
- **🏰 Main tasks:** big goals (a balcony garden, a summer trip) broken into sub-quests you can send to the weekly board.
- **🏆 Glory:** every completion earns points. At the end of the month the leader spins the *Wheel of Pleasure* for a reward the household picked together.
- **📜 Annals:** a history of every completed week.

## This edition

This is the **browser edition**: no accounts and no server. The whole realm (adventurers, quests, points, history) is saved in your browser's `localStorage`, on your device. Everyone in the household takes turns on the same device, and you pick who's playing from the menu.

Open it and either found your own realm or tap **Explore a sample household**.

The full version (accounts, sync between everyone's phones, AI-suggested sub-quests and reminders) is used privately.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- State: a single `useReducer` store (`src/lib/store.ts`) persisted to `localStorage`
- No backend, so it deploys as a static site

```
src/
  app/                       layout, page, PWA manifest and icons
  components/wishlist/       the board: quests, dailies, main tasks, glory, annals, modals
  components/ui/             Button, Card, Input, Modal, Badge
  lib/store.ts               reducer: every game rule (spins, shared completion, points, month close)
  lib/utils.ts               factories, dates, point values
  lib/sample.ts              the sample household
  lib/edition.ts             feature flags for the browser edition
```

## Run it

```bash
bun install        # or npm install
bun run dev        # http://localhost:3000
bun run lint && bun run typecheck && bun run build
```

## License

MIT. Built by [Lígia Zanchet](https://www.zanchet.eu).
