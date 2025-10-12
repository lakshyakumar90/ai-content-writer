// src/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { User } from "stream-chat";
import { Landing } from "@/components/landing";
import { Login } from "@/components/login";
import { AuthenticatedApp } from "@/components/authenticated-app";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/theme-provider";
import { Signup } from "@/components/signup";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data?.user) {
          setUser({ id: data.user.id, name: data.user.username } as User);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    })();
  }, [backendUrl]);

  const handleUserLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    await fetch(`${backendUrl}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Landing isAuthenticated={!!user} />} />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleUserLogin} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Signup onSignup={handleUserLogin} />
              )
            }
          />
          {/* Protected Dashboard */}
          <Route element={<ProtectedShell user={user} onLogout={handleLogout} />}>
            {/* default dashboard -> writing */}
            <Route path="/dashboard" element={<Navigate to="/dashboard/writing" replace />} />
            {/* sectioned dashboard */}
            <Route path="/dashboard/:section" element={<AuthenticatedApp user={user!} onLogout={handleLogout} />} />
            {/* chat route remains */}
            <Route path="/dashboard/chat/:channelId" element={<AuthenticatedApp user={user!} onLogout={handleLogout} />} />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

function ProtectedShell({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  if (!user) return <Navigate to="/login" replace />;
  // Use Outlet if you need a common dashboard layout/header
  return <Outlet />;
}

export default App;