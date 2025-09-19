import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { registerFormSchema, RegisterFormValue } from "@/shared/register.form";

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
});

// ------------------
// Component
// ------------------
function RegisterComponent() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValue>({
    resolver: zodResolver(registerFormSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: RegisterFormValue) => {
    const { email, password, name } = values;

    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
      },
      {
        onRequest: () => setLoading(true),
        onError: (ctx) => {
          setLoading(false);
          alert(ctx.error.message);
        },
      },
    );

    if (error) {
      setLoading(false);
      return;
    }

    if (data) {
      router.navigate({
        to: "/groceries",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold font-sans text-black mb-2 hover:text-orange-500 transition-colors">
              GROKERIES
            </h1>
          </Link>
          <p className="text-lg font-medium text-gray-600 uppercase tracking-wide">
            JOIN THE MISSION
          </p>
        </div>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold font-sans uppercase tracking-wide">
              CREATE ACCOUNT
            </CardTitle>
            <CardDescription className="text-gray-600 font-medium uppercase text-sm">
              BECOME A GROCERY DESTROYER
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!loading ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold font-sans uppercase tracking-wide text-black mb-2"
                  >
                    DESTROYER NAME
                  </label>
                  <Input
                    id="name"
                    type="text"
                    {...register("name")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold font-sans uppercase tracking-wide text-black mb-2"
                  >
                    EMAIL ADDRESS
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold font-sans uppercase tracking-wide text-black mb-2"
                  >
                    PASSWORD
                  </label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder="Create a password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-bold font-sans uppercase tracking-wide text-black mb-2"
                  >
                    CONFIRM PASSWORD
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans text-lg uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all h-12"
                >
                  DESTROY GROCERIES
                </Button>
              </form>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg font-medium text-gray-600 uppercase">
                  CREATING ACCOUNT...
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-gray-600 uppercase">
                ALREADY A DESTROYER?{" "}
                <Link
                  to="/login"
                  className="text-orange-500 hover:text-orange-600 font-bold underline decoration-2 underline-offset-2"
                >
                  SIGN IN
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
