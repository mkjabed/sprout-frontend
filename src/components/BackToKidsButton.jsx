function BackToKidsButton({ onClick, variant = "light" }) {
  const className =
    variant === "dark"
      ? "bg-white/14 text-white ring-1 ring-white/18"
      : "bg-[#D8F3DC] text-[#2D6A4F] ring-1 ring-[#2D6A4F]/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-[20px] px-4 text-sm font-semibold shadow-[0_14px_28px_-18px_rgba(27,27,27,0.35)] transition ${className}`}
    >
      <span className="text-base" aria-hidden="true">
        {"\u2190"}
      </span>
      <span>Kids View</span>
    </button>
  );
}

export default BackToKidsButton;
