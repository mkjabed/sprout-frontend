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

function createChildSummary(child) {
  return {
    id: getChildId(child),
    name: child.name || child.child_name || "Child",
    grade: child.grade ? `Grade ${child.grade}` : "No grade yet",
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
  const [isAddChildExpanded, setIsAddChildExpanded] = useState(false);
  const [childForm, setChildForm] = useState({
    name: "",
    grade: "",
    age: "",
  });
  const [childFormError, setChildFormError] = useState("");
  const [isCreatingChild, setIsCreatingChild] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const childrenResponse = await api.get("/children");
        const children = Array.isArray(childrenResponse.data)
          ? childrenResponse.data
          : childrenResponse.data?.children || [];

        const summaryResults = await Promise.all(
          children.map(async (child) => {
            const childId = getChildId(child);

            try {
              const dailyResponse = await api.get(`/daily/${childId}`);
              let rewardPayload = null;
              try {
                const rewardResponse = await api.get(`/rewards/${childId}`);
                rewardPayload = rewardResponse.data;
              } catch {
                rewardPayload = null;
              }

              const dailyData = dailyResponse.data;
              const logs = Array.isArray(dailyData?.logs) ? dailyData.logs : [];
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
              return createChildSummary(child);
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

  function handleChildFormChange(event) {
    const { name, value } = event.target;

    setChildForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleCancelAddChild() {
    if (isCreatingChild) {
      return;
    }

    setIsAddChildExpanded(false);
    setChildForm({
      name: "",
      grade: "",
      age: "",
    });
    setChildFormError("");
  }

  async function handleCreateChild(event) {
    event.preventDefault();

    const trimmedName = childForm.name.trim();
    const grade = Number(childForm.grade);
    const age = Number(childForm.age);

    if (!trimmedName) {
      setChildFormError("Add your child's name to continue.");
      return;
    }

    if (!Number.isInteger(grade) || grade < 1 || grade > 8) {
      setChildFormError("Grade should be a whole number from 1 to 8.");
      return;
    }

    if (!Number.isInteger(age) || age < 6 || age > 14) {
      setChildFormError("Age should be a whole number from 6 to 14.");
      return;
    }

    setIsCreatingChild(true);
    setChildFormError("");

    try {
      const response = await api.post("/children", {
        name: trimmedName,
        grade,
        age,
      });

      setChildSummaries((currentChildren) => [
        ...currentChildren,
        createChildSummary(response.data),
      ]);
      setChildForm({
        name: "",
        grade: "",
        age: "",
      });
      setIsAddChildExpanded(false);
    } catch (error) {
      setChildFormError(
        error.response?.data?.detail || "We couldn't create that child profile yet.",
      );
    } finally {
      setIsCreatingChild(false);
    }
  }

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

          {!isLoading && !errorMessage ? (
            isAddChildExpanded ? (
              <form
                onSubmit={handleCreateChild}
                className="rounded-[30px] border-2 border-dashed border-[#2D6A4F] bg-[#D8F3DC] p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                    New child profile
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#1B1B1B]">
                    Add a child
                  </h2>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                      Child name
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={childForm.name}
                      onChange={handleChildFormChange}
                      className="mt-2 min-h-12 w-full rounded-2xl bg-[#F4F4F4] px-4 py-3 text-[#1B1B1B] outline-none"
                      placeholder="Avery"
                      autoComplete="off"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                      Grade
                    </span>
                    <input
                      type="number"
                      name="grade"
                      value={childForm.grade}
                      onChange={handleChildFormChange}
                      className="mt-2 min-h-12 w-full rounded-2xl bg-[#F4F4F4] px-4 py-3 text-[#1B1B1B] outline-none"
                      placeholder="3"
                      min="1"
                      max="8"
                      inputMode="numeric"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                      Age
                    </span>
                    <input
                      type="number"
                      name="age"
                      value={childForm.age}
                      onChange={handleChildFormChange}
                      className="mt-2 min-h-12 w-full rounded-2xl bg-[#F4F4F4] px-4 py-3 text-[#1B1B1B] outline-none"
                      placeholder="8"
                      min="6"
                      max="14"
                      inputMode="numeric"
                    />
                  </label>

                  {childFormError ? (
                    <p className="rounded-2xl bg-[#F4F4F4] px-4 py-3 text-sm text-[#1B1B1B]/60">
                      {childFormError}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={isCreatingChild}
                      className="min-h-12 rounded-2xl bg-[#2D6A4F] px-5 py-3 font-semibold text-white"
                    >
                      {isCreatingChild ? "Adding..." : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddChild}
                      disabled={isCreatingChild}
                      className="min-h-12 rounded-2xl bg-[#F4F4F4] px-5 py-3 font-semibold text-[#1B1B1B]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAddChildExpanded(true);
                  setChildFormError("");
                }}
                className="flex min-h-12 w-full items-center justify-center rounded-[30px] border-2 border-dashed border-[#2D6A4F] bg-[#D8F3DC] px-5 py-6 text-center text-lg font-semibold tracking-[-0.04em] text-[#2D6A4F] shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]"
              >
                + Add a child
              </button>
            )
          ) : null}
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
