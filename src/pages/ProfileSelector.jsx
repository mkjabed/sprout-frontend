import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import PinModal from "../components/PinModal.jsx";
import ProfileCard from "../components/ProfileCard.jsx";
import { useAuth } from "../context/useAuth.js";

function ProfileSelector() {
  const navigate = useNavigate();
  const { guardian, token } = useAuth();
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [errorMessage, setErrorMessage] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadChildren() {
      if (!token) {
        setChildren([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get("/children");

        if (isMounted) {
          setChildren(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setChildren([]);
        setErrorMessage(
          error.response?.status === 401
            ? "Your session expired. Please unlock guardian mode again."
            : "We couldn't load profiles right now.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadChildren();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const guardianName = guardian?.name || guardian?.full_name || "Guardian";
  const guardianSubtitle = "Unlock guardian mode with your PIN";

  return (
    <main className="min-h-screen bg-[#D8F3DC] px-4 py-6 text-[#1B1B1B]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-sm flex-col">
        <header className="pb-6 pt-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#2D6A4F]/70">
            Daily Habit Tracker
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#1B1B1B]">
            Sprout {"\u{1F331}"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#1B1B1B]/65">
            Pick a profile to start the day.
          </p>
        </header>

        <section className="flex-1 rounded-[32px] bg-[#F4F4F4]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur">
          <div className="space-y-3">
            <ProfileCard
              title={guardianName}
              subtitle={guardianSubtitle}
              locked
              accent="guardian"
              onClick={() => setIsPinModalOpen(true)}
            />

            {isLoading ? (
              <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/60 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
                Loading profiles...
              </div>
            ) : null}

            {!isLoading && errorMessage ? (
              <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/65 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
                {errorMessage}
              </div>
            ) : null}

            {!isLoading && !errorMessage && children.length === 0 ? (
              <div className="rounded-[28px] bg-white p-5 text-sm text-[#1B1B1B]/65 shadow-[0_18px_40px_-28px_rgba(27,27,27,0.35)]">
                {token
                  ? "No child profiles yet."
                  : "Guardian login is needed before child profiles can load."}
              </div>
            ) : null}

            {!isLoading &&
              children.map((child) => (
                <ProfileCard
                  key={child.id}
                  title={child.name}
                  subtitle={
                    child.grade
                      ? `Grade ${child.grade}`
                      : child.age
                        ? `${child.age} years old`
                        : "Ready to check in"
                  }
                  onClick={() => navigate(`/child/${child.id}`)}
                />
              ))}
          </div>
        </section>

        <div className="pt-4 text-center text-xs text-[#1B1B1B]/45">
          Calm routines for kids and guardians.
        </div>
      </div>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </main>
  );
}

export default ProfileSelector;
