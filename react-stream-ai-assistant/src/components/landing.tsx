// src/components/landing.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LandingProps {
  isAuthenticated: boolean;
}

export function Landing({ isAuthenticated }: LandingProps) {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="font-semibold">AI Assistant</div>
        {isAuthenticated ? (
          <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
        ) : (
          <Button onClick={() => navigate("/login")}>Sign in</Button>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Write better with AI.</h1>
          <p className="text-muted-foreground">
            Your AI-powered writing assistant for brainstorming, outlining, and drafting.
          </p>
          {isAuthenticated ? (
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          ) : (
            <Button onClick={() => navigate("/login")}>Get Started</Button>
          )}
        </div>
      </main>
    </div>
  );
}