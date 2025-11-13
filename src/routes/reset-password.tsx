import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation, UseTranslationResponse } from "react-i18next";
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
import { useToast } from "@/components/ui/use-toast";
import { authClient } from "@/lib/auth-client";

// ------------------
// Zod Schema
// ------------------
const resetPasswordFormSchema = (
  t: UseTranslationResponse<"auth", undefined>["t"],
) =>
  z
    .object({
      password: z.string().min(8, {
        message: t("resetPassword.newPasswordMinLength", {
          context: {
            length: 8,
          },
        }),
      }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("resetPassword.noMatch"),
      path: ["confirmPassword"],
    });

const resetPasswordSearchSchema = z.object({
  token: z.string().default(""),
  email: z.string().default(""),
});

type ResetPasswordFormFactory = ReturnType<typeof resetPasswordFormSchema>;
export type ResetPasswordFormValue = z.infer<ResetPasswordFormFactory>;

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordComponent,
  validateSearch: zodValidator(resetPasswordSearchSchema),
});

// ------------------
// Component
// ------------------
function ResetPasswordComponent() {
  const { t } = useTranslation("auth");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const { token, email } = Route.useSearch();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValue>({
    resolver: zodResolver(resetPasswordFormSchema(t)),
    mode: "onBlur",
  });

  const onSubmit = async (values: ResetPasswordFormValue) => {
    if (!token || !email) {
      toast({
        variant: "destructive",
        title: "Invalid reset link",
        description: "The password reset link is invalid or has expired.",
      });
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message,
      });
      return;
    }

    setResetSuccess(true);
    setTimeout(() => {
      router.navigate({ to: "/login" });
    }, 3000);
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
            {t("resetPassword.header")}
          </p>
        </div>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold font-sans uppercase tracking-wide">
              {t("resetPassword.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 font-medium uppercase text-sm">
              {t("resetPassword.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSuccess ? (
              <div className="text-center py-10 space-y-6">
                <div className="mx-auto w-20 h-20 bg-green-500 border-4 border-black rounded-lg flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sans uppercase tracking-wide text-black mb-2">
                    {t("resetPassword.successMessage")}
                  </h3>
                  <p className="text-sm font-medium text-gray-600 uppercase">
                    {t("resetPassword.redirectMessage")}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold font-sans uppercase tracking-wide text-black mb-2"
                  >
                    {t("resetPassword.newPasswordLabel")}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder={t("resetPassword.newPasswordPlaceholder")}
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
                    {t("resetPassword.confirmPasswordLabel")}
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="border-2 border-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500 font-medium h-12"
                    placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans text-lg uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all h-12 disabled:opacity-50"
                >
                  {loading
                    ? t("resetPassword.submitting")
                    : t("resetPassword.submit")}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-600 font-bold font-mono uppercase text-sm underline"
              >
                {t("resetPassword.backToLogin")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
