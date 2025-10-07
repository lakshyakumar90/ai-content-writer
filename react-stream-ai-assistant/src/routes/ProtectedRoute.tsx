// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { User } from "stream-chat";

export function ProtectedRoute({ user }: { user: User | null }) {
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}