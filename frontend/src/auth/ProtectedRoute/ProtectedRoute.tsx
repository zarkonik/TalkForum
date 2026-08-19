import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LandingPage } from "../../pages/LandingPage/LandingPage";
import { useAuth } from "../AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    if (location.pathname === "/") {
      return <LandingPage />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
