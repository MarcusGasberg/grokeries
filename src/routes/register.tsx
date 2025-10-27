import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/use-toast";

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
  const { t } = useTranslation("auth");
  const [loading, setLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
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
          toast({
            variant: "destructive",
            title: ctx.error.message,
          });
        },
      },
    );

    if (error) {
      setLoading(false);
      return;
    }

    if (data) {
      // Check if email verification is required
      if (data.user.emailVerified === false) {
        setVerificationEmailSent(true);
        setLoading(false);
      } else {
        // Email already verified or not required (dev mode)
        router.navigate({
          to: "/groceries",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold font-sans text-black mb-2 hover:text-orange-500 transition-colors">
              {t("appName")}
            </h1>
          </Link>
          <p className="text-lg font-medium text-gray-600 uppercase tracking-wide">
            {t("register.header")}
          </p>
        </div>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold font-sans uppercase tracking-wide">
              {t("register.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 font-medium uppercase text-sm">
              {t("register.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationEmailSent ? (
              <div className="text-center py-10 space-y-6">
                <div className="mx-auto w-20 h-20 bg-orange-500 border-4 border-black rounded-lg flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="white"
                    className="w-12 h-12"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sans uppercase tracking-wide text-black mb-2">
                    {t("register.verificationSent.title")}
                  </h3>
                  <p className="text-sm font-medium text-gray-600 uppercase mb-4">
                    {t("register.verificationSent.subtitle")}
                  </p>
                  <p className="text-xs font-medium text-gray-500 max-w-sm mx-auto">
                    {t("register.verificationSent.description")}
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans uppercase text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {t("register.verificationSent.goToLogin")}
                  </Link>
                </div>
              </div>
            ) : !loading ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold font-sans uppercase tracking-wide text-black mb-2"
                  >
                    {t("register.nameLabel")}
                  </label>
                  <Input
                    id="name"
                    type="text"
                    {...register("name")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder={t("register.namePlaceholder")}
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
                    {t("register.emailLabel")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder={t("register.emailPlaceholder")}
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
                    {t("register.passwordLabel")}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder={t("register.passwordPlaceholder")}
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
                    {t("register.confirmPasswordLabel")}
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder={t("register.confirmPasswordPlaceholder")}
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
                  {t("register.submit")}
                </Button>
              </form>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg font-medium text-gray-600 uppercase">
                  {t("register.creating")}
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-gray-600 uppercase">
                {t("register.alreadyDestroyer")}{" "}
                <Link
                  to="/login"
                  className="text-orange-500 hover:text-orange-600 font-bold underline decoration-2 underline-offset-2"
                >
                  {t("register.signIn")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
