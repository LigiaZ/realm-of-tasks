"use client";

import React, { useState } from "react";
import { useStore, useCurrentUser } from "@/lib/store";
import { WeeklyTaskCard, QuestPoolSection } from "./WeeklyTaskCard";
import { DailyTasksView } from "./DailyTasksView";
import { HistoryView } from "./HistoryView";
import { MainTasksView } from "./MainTasksView";
import { LeaderboardView } from "./LeaderboardView";
import { AddTaskModal } from "./AddTaskModal";
import { ProfileModal } from "./ProfileModal";
import { MembersModal } from "./MembersModal";
import { UserAvatar } from "./UserAvatar";
import { WelcomeScreen } from "./WelcomeScreen";

type Tab = "quests" | "daily" | "main" | "glory" | "annals";

const TABS: { id: Tab; label: string; icon: string; ariaLabel: string }[] = [
  { id: "quests", label: "Quests",     icon: "⚔️",  ariaLabel: "Weekly quests" },
  { id: "daily",  label: "Daily",      icon: "🕯️",  ariaLabel: "Daily deeds" },
  { id: "main",   label: "Main Tasks", icon: "🏰",  ariaLabel: "Main tasks – big goals" },
  { id: "glory",  label: "Glory",      icon: "🏆",  ariaLabel: "Points leaderboard" },
  { id: "annals", label: "Annals",     icon: "📜",  ariaLabel: "History" },
];

