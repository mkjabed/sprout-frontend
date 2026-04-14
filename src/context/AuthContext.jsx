import { useState } from "react";
import AuthContext from "./authContext.js";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("sprout_token"));
  const [guardian, setGuardian] = useState(() => {
    const storedGuardian = localStorage.getItem("sprout_guardian");

    if (!storedGuardian) {
      return null;
    }

    try {
      return JSON.parse(storedGuardian);
    } catch {
      localStorage.removeItem("sprout_guardian");
      return null;
    }
  });

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
