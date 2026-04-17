function CelebrationScreen({
  isOpen,
  childName,
  pointsEarned,
  streak,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D6A4F] px-6 py-8 text-white">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-white/10 p-6 text-center shadow-[0_30px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="text-6xl" aria-hidden="true">
          {"\u{1F389}"}
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          All done, {childName}!
        </h2>
        <p className="mt-3 text-base text-white/85">
          You earned {pointsEarned} points today!
        </p>
        <div className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white/14 px-4 py-3 text-base font-semibold">
          {"\u{1F525}"} {streak} day streak!
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-12 w-full rounded-2xl bg-white px-4 py-3 text-base font-semibold text-[#2D6A4F]"
        >
          See you tomorrow {"\u{1F331}"}
        </button>
      </div>
    </div>
  );
}

export default CelebrationScreen;
