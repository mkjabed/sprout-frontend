import { useEffect, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import RewardCard from "../components/RewardCard.jsx";

function getChildId(child) {
  return child.id ?? child.child_id ?? child.childId;
}

function getRewardId(reward) {
  return reward.id ?? reward.reward_id ?? reward.rewardId;
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

function RewardsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedChildId = searchParams.get("childId") || "";
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(requestedChildId);
  const [rewards, setRewards] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveringRewardId, setDeliveringRewardId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [title, setTitle] = useState("");
  const [pointsRequired, setPointsRequired] = useState("50");

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

    async function loadRewards() {
      if (!selectedChildId) {
        setRewards([]);
        return;
      }

      setIsLoadingRewards(true);
      setErrorMessage("");

      try {
        const response = await api.get(`/rewards/${selectedChildId}`);

        if (isMounted) {
          setRewards(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (isMounted) {
          setRewards([]);
          setErrorMessage("We couldn't load rewards for this child.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingRewards(false);
        }
      }
    }

    loadRewards();

    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  async function refreshRewards(childId) {
    const response = await api.get(`/rewards/${childId}`);
    setRewards(Array.isArray(response.data) ? response.data : []);
  }

  async function handleDeliverReward(reward) {
    const rewardId = getRewardId(reward);

    if (!rewardId) {
      return;
    }

    setDeliveringRewardId(rewardId);
    setErrorMessage("");

    try {
      await api.patch(`/rewards/${rewardId}/deliver`);
      await refreshRewards(selectedChildId);
    } catch {
      setErrorMessage("We couldn't update that reward right now.");
    } finally {
      setDeliveringRewardId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const numericPoints = Number(pointsRequired);

    if (!selectedChildId || !title.trim() || Number.isNaN(numericPoints) || numericPoints <= 0) {
      setErrorMessage("Enter a reward title and a valid points target.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await api.post("/rewards", {
        child_id: selectedChildId,
        title: title.trim(),
        points_required: numericPoints,
      });

      await refreshRewards(selectedChildId);
      setTitle("");
      setPointsRequired("50");
      setIsModalOpen(false);
    } catch {
      setErrorMessage("We couldn't save that reward right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F4F4] px-4 pb-28 pt-5 text-[#1B1B1B]">
      <div className="mx-auto w-full max-w-sm">
        <header className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#2D6A4F]/70">
                Rewards
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1B1B1B]">
                Reward tracker
              </h1>
              <p className="mt-2 text-sm text-[#1B1B1B]/60">
                Set point goals and mark rewards delivered when they are unlocked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="min-h-12 shrink-0 rounded-2xl bg-[#D8F3DC] px-4 text-sm font-semibold text-[#2D6A4F]"
            >
              Back to Kids View
            </button>
          </div>
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

        <section className="mt-5 space-y-4">
          {isLoadingRewards ? (
            <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/60 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
              Loading rewards...
            </div>
          ) : null}

          {!isLoadingRewards && rewards.length === 0 ? (
            <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/60 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
              No active rewards yet.
            </div>
          ) : null}

          {!isLoadingRewards &&
            rewards.map((reward) => (
              <RewardCard
                key={getRewardId(reward)}
                reward={reward}
                isDelivering={deliveringRewardId === getRewardId(reward)}
                onDeliver={() => handleDeliverReward(reward)}
              />
            ))}
        </section>
      </div>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2D6A4F] text-3xl text-white shadow-[0_20px_45px_-20px_rgba(45,106,79,0.85)]"
        aria-label="Add reward"
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
                  New Reward
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">
                  Add a reward goal
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F4F4] text-2xl text-[#1B1B1B]"
                aria-label="Close reward form"
              >
                {"\u00D7"}
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-[#1B1B1B]/75">
                Reward title
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Movie night"
                className="h-12 w-full rounded-2xl border border-[#D8F3DC] bg-[#F4F4F4] px-4 text-base text-[#1B1B1B] outline-none transition focus:border-[#52B788] focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-[#1B1B1B]/75">
                Points target
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={pointsRequired}
                onChange={(event) => setPointsRequired(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#D8F3DC] bg-[#F4F4F4] px-4 text-base text-[#1B1B1B] outline-none transition focus:border-[#52B788] focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 min-h-12 w-full rounded-2xl bg-[#2D6A4F] px-4 py-3 text-base font-semibold text-white"
            >
              {isSubmitting ? "Saving..." : "Create reward"}
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

export default RewardsPage;
