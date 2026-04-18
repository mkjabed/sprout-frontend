import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import BackToKidsButton from "../components/BackToKidsButton.jsx";
import { useAuth } from "../context/useAuth.js";

function getChildId(child) {
  return child.id ?? child.child_id ?? child.childId;
}

function getActiveReward(payload) {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return (
      payload.find((reward) => reward.active ?? reward.is_active ?? !reward.delivered) ||
      payload[0] ||
      null
    );
  }

  if (payload.active_reward) {
    return payload.active_reward;
  }

  if (payload.reward) {
    return payload.reward;
  }

  if (Array.isArray(payload.rewards)) {
    return getActiveReward(payload.rewards);
  }

  return payload;
}

function getCompletedValue(log) {
  return Boolean(
    log.completed ??
      log.is_completed ??
      log.done ??
      (log.status === "completed" || log.status === "done"),
  );
}

function getTaskPoints(log) {
  return log.points ?? log.task?.points ?? log.task_points ?? log.taskPoints ?? 0;
}

function getRewardProgress(reward, logs, dailyPayload) {
  if (!reward) {
    return 0;
  }

  return (
    reward.current_points ??
    reward.currentPoints ??
    dailyPayload?.current_points ??
    dailyPayload?.total_points ??
    logs
      .filter((log) => getCompletedValue(log))
      .reduce((total, log) => total + getTaskPoints(log), 0)
  );
}

function getRewardTarget(reward) {
  return reward?.points_required ?? reward?.pointsRequired ?? reward?.target_points ?? 0;
}

function getMustDoLabel(totalCount) {
  return totalCount === 1 ? "task" : "tasks";
}

function BottomNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-semibold transition ${
          isActive
            ? "bg-[#2D6A4F] text-white"
            : "bg-[#F4F4F4] text-[#1B1B1B]/60"
        }`
      }
    >
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <span className="mt-1">{label}</span>
    </NavLink>
  );
}

function GuardianDashboard() {
  const navigate = useNavigate();
  const { guardian, logout } = useAuth();
  const [childSummaries, setChildSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const childrenResponse = await api.get("/children");
        console.log("Dashboard children response:", childrenResponse.data);
        const children = Array.isArray(childrenResponse.data)
          ? childrenResponse.data
          : childrenResponse.data?.children || [];

        const summaryResults = await Promise.all(
          children.map(async (child) => {
            const childId = getChildId(child);
            console.log("Dashboard summary childId:", childId);

            try {
              const dailyResponse = await api.get(`/daily/${childId}`);
              let rewardPayload = null;
              try {
                const rewardResponse = await api.get(`/rewards/${childId}`);
                rewardPayload = rewardResponse.data;
                console.log("Dashboard reward response:", rewardPayload);
              } catch {
                rewardPayload = null;
              }

              const dailyData = dailyResponse.data;
              const logs = Array.isArray(dailyData?.logs) ? dailyData.logs : [];
              // #region agent log
              fetch("http://127.0.0.1:7431/ingest/9cd82570-c4df-416f-b140-0564c0545897", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Debug-Session-Id": "aae688",
                },
                body: JSON.stringify({
                  sessionId: "aae688",
                  location: "GuardianDashboard.jsx:loadDashboard",
                  message: "GET /daily per child",
                  data: {
                    childId,
                    logsLen: logs.length,
                    completedRaw: logs.filter((l) => l.completed === true).length,
                    completedLoose: logs.filter((l) => getCompletedValue(l)).length,
                    rewardSkipped: rewardPayload === null,
                  },
                  timestamp: Date.now(),
                  hypothesisId: "E",
                }),
              }).catch(() => {});
              // #endregion
              const activeReward = getActiveReward(rewardPayload);
              const completedCount = logs.filter((l) => getCompletedValue(l)).length;
              const totalCount = logs.length;
              const rewardProgress = getRewardProgress(activeReward, logs, dailyData);
              const rewardTarget = getRewardTarget(activeReward);

              return {
                id: childId,
                name: dailyData?.child_name || child.name || child.child_name || "Child",
                grade: child.grade || child.class_name || "No grade yet",
                streak: dailyData?.streak ?? 0,
                completedCount,
                totalCount,
                taskProgress: totalCount ? (completedCount / totalCount) * 100 : 0,
                rewardName: activeReward?.title || activeReward?.name || "No active reward",
                rewardProgress,
                rewardTarget,
                rewardPercent:
                  rewardTarget > 0 ? Math.min((rewardProgress / rewardTarget) * 100, 100) : 0,
              };
            } catch {
              return {
                id: childId,
                name: child.name || child.child_name || "Child",
                grade: child.grade || child.class_name || "No grade yet",
                streak: 0,
                completedCount: 0,
                totalCount: 0,
                taskProgress: 0,
                rewardName: "No active reward",
                rewardProgress: 0,
                rewardTarget: 0,
                rewardPercent: 0,
              };
            }
          }),
        );

        if (isMounted) {
          setChildSummaries(summaryResults);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("We couldn't load the dashboard right now.");
          setChildSummaries([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const guardianName = guardian?.name || guardian?.full_name || "Guardian";

  return (
    <main className="min-h-screen bg-[#F4F4F4] px-4 pb-28 pt-5 text-[#1B1B1B]">
      <div className="mx-auto w-full max-w-sm">
        <header className="rounded-[30px] bg-[#2D6A4F] p-5 text-white shadow-[0_24px_65px_-30px_rgba(45,106,79,0.8)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                Guardian Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                Hi, {guardianName}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                A quick look at today&apos;s progress across your family.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <BackToKidsButton
                onClick={() => navigate("/")}
                variant="dark"
              />
              <button
                type="button"
                onClick={logout}
                className="min-h-12 rounded-2xl bg-white/14 px-4 text-sm font-semibold text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <section className="mt-5 space-y-4">
          {isLoading ? (
            <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/65 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
              Loading today&apos;s dashboard...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/65 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && childSummaries.length === 0 ? (
            <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/65 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
              No child profiles are ready yet.
            </div>
          ) : null}

          {!isLoading &&
            childSummaries.map((child) => (
              <article
                key={child.id}
                className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#1B1B1B]">
                      {child.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#1B1B1B]/55">{child.grade}</p>
                  </div>
                  <div className="rounded-2xl bg-[#D8F3DC] px-3 py-2 text-sm font-semibold text-[#2D6A4F]">
                    {"\u{1F525}"} {child.streak}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <section>
                    <div className="flex items-center justify-between text-sm font-medium">
                      <p className="text-[#1B1B1B]/70">Today&apos;s tasks</p>
                      <p className="text-[#2D6A4F]">
                        {child.completedCount}/{child.totalCount} completed
                      </p>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-[#F4F4F4]">
                      <div
                        className="h-3 rounded-full bg-[#52B788] transition-[width]"
                        style={{ width: `${child.taskProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#1B1B1B]/50">
                      {child.totalCount} {getMustDoLabel(child.totalCount)} tracked today
                    </p>
                  </section>

                  <section className="rounded-[24px] bg-[#F4F4F4] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#1B1B1B]/60">Active reward</p>
                        <p className="mt-1 text-base font-semibold text-[#1B1B1B]">
                          {child.rewardName}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#2D6A4F]">
                        {child.rewardProgress}/{child.rewardTarget || 0} pts
                      </p>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-white">
                      <div
                        className="h-3 rounded-full bg-[#2D6A4F] transition-[width]"
                        style={{ width: `${child.rewardPercent}%` }}
                      />
                    </div>
                  </section>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/tasks?childId=${child.id}`)}
                    className="min-h-12 rounded-2xl bg-[#1B1B1B] px-4 text-sm font-semibold text-white"
                  >
                    View Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/child/${child.id}`)}
                    className="min-h-12 rounded-2xl bg-[#D8F3DC] px-4 text-sm font-semibold text-[#2D6A4F]"
                  >
                    View Scorecard
                  </button>
                </div>
              </article>
            ))}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-[#1B1B1B]/8 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-sm items-center gap-2">
          <BottomNavItem to="/dashboard" icon={"\u2302"} label="Dashboard" />
          <BottomNavItem to="/tasks" icon={"\u2713"} label="Tasks" />
          <BottomNavItem to="/rewards" icon={"\u2605"} label="Rewards" />
        </div>
      </nav>
    </main>
  );
}

export default GuardianDashboard;