export function AppShell() {
  const { state, dispatch, loaded } = useStore();
  const currentUser = useCurrentUser();

  const [activeTab, setActiveTab] = useState<Tab>("quests");
  const [addOpen, setAddOpen] = useState(false);
  const [defaultKind, setDefaultKind] = useState<"quest" | "daily" | "mainTask">("quest");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  function switchTo(userId: string | null) {
    dispatch({ type: "SET_CURRENT_USER", payload: { userId } });
    setProfileOpen(false);
  }

  // Wait until the saved realm has been read from this browser.
  if (!loaded) return null;

  if (!currentUser) return <WelcomeScreen />;

  function openAdd(kind: "quest" | "daily" | "mainTask" = "quest") {
    setDefaultKind(kind);
    setAddOpen(true);
  }

  const currentUserId = state.currentUserId ?? "unknown";
  // Count daily tasks that are "fully done" for the household (any user completed = done)
  const completedToday = state.dailyPool.filter((t) => {
    const done: string[] = state.dailyState.completedByUserIds[t.id] ?? [];
    return done.length >= 1;
  }).length;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--color-bg)" }}>

      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: "var(--gradient-header)", borderBottom: "1px solid var(--color-border-gold)", boxShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0 animate-flicker" aria-hidden style={{ filter: "drop-shadow(0 0 6px rgba(130,140,106,0.5))" }}>⚔️</span>
            <div className="min-w-0">
              <h1 className="font-bold leading-tight text-sm sm:text-base truncate text-gold-gradient" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}>
                Realm of Tasks
              </h1>
              <p className="text-[0.55rem] tracking-widest uppercase hidden sm:block" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
                Household Quest Board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.dailyPool.length > 0 && (
              <span className="hidden sm:block text-xs" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}
                aria-label={`${completedToday} of ${state.dailyPool.length} daily deeds done`}>
                🕯️ {completedToday}/{state.dailyPool.length}
              </span>
            )}

            <button onClick={() => dispatch({ type: "SET_THEME", payload: { theme: state.theme === "dark" ? "light" : "dark" } })}
              aria-label="Toggle light" className="w-8 h-8 flex items-center justify-center text-sm border rounded-sm transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.3)" }}>
              {state.theme === "dark" ? "☀️" : "🌙"}
            </button>

            <button onClick={() => openAdd("quest")} aria-label="Add new quest"
              className="w-8 h-8 flex items-center justify-center text-sm font-bold border rounded-sm transition-all"
              style={{ background: "linear-gradient(180deg,var(--sage) 0%,var(--reseda-dark) 100%)", borderColor: "var(--reseda-dark)", color: "var(--blush)" }}>
              +
            </button>

            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} aria-label="Adventurer menu" aria-expanded={profileOpen}
                className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--reseda-readable)]"
                style={{ filter: profileOpen ? "drop-shadow(0 0 6px rgba(130,140,106,0.5))" : undefined }}>
                <UserAvatar displayName={currentUser.displayName} avatarColor={currentUser.avatarColor} size="sm" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-10 z-50 w-56 animate-fade-in border"
                    style={{ background: "var(--gradient-card)", borderColor: "var(--color-border-gold)", borderRadius: "2px", boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}>
                    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                      <UserAvatar displayName={currentUser.displayName} avatarColor={currentUser.avatarColor} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs tracking-wide" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>{currentUser.displayName}</p>
                        <p className="text-[0.65rem] truncate" style={{ color: "var(--color-text-muted)" }}>Playing now</p>
                      </div>
                    </div>
                    <div className="py-1">
                      {/* Switch to other household member */}
                      {state.users.filter((u) => u.id !== currentUser.id).map((u) => (
                        <button key={u.id} onClick={() => switchTo(u.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors"
                          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(130,140,106,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                          <UserAvatar displayName={u.displayName} avatarColor={u.avatarColor} size="xs" />
                          <span>Switch to {u.displayName}</span>
                        </button>
                      ))}

                      {/* Invite member — always accessible */}
                      <button
                        onClick={() => { setProfileOpen(false); setInviteOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                        style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(130,140,106,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        📜 Adventurers of the Realm
                      </button>

                      <button onClick={() => switchTo(null)}
                        className="w-full text-left px-4 py-2.5 text-xs border-t transition-colors"
                        style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--coral)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}>
                        Back to the gate
                      </button>
                      <button
                        onClick={() => { setProfileOpen(false); setProfileModalOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-xs border-t transition-colors"
                        style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--reseda-readable)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}>
                        🎨 Sigil &amp; Realm
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5" id="main-content">
        {activeTab === "quests" && (
          <section className="animate-fade-in">
            {/* Invite banner — shown when the realm has only one adventurer */}
            {state.users.length === 1 && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-sm border px-4 py-3"
                style={{ background: "rgba(130,140,106,0.08)", borderColor: "var(--reseda-dark)" }}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
                    📜 Add an Adventurer
                  </p>
                  <p className="text-[0.65rem] italic mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
                    Quests are more fun with the whole household
                  </p>
                </div>
                <button
                  onClick={() => setInviteOpen(true)}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest border transition-all rounded-sm"
                  style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", background: "linear-gradient(180deg,var(--sage) 0%,var(--reseda-dark) 100%)", color: "var(--blush)" }}
                >
                  Add
                </button>
              </div>
            )}
            <WeeklyTaskCard onAddQuest={() => openAdd("quest")} />
            <QuestPoolSection onAddQuest={() => openAdd("quest")} />
          </section>
        )}
        {activeTab === "daily" && (
          <section className="animate-fade-in">
            <DailyTasksView onAddTask={() => openAdd("daily")} />
          </section>
        )}
        {activeTab === "main" && (
          <section className="animate-fade-in">
            <MainTasksView onAddTask={() => openAdd("mainTask")} />
          </section>
        )}
        {activeTab === "glory" && (
          <section className="animate-fade-in">
            <LeaderboardView />
          </section>
        )}
        {activeTab === "annals" && (
          <section className="animate-fade-in">
            <HistoryView />
          </section>
        )}
      </main>

      {/* Bottom nav */}
      <nav aria-label="Main navigation" className="sticky bottom-0 z-40"
        style={{ background: "var(--gradient-header)", borderTop: "1px solid var(--color-border-gold)", boxShadow: "0 -2px 20px rgba(0,0,0,0.8)" }}>
        <ul className="max-w-2xl mx-auto flex items-stretch" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} className="flex-1 relative" role="presentation">
                <button role="tab" aria-selected={isActive} aria-label={tab.ariaLabel}
                  onClick={() => setActiveTab(tab.id)}
                  className={["w-full flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--reseda-readable)]", isActive ? "" : ""].join(" ")}
                  style={{ color: isActive ? "var(--reseda-readable)" : "var(--color-text-muted)", background: isActive ? "rgba(130,140,106,0.06)" : "transparent" }}>
                  <span className={["text-lg leading-none transition-all", isActive ? "scale-110" : "scale-100"].join(" ")} aria-hidden
                    style={{ filter: isActive ? "drop-shadow(0 0 4px rgba(130,140,106,0.6))" : undefined }}>
                    {tab.icon}
                  </span>
                  <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)" }}>{tab.label}</span>
                  {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5" style={{ background: "linear-gradient(90deg,var(--reseda),var(--sage))" }} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} defaultKind={defaultKind} />
      <ProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <MembersModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
