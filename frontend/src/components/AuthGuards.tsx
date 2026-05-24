import { Navigate } from "react-router-dom";
import { type ReactElement } from "react";
import { useAuth } from "../auth/AuthProvider";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

export function GuestRoute({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
