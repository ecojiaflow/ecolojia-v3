import React, { createContext, useContext } from "react";
import authService from "../../services/authService";

const AuthContext = createContext({
  user: authService.getUser(),
  isAuthenticated: true,
  login: async () => ({ success: true }),
  register: async () => ({ success: true }),
  logout: () => {},
});

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider
      value={{
        user: authService.getUser(),
        isAuthenticated: true,
        login: async () => ({ success: true }),
        register: async () => ({ success: true }),
        logout: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
