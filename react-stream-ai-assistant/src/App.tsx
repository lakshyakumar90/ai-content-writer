// src/App.tsx
import { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { User } from "stream-chat";
import { Landing } from "@/components/landing";
import { Login } from "@/components/login";
import { AuthenticatedApp } from "@/components/authenticated-app";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/theme-provider";

const USER_STORAGE_KEY = "chat-ai-app-user";

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleUserLogin = (authenticatedUser: User) => {
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${authenticatedUser.name}`;
    const userWithImage = { ...authenticatedUser, image: avatarUrl };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithImage));
    setUser(userWithImage);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="h-screen bg-background">
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
          {/* Protected Dashboard */}
          <Route element={<ProtectedShell user={user} onLogout={handleLogout} />}>
            <Route path="/dashboard" element={<AuthenticatedApp user={user!} onLogout={handleLogout} />} />
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