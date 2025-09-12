import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

// ------------------
// Zod Schema
// ------------------
export const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginFormValue = z.infer<typeof loginFormSchema>;

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

// ------------------
// Component
// ------------------
function LoginComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValue>({
    resolver: zodResolver(loginFormSchema),
    mode: "onBlur",
  });

  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit = async (values: LoginFormValue) => {
    setLoginError(null);
    const { error } = await authClient.signIn.email({
      ...values,
      callbackURL: "/groceries",
    });

    setLoginError(error?.message ?? null);
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
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-sans uppercase text-black">
              ENTER THE ZONE
            </CardTitle>
            <CardDescription className="font-mono uppercase text-sm text-gray-600">
              ACCESS YOUR GROCERY BATTLEFIELD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {loginError && (
                <div className="bg-red-100 text-red-700 border-4 rounded-lg border-red-300 p-3 text-sm font-medium">
                  {loginError}
                </div>
              )}
              {/* Email */}
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
                  {...register("email")}
                  className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-mono text-black bg-white h-12"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
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
                  {...register("password")}
                  className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-mono text-black bg-white h-12"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 disabled:opacity-50"
              >
                {isSubmitting ? "ENTERING..." : "DESTROY GROCERIES"}
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
