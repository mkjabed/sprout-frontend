import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/useAuth.js";

function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const pinInputRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => localStorage.getItem("sprout_email") || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinInput = (event) => {
    const nextValue = event.target.value.replace(/\D/g, "").slice(0, 4);
    event.target.value = nextValue;
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const pin = pinInputRef.current?.value.replace(/\D/g, "").slice(0, 4) || "";

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await api.post("/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        pin,
      });

      const nextToken =
        response.data?.token ||
        response.data?.access_token ||
        response.data?.accessToken;

      const nextGuardian =
        response.data?.guardian ||
        response.data?.user ||
        response.data?.guardian_user ||
        null;

      if (!nextToken || !nextGuardian) {
        throw new Error("Missing signup session data.");
      }

      localStorage.setItem("sprout_token", nextToken);
      localStorage.setItem("sprout_email", email.trim());
      login(nextToken, nextGuardian);
      navigate("/");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "We couldn't create your account right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#D8F3DC]">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
        <h1 className="mb-8 text-center text-2xl font-semibold tracking-[-0.04em] text-[#2D6A4F]">
          Sprout {"\u{1F331}"}
        </h1>

        <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
          <h2 className="mb-1 text-xl font-semibold tracking-[-0.04em] text-[#1B1B1B]">
            Create account
          </h2>
          <p className="mb-6 text-sm text-[#1B1B1B]/55">
            Set up your guardian profile
          </p>

          <form onSubmit={handleSubmit}>
            <label className="mb-4 block">
              <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                Full name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrorMessage("");
                }}
                className="min-h-12 w-full rounded-2xl bg-[#F4F4F4] px-4 py-3 text-sm text-[#1B1B1B] outline-none"
                autoComplete="name"
                required
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage("");
                }}
                className="min-h-12 w-full rounded-2xl bg-[#F4F4F4] px-4 py-3 text-sm text-[#1B1B1B] outline-none"
                autoComplete="email"
                required
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#1B1B1B]/45">
                PIN
              </span>
              <input
                ref={pinInputRef}
                type="number"
                inputMode="numeric"
                maxLength={4}
                placeholder="4 digits"
                onInput={handlePinInput}
                className="min-h-12 w-full rounded-2xl bg-[#F4F4F4] px-4 py-3 text-sm text-[#1B1B1B] outline-none"
                autoComplete="one-time-code"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-2xl bg-[#2D6A4F] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create account"}
            </button>

            {errorMessage ? (
              <p className="mt-2 text-center text-sm text-[#1B1B1B]/70">
                {errorMessage}
              </p>
            ) : null}
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#1B1B1B]/55">
          Already have an account?
          <Link to="/" className="ml-1 font-semibold text-[#2D6A4F]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default SignupPage;
