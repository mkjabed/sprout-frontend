import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/useAuth.js";

function PinModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem("sprout_email") || "");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  const pin = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    if (!isOpen) {
      setDigits(["", "", "", ""]);
      setErrorMessage("");
      setIsSubmitting(false);
      return;
    }

    const nextFrame = window.requestAnimationFrame(() => {
      inputRefs.current[0]?.focus();
    });

    return () => window.cancelAnimationFrame(nextFrame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || pin.length !== 4 || digits.some((digit) => digit === "")) {
      return;
    }

    async function submitPin() {
      if (!email.trim()) {
        setErrorMessage("Enter your guardian email first.");
        return;
      }

      setIsSubmitting(true);
      setErrorMessage("");

      try {
        const response = await api.post("/auth/login", {
          email: email.trim(),
          pin,
        });

        const nextToken =
          response.data?.token ||
          response.data?.access_token ||
          response.data?.accessToken;

        if (!nextToken) {
          throw new Error("Missing auth token in login response.");
        }

        let nextGuardian =
          response.data?.guardian ||
          response.data?.user ||
          response.data?.guardian_user ||
          null;

        if (!nextGuardian) {
          const guardianResponse = await api.get("/guardian/me", {
            headers: {
              Authorization: `Bearer ${nextToken}`,
            },
          });

          nextGuardian = guardianResponse.data;
        }

        localStorage.setItem("sprout_email", email.trim());
        login(nextToken, nextGuardian);
        onClose();
        navigate("/dashboard");
      } catch (error) {
        setDigits(["", "", "", ""]);
        setErrorMessage(
          error.response?.status === 401
            ? "Incorrect PIN"
            : "We couldn't sign you in right now.",
        );

        window.requestAnimationFrame(() => {
          inputRefs.current[0]?.focus();
        });
      } finally {
        setIsSubmitting(false);
      }
    }

    submitPin();
  }, [digits, email, isOpen, login, navigate, onClose, pin]);

  if (!isOpen) {
    return null;
  }

  const handleDigitChange = (index, value) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);

    setDigits((currentDigits) => {
      const nextDigits = [...currentDigits];
      nextDigits[index] = nextValue;
      return nextDigits;
    });

    setErrorMessage("");

    if (nextValue && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);

    if (!pasted) {
      return;
    }

    event.preventDefault();

    setDigits((currentDigits) => {
      const nextDigits = [...currentDigits];

      pasted.split("").forEach((digit, index) => {
        nextDigits[index] = digit;
      });

      return nextDigits;
    });

    const targetIndex = Math.min(pasted.length, inputRefs.current.length) - 1;
    inputRefs.current[targetIndex]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1B1B1B]/45 px-4 pb-4 pt-10 sm:items-center">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-5 shadow-[0_30px_80px_-32px_rgba(27,27,27,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#2D6A4F]/70">
              Guardian Access
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1B1B1B]">
              Enter your PIN
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F4F4] text-xl text-[#1B1B1B]"
            aria-label="Close PIN modal"
          >
            ×
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-[#1B1B1B]/75">
            Guardian email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="guardian@example.com"
            className="h-12 w-full rounded-2xl border border-[#D8F3DC] bg-[#F4F4F4] px-4 text-base text-[#1B1B1B] outline-none transition focus:border-[#52B788] focus:bg-white"
            autoComplete="email"
          />
        </label>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                className="h-14 w-14 rounded-2xl border border-[#D8F3DC] bg-[#F4F4F4] text-center text-2xl font-semibold tracking-[0.1em] text-[#1B1B1B] outline-none transition focus:border-[#52B788] focus:bg-white sm:h-16 sm:w-16"
                aria-label={`PIN digit ${index + 1}`}
                autoComplete="one-time-code"
              />
            ))}
          </div>
          <p className="mt-3 min-h-6 text-sm text-[#1B1B1B]/55">
            {isSubmitting ? "Checking your PIN..." : "Enter the 4-digit guardian PIN."}
          </p>
          <p className="min-h-5 text-sm font-medium text-[#C0392B]">{errorMessage}</p>
        </div>
      </div>
    </div>
  );
}

export default PinModal;
