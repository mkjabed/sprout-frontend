function TaskItem({
  title,
  points,
  completed = false,
  disabled = false,
  onClick,
}) {
  const Container = onClick ? "button" : "div";

  return (
    <Container
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-16 w-full items-center gap-4 rounded-[24px] px-4 py-4 text-left transition ${
        completed
          ? "bg-[#D8F3DC] text-[#2D6A4F]"
          : "bg-[#F4F4F4] text-[#1B1B1B]"
      } ${onClick ? "active:scale-[0.99]" : ""} ${
        disabled ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 ${
          completed
            ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
            : "border-[#CFCFCF] bg-white text-transparent"
        }`}
        aria-hidden="true"
      >
        {"\u2713"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-6">{title}</p>
      </div>

      <div
        className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-semibold ${
          completed ? "bg-white/80 text-[#2D6A4F]" : "bg-white text-[#1B1B1B]/70"
        }`}
      >
        {points} pts
      </div>
    </Container>
  );
}

export default TaskItem;
