/**
 * This is the browser edition of The Realm of Tasks: no accounts, no server, and the whole
 * realm is saved in this browser's localStorage. Features that need a server (AI-suggested
 * sub-quests, reminders, syncing between phones) live in the private full edition.
 */
export const EDITION = "browser" as const;
export const AI_SUGGESTIONS = false;
