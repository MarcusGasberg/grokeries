import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface InvitationData {
  id: string;
  listId: string;
  listName: string;
  inviterName: string;
  inviteeEmail: string;
  role: string;
  invitedAt: string;
  expiresAt: string;
}

type InvitationStatus = "loading" | "success" | "error" | "expired" | "already_member";

export const Route = createFileRoute("/invitations")({
  component: InvitationsPage,
  ssr: false,
  beforeLoad: async () => {
    // Check if user is logged in
    const { data: session } = await authClient.getSession();
    if (!session?.session) {
      throw new Error("You must be logged in to view invitations");
    }
  },
});

function InvitationsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/invitations" });
  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const { action, token } = search as { action?: string; token?: string };

    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link");
      return;
    }

    if (action === "accept") {
      handleAccept(token);
    } else if (action === "decline") {
      handleDecline(token);
    } else {
      // Just show invitation details
      fetchInvitationDetails(token);
    }
  }, [search]);

  const fetchInvitationDetails = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to load invitation");
        return;
      }

      setInvitation(data);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage("Failed to load invitation");
    }
  };

  const handleAccept = async (token: string) => {
    try {
      const response = await fetch("/api/invitations?action=accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
        setMessage(data.error || "Failed to accept invitation");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Successfully joined the grocery list!");
    } catch (error) {
      setStatus("error");
      setMessage("Failed to accept invitation");
    }
  };

  const handleDecline = async (token: string) => {
    try {
      const response = await fetch("/api/invitations?action=decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to decline invitation");
        return;
      }

      setStatus("success");
      setMessage("Invitation declined");
    } catch (error) {
      setStatus("error");
      setMessage("Failed to decline invitation");
    }
  };

  const handleAcceptClick = () => {
    const { token } = search as { token?: string };
    if (token) {
      setStatus("loading");
      handleAccept(token);
    }
  };

  const handleDeclineClick = () => {
    const { token } = search as { token?: string };
    if (token) {
      setStatus("loading");
      handleDecline(token);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-accent" />
            <p className="text-lg font-black font-sans uppercase tracking-tight text-foreground">
              PROCESSING INVITATION...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]">
        <CardHeader className="border-b-4 border-foreground pb-4">
          <CardTitle className="text-2xl font-black font-sans uppercase tracking-tight text-foreground text-center">
            GROCERY INVITATION
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {status === "success" && invitation && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <p className="text-lg font-black font-sans uppercase tracking-tight text-foreground mb-2">
                  {message}
                </p>
                <p className="text-sm font-bold font-serif uppercase tracking-wide text-muted-foreground">
                  LIST: {invitation.listName.toUpperCase()}
                </p>
                <p className="text-sm font-bold font-serif uppercase tracking-wide text-muted-foreground">
                  FROM: {invitation.inviterName.toUpperCase()}
                </p>
              </div>
              <Button
                onClick={() => navigate({ to: "/groceries" })}
                className="w-full bg-accent text-accent-foreground border-4 border-accent-foreground hover:bg-accent-foreground hover:text-accent font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
              >
                GO TO GROCERIES
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <p className="text-lg font-black font-sans uppercase tracking-tight text-foreground">
                {message}
              </p>
              <Button
                onClick={() => navigate({ to: "/groceries" })}
                variant="outline"
                className="w-full bg-background text-foreground border-4 border-foreground hover:bg-foreground hover:text-background font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
              >
                BACK TO GROCERIES
              </Button>
            </div>
          )}

          {status === "expired" && (
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-orange-500 mx-auto" />
              <p className="text-lg font-black font-sans uppercase tracking-tight text-foreground">
                INVITATION EXPIRED
              </p>
              <p className="text-sm font-bold font-serif uppercase tracking-wide text-muted-foreground">
                This invitation is no longer valid
              </p>
              <Button
                onClick={() => navigate({ to: "/groceries" })}
                variant="outline"
                className="w-full bg-background text-foreground border-4 border-foreground hover:bg-foreground hover:text-background font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
              >
                BACK TO GROCERIES
              </Button>
            </div>
          )}

          {invitation && !["accept", "decline"].includes((search as any).action) && (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-lg font-black font-sans uppercase tracking-tight text-foreground">
                  {invitation.inviterName.toUpperCase()} INVITED YOU TO:
                </p>
                <p className="text-xl font-black font-sans uppercase tracking-tight text-accent">
                  {invitation.listName.toUpperCase()}
                </p>
                <p className="text-sm font-bold font-serif uppercase tracking-wide text-muted-foreground">
                  ROLE: {invitation.role.toUpperCase()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAcceptClick}
                  className="flex-1 bg-accent text-accent-foreground border-4 border-accent-foreground hover:bg-accent-foreground hover:text-accent font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
                >
                  ACCEPT
                </Button>
                <Button
                  onClick={handleDeclineClick}
                  variant="outline"
                  className="flex-1 bg-background text-foreground border-4 border-foreground hover:bg-foreground hover:text-background font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
                >
                  DECLINE
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}