function RewardCard({ reward, onDeliver, isDelivering = false }) {
  const currentPoints = reward.current_points ?? reward.currentPoints ?? 0;
  const pointsRequired =
    reward.points_required ?? reward.pointsRequired ?? reward.target_points ?? 0;
  const progressPercent =
    pointsRequired > 0 ? Math.min((currentPoints / pointsRequired) * 100, 100) : 0;
  const isUnlocked = reward.unlocked ?? currentPoints >= pointsRequired;

  return (
    <article className="rounded-[30px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#1B1B1B]/55">Reward</p>
          <h2 className="mt-1 text-xl font-semibold text-[#1B1B1B]">{reward.title}</h2>
        </div>
        <div className="rounded-2xl bg-[#D8F3DC] px-3 py-2 text-sm font-semibold text-[#2D6A4F]">
          {pointsRequired} pts
        </div>
      </div>

      <div className="mt-4 rounded-[24px] bg-[#F4F4F4] p-4">
        <div className="flex items-center justify-between gap-3 text-sm font-medium">
          <p className="text-[#1B1B1B]/65">Progress</p>
          <p className="text-[#2D6A4F]">
            {currentPoints}/{pointsRequired}
          </p>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white">
          <div
            className="h-3 rounded-full bg-[#52B788] transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onDeliver}
        disabled={!isUnlocked || isDelivering}
        className={`mt-4 min-h-12 w-full rounded-2xl px-4 py-3 text-base font-semibold ${
          isUnlocked
            ? "bg-[#2D6A4F] text-white"
            : "bg-[#D0D0D0] text-[#1B1B1B]/60"
        } ${isDelivering ? "opacity-70" : ""}`}
      >
        {isDelivering ? "Updating..." : "Mark as Delivered"}
      </button>
    </article>
  );
}

export default RewardCard;
