import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios.js";
import CelebrationScreen from "../components/CelebrationScreen.jsx";
import EmptyStateCard from "../components/EmptyStateCard.jsx";
import TaskItem from "../components/TaskItem.jsx";

function getDailyLogs(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.logs)) {
    return payload.logs;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function getChildName(payload, logs, child, childId) {
  return (
    child?.name ||
    payload?.child_name ||
    payload?.child?.name ||
    logs[0]?.child_name ||
    logs[0]?.child?.name ||
    `Child ${childId}`
  );
}

function getCompletedValue(log) {
  return Boolean(
    log.completed ??
      log.is_completed ??
      log.done ??
      (log.status === "completed" || log.status === "done"),
  );
}

function getTaskTitle(log) {
  return log.task?.title || log.title || log.task_title || "Task";
}

function getTaskPoints(log) {
  return log.points ?? log.task?.points ?? log.task_points ?? log.taskPoints ?? 0;
}

function getTaskType(log) {
  const rawType = log.task?.task_type || log.task_type || log.type || "";
  return String(rawType).toLowerCase();
}

function isMustDoTask(log) {
  const taskType = getTaskType(log);
  return taskType === "must-do" || taskType === "must_do" || taskType === "required";
}

function getReward(payload) {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload) && payload.length > 0) {
    return payload.find((item) => !item.is_delivered) || payload[0];
  }

  if (payload.reward) {
    return payload.reward;
  }

  if (payload.active_reward) {
    return payload.active_reward;
  }

  if (Array.isArray(payload?.rewards) && payload.rewards.length > 0) {
    return payload.rewards[0];
  }

  return null;
}

function getLogId(log) {
  return log.log_id ?? log.id;
}

