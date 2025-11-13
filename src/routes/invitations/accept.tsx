import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { db } from "@/drizzle/drizzle";
import { groceryListInvitations, groceryListMembers } from "@/schema";
import { eq, and } from "drizzle-orm";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/functions/invitations";

const acceptSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute("/invitations/accept")({
  component: RouteComponent,
  validateSearch: zodValidator(acceptSchema),
});

function RouteComponent() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const search = router.state.location.search;
  const urlParams = new URLSearchParams(search);
  const token = urlParams.get("token") || "";
   const [countdown, setCountdown] = useState(3);
   const [isProcessing, setIsProcessing] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [successData, setSuccessData] = useState<{ messageKey?: string; listId: string } | null>(null);

  useEffect(() => {
    const accept = async () => {
      try {
        const response = await acceptInvitation({ data: { token } });

        if (response.error) {
          if (response.error === "invitations.accept.mustBeLoggedIn") {
            // User is not logged in, redirect to login with callback
            const currentUrl = window.location.href;
            const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
            router.navigate({ to: loginUrl });
            return;
          } else {
            setError(response.error.startsWith('invitations.') ? t(response.error as any) : response.error || t("invitations.accept.failedToAccept"));
            setIsProcessing(false);
            return;
          }
        }

        // Success
        setSuccessData(response);
        setIsProcessing(false);

        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // Redirect to groceries with listId
              router.navigate({
                to: "/groceries",
                search: { listId: response.listId },
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
       } catch (err) {
         setError(t("invitations.accept.unexpectedError"));
         setIsProcessing(false);
       }
    };

    if (token) {
      accept();
    }
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white">
            <CardHeader>
             <CardTitle className="text-2xl font-bold font-sans uppercase text-black">
               {t("invitations.accept.errorTitle")}
             </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-red-600 font-mono uppercase mb-4">{error}</p>
               <Button
                 onClick={() => router.navigate({ to: "/" })}
                 className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
               >
                 {t("invitations.accept.backToHome")}
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white">
          <CardHeader>
             <CardTitle className="text-2xl font-bold font-sans uppercase text-black">
               {isProcessing ? t("invitations.accept.processing") : t("invitations.accept.title")}
             </CardTitle>
            {!isProcessing && (
              <p className="text-lg font-bold font-sans uppercase text-orange-500">
                {t("invitations.accept.subtitle")}
              </p>
            )}
          </CardHeader>
          <CardContent className="text-center">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                 <p className="text-lg font-mono uppercase text-black">
                   {t("invitations.accept.accepting")}
                 </p>
              </div>
            ) : (
              <div className="space-y-4">
                 <p className="text-lg font-mono uppercase text-black">
                   {successData?.messageKey ? t(successData.messageKey as any) : t("invitations.accept.message")}
                 </p>
                <div className="text-6xl font-bold font-mono text-orange-500">
                  {countdown}
                </div>
                <p className="text-sm font-mono uppercase text-gray-600">
                  {t("invitations.accept.countdown", { count: countdown })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
