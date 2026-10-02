import type { AppState, CompletionLog, PublicUser } from "./types";
import {
  AVATAR_COLORS, POINTS, buildDefaultState, createDailyState, createDailyTask, createMainTask,
  createPleasureReward, createQuest, createSubQuest, createWeeklyState, generateId,
} from "./utils";

export function createMember(displayName: string, avatarColor: string, isAdmin = false): PublicUser {
  return {
    id: generateId(),
    email: "",
    displayName: displayName.trim(),
    avatarColor,
    createdAt: new Date().toISOString(),
    isAdmin,
  };
}

/** A made-up household with a few weeks of activity, so the board, leaderboard and annals have something to show. */
export function buildSampleRealm(theme: AppState["theme"]): AppState {
  const ana = createMember("Ana", AVATAR_COLORS[2], true);
  const ben = createMember("Ben", AVATAR_COLORS[0]);
  const users = [ana, ben];

  const quests = [
    createQuest("Deep-clean the kitchen", true, true),
    createQuest("Change the bed sheets", true, false),
    createQuest("Water the plants", true, false),
    createQuest("Take out the recycling", true, false),
    createQuest("Plan next week's meals", true, true),
    createQuest("Book the dentist", false, false),
    createQuest("Fix the wobbly chair", false, false),
    createQuest("Vacuum the stairs", true, false),
  ];

  const dailies = [
    createDailyTask("Feed the cats", true, "chore"),
    createDailyTask("Empty the dishwasher", false, "chore"),
    createDailyTask("30 minutes of reading", false, "personal", 5),
    createDailyTask("Go for a walk", false, "personal", 4),
  ];

  const garden = createMainTask("Turn the balcony into a garden", "Plants, a small table, fairy lights.", true);
  garden.subQuests = [
    createSubQuest("Measure the balcony", false),
    createSubQuest("Choose plants that like shade", true),
    createSubQuest("Buy pots and soil", false),
  ];
  const trip = createMainTask("Plan the summer trip", "Somewhere with mountains and good food.", true);
  trip.subQuests = [createSubQuest("Shortlist three destinations", true), createSubQuest("Check holiday dates", false)];

  const rewards = ["Breakfast in bed", "Pick the next movie night film", "A day off from chores", "Dinner at your favourite place"]
    .map(createPleasureReward);

  // This week's board: four quests drawn, two already done.
  const weekly = createWeeklyState(quests.slice(0, 4).map((q) => q.id));
  weekly.doneStatus[quests[1].id] = [ben.id];
  weekly.doneStatus[quests[2].id] = [ana.id];

  // Completions spread over the current month, so this month's leaderboard has a race in it.
  const log: CompletionLog[] = [];
  const now = Date.now();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const plan: Array<[number, string, number]> = [
    // [task index into the list below, who, points]
    [0, ana.id, POINTS.dailyChore], [2, ana.id, POINTS.dailyPersonal], [0, ben.id, POINTS.dailyChore],
    [1, ben.id, POINTS.dailyChore], [3, ben.id, POINTS.dailyPersonal], [0, ana.id, POINTS.dailyChore],
    [2, ana.id, POINTS.dailyPersonal], [4, ben.id, POINTS.recurringQuest], [5, ana.id, POINTS.recurringQuest],
    [0, ben.id, POINTS.dailyChore], [3, ben.id, POINTS.dailyPersonal], [6, ana.id, POINTS.oneTimeQuest],
    [2, ana.id, POINTS.dailyPersonal], [1, ben.id, POINTS.dailyChore],
  ];
  const tasks: Array<{ id: string; title: string; type: CompletionLog["taskType"] }> = [
    ...dailies.map((d) => ({ id: d.id, title: d.title, type: "daily" as const })),
    { id: quests[1].id, title: quests[1].title, type: "quest" },
    { id: quests[2].id, title: quests[2].title, type: "quest" },
    { id: quests[5].id, title: quests[5].title, type: "quest" },
  ];
  plan.forEach(([t, who, points], i) => {
    const at = monthStart + ((now - monthStart) * (i + 1)) / (plan.length + 1);
    log.push({ id: generateId(), taskId: tasks[t].id, taskTitle: tasks[t].title, taskType: tasks[t].type,
      completedByUserId: who, completedAt: new Date(at).toISOString(), points });
  });

  return {
    ...buildDefaultState(),
    users,
    currentUserId: ana.id,
    questPool: quests,
    dailyPool: dailies,
    mainTasks: [garden, trip],
    weeklyState: weekly,
    dailyState: createDailyState(),
    completionLog: log,
    pleasurePool: rewards,
    theme,
  };
}
