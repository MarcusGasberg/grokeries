import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/drizzle/drizzle";
import { groceryListInvitations } from "@/schema";
import { eq, and } from "drizzle-orm";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { declineInvitation } from "@/functions/invitations";

const declineSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute("/invitations/decline")({
  component: RouteComponent,
  validateSearch: zodValidator(declineSchema),
});

function RouteComponent() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const search = router.state.location.search;
  const urlParams = new URLSearchParams(search);
  const token = urlParams.get("token") || "";
   const [isProcessing, setIsProcessing] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);
   const [successData, setSuccessData] = useState<{ messageKey?: string } | null>(null);

  useEffect(() => {
    const decline = async () => {
      try {
        const response = await declineInvitation({ data: { token } });

        if (response instanceof Response) {
          if (response.status >= 400) {
             const errorData = await response.json();
             const errorKey = errorData.error;
             setError(errorKey.startsWith('invitations.') ? t(errorKey as any) : errorData.error || t("invitations.decline.failedToDecline"));
             setIsProcessing(false);
             return;
           }

           // Success
           const data = await response.json();
           setSuccessData(data);
           setSuccess(true);
           setIsProcessing(false);
        }
       } catch (err) {
         setError(t("invitations.decline.unexpectedError"));
         setIsProcessing(false);
       }
    };

    if (token) {
      decline();
    }
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-white">
            <CardHeader>
             <CardTitle className="text-2xl font-bold font-sans uppercase text-black">
               {t("invitations.decline.errorTitle")}
             </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-red-600 font-mono uppercase mb-4">{error}</p>
               <Button
                 onClick={() => router.navigate({ to: "/" })}
                 className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
               >
                 {t("invitations.decline.backToHome")}
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
               {isProcessing ? t("invitations.decline.processing") : t("invitations.decline.title")}
             </CardTitle>
            {!isProcessing && success && (
              <p className="text-lg font-bold font-sans uppercase text-orange-500">
                {t("invitations.decline.subtitle")}
              </p>
            )}
          </CardHeader>
          <CardContent className="text-center">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                 <p className="text-lg font-mono uppercase text-black">
                   {t("invitations.decline.declining")}
                 </p>
              </div>
            ) : success ? (
              <div className="space-y-4">
                 <p className="text-lg font-mono uppercase text-black mb-6">
                   {successData?.messageKey ? t(successData.messageKey as any) : t("invitations.decline.message")}
                 </p>
                <Link to="/">
                  <Button className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold font-sans uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150">
                    {t("invitations.decline.backToHome")}
                  </Button>
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
