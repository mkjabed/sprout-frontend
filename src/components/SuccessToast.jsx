import { useEffect } from "react";

function SuccessToast({ message, onClose }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto w-full max-w-sm">
      <div className="flex min-h-12 items-center gap-3 rounded-[24px] border border-[#D8F3DC] bg-white px-4 py-3 text-sm text-[#1B1B1B] shadow-[0_18px_40px_-28px_rgba(27,27,27,0.4)]">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D8F3DC] text-base text-[#2D6A4F]"
          aria-hidden="true"
        >
          {"\u2713"}
        </span>
        <p className="flex-1 font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F4F4] text-lg text-[#1B1B1B]/60 transition hover:text-[#1B1B1B]"
          aria-label="Dismiss message"
        >
          {"\u00D7"}
        </button>
      </div>
    </div>
  );
}

export default SuccessToast;