function ChildScorecard() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [dailyPayload, setDailyPayload] = useState(null);
  const [logs, setLogs] = useState([]);
  const [reward, setReward] = useState(null);
  const [pointsEarnedToday, setPointsEarnedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [pendingLogId, setPendingLogId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadScorecard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [childResponse, dailyResponse, rewardResponse] = await Promise.all([
          api.get(`/children/${childId}`),
          api.get(`/daily/${childId}`),
          api.get(`/rewards/${childId}`),
        ]);
        const nextChild = childResponse.data || null;
        const nextPayload = dailyResponse.data;
        const nextLogs = getDailyLogs(nextPayload);
        const nextReward = getReward(rewardResponse.data);
        const earnedPoints = nextLogs.reduce(
          (total, log) => total + (getCompletedValue(log) ? getTaskPoints(log) : 0),
          0,
        );
        const mustDoLogs = nextLogs.filter((log) => isMustDoTask(log));
        const allMustDoComplete =
          mustDoLogs.length > 0 &&
          mustDoLogs.every((log) => getCompletedValue(log));

        if (isMounted) {
          setChild(nextChild);
          setDailyPayload(nextPayload);
          setLogs(nextLogs);
          setReward(nextReward);
          setPointsEarnedToday(earnedPoints);
          setStreak(nextPayload?.streak ?? nextPayload?.current_streak ?? 0);
          setIsCelebrationOpen(allMustDoComplete);
        }
      } catch {
        if (isMounted) {
          setChild(null);
          setDailyPayload(null);
          setLogs([]);
          setReward(null);
          setPointsEarnedToday(0);
          setStreak(0);
          setIsCelebrationOpen(false);
          setErrorMessage("We couldn't load today's scorecard right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadScorecard();

    return () => {
      isMounted = false;
    };
  }, [childId]);

  async function handleTaskComplete(log) {
    const logId = getLogId(log);

    if (!logId || getCompletedValue(log) || pendingLogId) {
      return;
    }

    setPendingLogId(logId);
    setErrorMessage("");

    try {
      const response = await api.post(`/daily/${logId}/complete`);
      const pointsEarned = response.data?.points_earned ?? getTaskPoints(log);
      const nextLogs = logs.map((currentLog) =>
        getLogId(currentLog) === logId
          ? {
              ...currentLog,
              completed: true,
              points_earned: pointsEarned,
            }
          : currentLog,
      );
      const mustDoLogs = nextLogs.filter((currentLog) => isMustDoTask(currentLog));
      const allMustDoComplete =
        mustDoLogs.length > 0 &&
        mustDoLogs.every((currentLog) => getCompletedValue(currentLog));

      setLogs(nextLogs);
      setPointsEarnedToday((currentPoints) => currentPoints + pointsEarned);
      setReward((currentReward) =>
        currentReward
          ? {
              ...currentReward,
              current_points: (currentReward.current_points ?? 0) + pointsEarned,
            }
          : currentReward,
      );
      setStreak(response.data?.streak ?? streak);

      if (allMustDoComplete) {
        setIsCelebrationOpen(true);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.status === 400
          ? "That task is already complete."
          : "We couldn't update that task right now.",
      );
    } finally {
      setPendingLogId(null);
    }
  }

  const childName = getChildName(dailyPayload, logs, child, childId);
  const mustDoTasks = logs.filter((log) => isMustDoTask(log));
  const optionalTasks = logs.filter((log) => !isMustDoTask(log));
  const rewardName = reward?.title || reward?.name || "Next reward";
  const rewardTarget =
    reward?.points_required ?? reward?.pointsRequired ?? reward?.target_points ?? 0;
  const rewardProgress =
    reward?.current_points ?? reward?.currentPoints ?? pointsEarnedToday;
  const rewardRemaining = Math.max(rewardTarget - rewardProgress, 0);
  const rewardPercent =
    rewardTarget > 0 ? Math.min((rewardProgress / rewardTarget) * 100, 100) : 0;
  const hasReward = Boolean(reward);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#D8F3DC] px-4 pb-10 pt-5 text-[#1B1B1B]">
      <div className="mx-auto w-full max-w-sm">
        <header className="rounded-[30px] bg-white p-5 shadow-[0_22px_55px_-30px_rgba(27,27,27,0.35)]">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#2D6A4F]/70">
            Daily Scorecard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#1B1B1B]">
            Hey {childName}! {"\u{1F44B}"}
          </h1>
          <p className="mt-2 text-sm text-[#1B1B1B]/55">{todayLabel}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-[#F4F4F4] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                Points today
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#2D6A4F]">
                {pointsEarnedToday}
              </p>
            </div>
            <div className="rounded-[24px] bg-[#2D6A4F] p-4 text-white">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">
                Current streak
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {"\u{1F525}"} {streak}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-5 space-y-5">
          {isLoading ? (
            <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/60 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
              Loading today's tasks...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/60 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage ? (
            <>
              <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1B1B1B]">Must-Do Tasks</h2>
                    <p className="mt-1 text-sm text-[#1B1B1B]/55">
                      Finish these first to grow today's streak.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#D8F3DC] px-3 py-2 text-sm font-semibold text-[#2D6A4F]">
                    {mustDoTasks.filter((log) => getCompletedValue(log)).length}/{mustDoTasks.length}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {mustDoTasks.length > 0 ? (
                    mustDoTasks.map((log) => (
                      <TaskItem
                        key={getLogId(log) ?? getTaskTitle(log)}
                        title={getTaskTitle(log)}
                        points={getTaskPoints(log)}
                        completed={getCompletedValue(log)}
                        disabled={Boolean(pendingLogId)}
                        onClick={() => handleTaskComplete(log)}
                      />
                    ))
                  ) : (
                    <EmptyStateCard
                      eyebrow="Must-Do Tasks"
                      title="No must-do tasks yet"
                      description="A guardian can add the main routines for today, then they will appear here for you to complete."
                    />
                  )}
                </div>
              </section>

              <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
                <div>
                  <h2 className="text-xl font-semibold text-[#1B1B1B]">Optional Tasks</h2>
                  <p className="mt-1 text-sm text-[#1B1B1B]/55">
                    Extra chances to earn more points today.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {optionalTasks.length > 0 ? (
                    optionalTasks.map((log) => (
                      <TaskItem
                        key={getLogId(log) ?? getTaskTitle(log)}
                        title={getTaskTitle(log)}
                        points={getTaskPoints(log)}
                        completed={getCompletedValue(log)}
                        disabled={Boolean(pendingLogId)}
                        onClick={() => handleTaskComplete(log)}
                      />
                    ))
                  ) : (
                    <EmptyStateCard
                      eyebrow="Optional Tasks"
                      title="No bonus tasks yet"
                      description="Optional activities will show up here when a guardian adds extra ways to earn points."
                    />
                  )}
                </div>
              </section>

              {hasReward ? (
                <section className="rounded-[30px] bg-[#1B1B1B] p-5 text-white shadow-[0_18px_40px_-28px_rgba(27,27,27,0.6)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white/65">Active reward</p>
                      <h2 className="mt-1 text-xl font-semibold">{rewardName}</h2>
                    </div>
                    <p className="text-sm font-semibold text-[#D8F3DC]">
                      {rewardProgress}/{rewardTarget || 0}
                    </p>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-white/15">
                    <div
                      className="h-3 rounded-full bg-[#52B788] transition-[width]"
                      style={{ width: `${rewardPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-white/72">
                    {rewardRemaining > 0
                      ? `${rewardName} - ${rewardRemaining} more points needed`
                      : `${rewardName} is ready to unlock`}
                  </p>
                </section>
              ) : (
                <EmptyStateCard
                  eyebrow="Reward Goal"
                  title="No reward goal yet"
                  description="A guardian can set a reward for this child, and then point progress will start filling up here."
                />
              )}
            </>
          ) : null}
        </section>
      </div>

      <CelebrationScreen
        isOpen={isCelebrationOpen}
        childName={childName}
        pointsEarned={pointsEarnedToday}
        streak={streak}
        onClose={() => setIsCelebrationOpen(false)}
      />
    </main>
  );
}

export default ChildScorecard;
