import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";

function getChildId(child) {
  return child.id ?? child.child_id ?? child.childId;
}

function getTaskId(task) {
  return task.id ?? task.task_id ?? task.taskId;
}

function isMustDoTask(task) {
  return String(task.task_type ?? task.taskType ?? "").toLowerCase() === "must_do";
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

function TaskRow({ task, onToggle, isUpdating }) {
  const isActive = task.is_active ?? task.isActive ?? true;

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-[24px] bg-[#F4F4F4] p-4">
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-[#1B1B1B]">{task.title}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-[#1B1B1B]/60">
          <span className="rounded-2xl bg-white px-3 py-1 font-semibold text-[#2D6A4F]">
            {task.points} pts
          </span>
          <span>{isActive ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={isUpdating}
        className={`flex h-12 w-20 items-center rounded-full p-1 transition ${
          isActive ? "bg-[#52B788]" : "bg-[#D0D0D0]"
        } ${isUpdating ? "opacity-70" : ""}`}
        aria-label={`Toggle ${task.title}`}
      >
        <span
          className={`h-10 w-10 rounded-full bg-white shadow-sm transition-transform ${
            isActive ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function TaskManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedChildId = searchParams.get("childId") || "";
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(
    requestedChildId,
  );
  const [tasks, setTasks] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("must_do");

  const points = taskType === "must_do" ? 10 : 5;

  useEffect(() => {
    let isMounted = true;

    async function loadChildren() {
      setIsLoadingChildren(true);
      setErrorMessage("");

      try {
        const response = await api.get("/children");
        const nextChildren = Array.isArray(response.data) ? response.data : [];

        if (!isMounted) {
          return;
        }

        setChildren(nextChildren);

        const availableIds = nextChildren.map((child) => String(getChildId(child)));
        const nextSelectedChildId =
          requestedChildId && availableIds.includes(requestedChildId)
            ? requestedChildId
            : availableIds[0] || "";

        setSelectedChildId(nextSelectedChildId);

        if (nextSelectedChildId) {
          setSearchParams({ childId: nextSelectedChildId }, { replace: true });
        }
      } catch {
        if (isMounted) {
          setChildren([]);
          setErrorMessage("We couldn't load child profiles right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingChildren(false);
        }
      }
    }

    loadChildren();

    return () => {
      isMounted = false;
    };
  }, [requestedChildId, setSearchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      if (!selectedChildId) {
        setTasks([]);
        return;
      }

      setIsLoadingTasks(true);
      setErrorMessage("");

      try {
        const response = await api.get(`/tasks/${selectedChildId}`);

        if (isMounted) {
          setTasks(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (isMounted) {
          setTasks([]);
          setErrorMessage("We couldn't load tasks for this child.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingTasks(false);
        }
      }
    }

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  async function handleToggleTask(task) {
    const taskId = getTaskId(task);

    if (!taskId) {
      return;
    }

    setUpdatingTaskId(taskId);
    setErrorMessage("");

    try {
      await api.patch(`/tasks/${taskId}/toggle`);
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          getTaskId(currentTask) === taskId
            ? {
                ...currentTask,
                is_active: !(currentTask.is_active ?? currentTask.isActive ?? true),
              }
            : currentTask,
        ),
      );
    } catch {
      setErrorMessage("We couldn't update that task right now.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedChildId || !title.trim()) {
      setErrorMessage("Add a task title before saving.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await api.post("/tasks", {
        child_id: selectedChildId,
        title: title.trim(),
        task_type: taskType,
        points,
      });

      const response = await api.get(`/tasks/${selectedChildId}`);
      setTasks(Array.isArray(response.data) ? response.data : []);
      setTitle("");
      setTaskType("must_do");
      setIsModalOpen(false);
    } catch {
      setErrorMessage("We couldn't save that task right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const mustDoTasks = tasks.filter((task) => isMustDoTask(task));
  const optionalTasks = tasks.filter((task) => !isMustDoTask(task));

  return (
    <main className="min-h-screen bg-[#F4F4F4] px-4 pb-28 pt-5 text-[#1B1B1B]">
      <div className="mx-auto w-full max-w-sm">
        <header className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#2D6A4F]/70">
            Task Manager
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1B1B1B]">
            Daily task setup
          </h1>
          <p className="mt-2 text-sm text-[#1B1B1B]/60">
            Switch between children, keep tasks active, and add new routines.
          </p>
        </header>

        <section className="mt-5">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {isLoadingChildren ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#1B1B1B]/60 shadow-sm">
                Loading children...
              </div>
            ) : null}

            {!isLoadingChildren &&
              children.map((child) => {
                const childId = String(getChildId(child));
                const isSelected = childId === selectedChildId;

                return (
                  <button
                    key={childId}
                    type="button"
                    onClick={() => {
                      setSelectedChildId(childId);
                      setSearchParams({ childId }, { replace: true });
                    }}
                    className={`min-h-12 shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isSelected
                        ? "bg-[#2D6A4F] text-white"
                        : "bg-white text-[#1B1B1B] shadow-sm"
                    }`}
                  >
                    {child.name}
                  </button>
                );
              })}
          </div>
        </section>

        {errorMessage ? (
          <div className="mt-4 rounded-[24px] bg-white p-4 text-sm text-[#1B1B1B]/70 shadow-sm">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-5 space-y-5">
          <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#1B1B1B]">Must-Do Tasks</h2>
                <p className="mt-1 text-sm text-[#1B1B1B]/55">
                  Core habits that count toward the daily streak.
                </p>
              </div>
              <span className="rounded-2xl bg-[#D8F3DC] px-3 py-2 text-sm font-semibold text-[#2D6A4F]">
                {mustDoTasks.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingTasks ? (
                <div className="rounded-[24px] bg-[#F4F4F4] p-4 text-sm text-[#1B1B1B]/60">
                  Loading tasks...
                </div>
              ) : mustDoTasks.length > 0 ? (
                mustDoTasks.map((task) => (
                  <TaskRow
                    key={getTaskId(task)}
                    task={task}
                    isUpdating={updatingTaskId === getTaskId(task)}
                    onToggle={() => handleToggleTask(task)}
                  />
                ))
              ) : (
                <div className="rounded-[24px] bg-[#F4F4F4] p-4 text-sm text-[#1B1B1B]/55">
                  No must-do tasks yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#1B1B1B]">Optional Tasks</h2>
                <p className="mt-1 text-sm text-[#1B1B1B]/55">
                  Bonus activities for extra points.
                </p>
              </div>
              <span className="rounded-2xl bg-[#D8F3DC] px-3 py-2 text-sm font-semibold text-[#2D6A4F]">
                {optionalTasks.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingTasks ? (
                <div className="rounded-[24px] bg-[#F4F4F4] p-4 text-sm text-[#1B1B1B]/60">
                  Loading tasks...
                </div>
              ) : optionalTasks.length > 0 ? (
                optionalTasks.map((task) => (
                  <TaskRow
                    key={getTaskId(task)}
                    task={task}
                    isUpdating={updatingTaskId === getTaskId(task)}
                    onToggle={() => handleToggleTask(task)}
                  />
                ))
              ) : (
                <div className="rounded-[24px] bg-[#F4F4F4] p-4 text-sm text-[#1B1B1B]/55">
                  No optional tasks yet.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2D6A4F] text-3xl text-white shadow-[0_20px_45px_-20px_rgba(45,106,79,0.85)]"
        aria-label="Add task"
      >
        +
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1B1B1B]/40 px-4 pb-4 pt-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-[32px] bg-white p-5 shadow-[0_30px_80px_-32px_rgba(27,27,27,0.45)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#2D6A4F]/70">
                  New Task
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">
                  Add a routine
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F4F4] text-2xl text-[#1B1B1B]"
                aria-label="Close task form"
              >
                {"\u00D7"}
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-[#1B1B1B]/75">
                Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Brush teeth"
                className="h-12 w-full rounded-2xl border border-[#D8F3DC] bg-[#F4F4F4] px-4 text-base text-[#1B1B1B] outline-none transition focus:border-[#52B788] focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-[#1B1B1B]/75">
                Task type
              </span>
              <select
                value={taskType}
                onChange={(event) => setTaskType(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#D8F3DC] bg-[#F4F4F4] px-4 text-base text-[#1B1B1B] outline-none transition focus:border-[#52B788] focus:bg-white"
              >
                <option value="must_do">Must-Do</option>
                <option value="optional">Optional</option>
              </select>
            </label>

            <div className="mt-4 rounded-[24px] bg-[#D8F3DC] p-4">
              <p className="text-sm font-medium text-[#1B1B1B]/65">Points</p>
              <p className="mt-1 text-2xl font-semibold text-[#2D6A4F]">{points}</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 min-h-12 w-full rounded-2xl bg-[#2D6A4F] px-4 py-3 text-base font-semibold text-white"
            >
              {isSubmitting ? "Saving..." : "Create task"}
            </button>
          </form>
        </div>
      ) : null}

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

export default TaskManager;
