import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Globe, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_layout/settings/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { data: session, error } = await authClient.getSession();
    if (!session?.session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/settings" },
      });
    }
  },
});

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
];

function RouteComponent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session } = router.options.context;
  const user = session?.data;

  return (
    <div className="min-h-screen bg-background p-4 max-w-md md:max-w-3xl mx-auto">
      <div className="mb-8 pt-6">
        <div className="bg-primary text-primary-foreground py-4 px-6 border-4 border-primary shadow-[8px_8px_0px_0px_var(--ring)]">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.history.back()}
              className="p-2 hover:bg-accent hover:text-background border-2 border-transparent hover:border-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <div className="p-2 bg-accent border-2 border-accent-foreground">
                <SettingsIcon className="w-8 h-8 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tight uppercase">
                  {t("settings:title")}
                </h1>
                <p className="text-xs md:text-sm font-bold font-serif uppercase tracking-wide">
                  {t("settings:subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Language Settings Card */}
        <Card className="border-4 border-primary shadow-[6px_6px_0px_0px_var(--ring)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-black font-sans uppercase text-xl">
              <Globe className="w-6 h-6" />
              {t("settings:language.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold font-serif text-muted-foreground mb-4">
              {t("settings:language.description")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`flex items-center gap-3 p-4 font-black font-sans uppercase text-sm border-4 transition-all ${
                    i18n.language === lang.code
                      ? "bg-accent text-background border-accent shadow-[4px_4px_0px_0px_var(--ring)]"
                      : "bg-background text-foreground border-foreground hover:bg-accent hover:text-background hover:border-accent hover:shadow-[4px_4px_0px_0px_var(--ring)]"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-black">{lang.name}</div>
                    {i18n.language === lang.code && (
                      <div className="text-xs font-bold opacity-80">{t("settings:language.active")}</div>
                    )}
                  </div>
                  {i18n.language === lang.code && (
                    <div className="w-3 h-3 bg-background rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card className="border-4 border-primary shadow-[6px_6px_0px_0px_var(--ring)]">
          <CardHeader>
            <CardTitle className="font-black font-sans uppercase text-xl">
              {t("settings:userInfo.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold font-sans uppercase text-muted-foreground">
                  {t("settings:userInfo.name")}
                </label>
                <p className="font-black font-sans text-lg uppercase">
                  {user?.name || t("settings:userInfo.unknown")}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold font-sans uppercase text-muted-foreground">
                  {t("settings:userInfo.email")}
                </label>
                <p className="font-bold font-mono text-sm">
                  {user?.email || t("settings:userInfo.notAvailable")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
