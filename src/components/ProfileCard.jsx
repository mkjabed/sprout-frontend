function ProfileCard({
  title,
  subtitle,
  onClick,
  locked = false,
  accent = "default",
}) {
  const accentStyles =
    accent === "guardian"
      ? "border-[#2D6A4F] bg-[#2D6A4F] text-white shadow-[0_20px_45px_-28px_rgba(45,106,79,0.8)]"
      : "border-white bg-white text-[#1B1B1B] shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]";

  const subtitleStyles =
    accent === "guardian" ? "text-white/80" : "text-[#1B1B1B]/60";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-20 w-full items-center justify-between rounded-[28px] border p-5 text-left transition duration-200 active:scale-[0.99] ${accentStyles}`}
    >
      <div className="pr-4">
        <p className="text-lg font-semibold">{title}</p>
        {subtitle ? <p className={`mt-1 text-sm ${subtitleStyles}`}>{subtitle}</p> : null}
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
          accent === "guardian" ? "bg-white/14" : "bg-[#D8F3DC] text-[#2D6A4F]"
        }`}
        aria-hidden="true"
      >
        {locked ? "\u{1F512}" : "\u{1F331}"}
      </div>
    </button>
  );
}

export default ProfileCard;
