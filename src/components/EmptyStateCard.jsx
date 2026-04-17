function EmptyStateCard({ eyebrow, title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-[28px] border border-[#D8F3DC] bg-[#F8FFF9] p-5 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.22)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#D8F3DC] text-2xl text-[#2D6A4F]">
        {"\u2728"}
      </div>
      {eyebrow ? (
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2D6A4F]/65">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-2 text-lg font-semibold text-[#1B1B1B]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#1B1B1B]/60">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-12 rounded-[18px] bg-[#2D6A4F] px-4 text-sm font-semibold text-white"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyStateCard;
