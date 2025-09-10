import { createFileRoute, Link } from "@tanstack/react-router";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to main app after login
      window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-sans uppercase tracking-tight mb-2 text-black">
            GROKERIES
          </h1>
          <h2 className="text-3xl font-bold font-sans uppercase tracking-tight text-orange-500 mb-4">
            GROCERY DESTROYER
          </h2>
          <p className="text-lg font-mono uppercase text-black">
            LOGIN TO DESTROY
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold font-sans uppercase text-black">
              ENTER THE ZONE
            </CardTitle>
            <CardDescription className="font-mono uppercase text-sm text-gray-600">
              ACCESS YOUR GROCERY BATTLEFIELD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-bold font-mono uppercase text-black"
                >
                  EMAIL ADDRESS
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-mono text-black bg-white h-12"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-bold font-mono uppercase text-black"
                >
                  PASSWORD
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-mono text-black bg-white h-12"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 disabled:opacity-50"
              >
                {isLoading ? "ENTERING..." : "DESTROY GROCERIES"}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm font-mono uppercase text-gray-600">
                NEW TO THE BATTLEFIELD?
              </p>
              <Link
                to="/register"
                className="text-orange-500 hover:text-orange-600 font-bold font-mono uppercase text-sm underline"
              >
                CREATE ACCOUNT
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-black hover:text-orange-500 font-mono uppercase text-xs underline"
              >
                ← BACK TO HOME
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Text */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono uppercase text-gray-500">
            POWERED BY BRUTALIST DESIGN
          </p>
        </div>
      </div>
    </div>
  );
}
