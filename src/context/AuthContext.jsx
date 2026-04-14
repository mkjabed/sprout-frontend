import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [guardian, setGuardian] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("sprout_token");
    const storedGuardian = localStorage.getItem("sprout_guardian");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedGuardian) {
      try {
        setGuardian(JSON.parse(storedGuardian));
      } catch {
        localStorage.removeItem("sprout_guardian");
      }
    }
  }, []);

  const login = (nextToken, nextGuardian) => {
    setToken(nextToken);
    setGuardian(nextGuardian);

    localStorage.setItem("sprout_token", nextToken);
    localStorage.setItem("sprout_guardian", JSON.stringify(nextGuardian));
  };

  const logout = () => {
    setToken(null);
    setGuardian(null);

    localStorage.removeItem("sprout_token");
    localStorage.removeItem("sprout_guardian");
  };

  return (
    <AuthContext.Provider
      value={{
        guardian,
        token,
        login,
        logout,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
