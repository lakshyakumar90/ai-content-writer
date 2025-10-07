import { Bot } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "stream-chat";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SignupProps {
  onSignup: (user: User) => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignup }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !username.trim() || !password.trim()) return;
    setError("");
    if (!backendUrl) {
      setError("VITE_BACKEND_URL is not set");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || `Request failed (${res.status})`);
        return;
      }
      const data = await res.json(); // { id, email, username }
      const user = { id: data.id, name: data.username } as User;
      onSignup(user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-semibold">Create your account</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign up with your email, username and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={handleSubmit} className="w-full h-10" disabled={!email.trim() || !username.trim() || !password.trim()}>
            Sign up
          </Button>
          {error && (
            <div className="text-sm text-red-500 text-center break-words">{error}</div>
          )}
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};


