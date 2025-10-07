// src/components/login.tsx
import { sha256 } from "js-sha256";
import { Bot } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "stream-chat";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface LoginProps {
  onLogin: (user: User) => void;
}

const createUserIdFromUsername = (username: string): string => {
  const hash = sha256(username.toLowerCase().trim());
  return `user_${hash.substring(0, 12)}`;
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;
    const user = {
      id: createUserIdFromUsername(username.trim().toLowerCase()),
      name: username.trim(),
    };
    onLogin(user);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-semibold">Welcome to AI Assistant</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your username to start chatting with your AI assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                placeholder="Enter your name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleSubmit()} className="w-full h-10" disabled={!username.trim()}>
            Start Chatting
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};