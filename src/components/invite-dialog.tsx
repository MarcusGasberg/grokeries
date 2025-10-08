import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { useQuery } from "@rocicorp/zero/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, X } from "lucide-react";

// ------------------
// Schema
// ------------------
const inviteSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  message: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// ------------------
// Component
// ------------------
export function InviteDialog({
  isOpen,
  onClose,
  listId,
}: {
  isOpen: boolean;
  onClose: () => void;
  listId?: string;
}) {
  const { zero } = useRouter().options.context;

  // Query current list members
  const membersQuery = zero.query.groceryListMembers
    .where("listId", "=", listId || "-")
    .related("user");
  const [members] = useQuery(membersQuery);

  // Query pending invitations for this list
  const invitationsQuery = zero.query.groceryListInvitations
    .where("listId", "=", listId || "-")
    .where("status", "=", "pending");
  const [invitations] = useQuery(invitationsQuery);
  console.log(invitations);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: InviteFormValues) => {
    if (!listId) {
      toast.error("No list selected. Please select a list first.");
      return;
    }

    // Check if email is already a member
    const isExistingMember = members.some(
      (member) =>
        member.user?.email.toLowerCase() === values.email.toLowerCase(),
    );
    if (isExistingMember) {
      setError("email", {
        type: "manual",
        message: "This user is already a member of this list",
      });
      return;
    }

    // Check if there's already a pending invitation
    const hasPendingInvitation = invitations.some(
      (invitation) =>
        invitation.inviteeEmail.toLowerCase() === values.email.toLowerCase(),
    );
    if (hasPendingInvitation) {
      setError("email", {
        type: "manual",
        message: "An invitation has already been sent to this email",
      });
      return;
    }

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId,
          email: values.email,
          role: "viewer", // Default role
          message: values.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      reset();
      onClose();
      toast.success("Invitation sent successfully!");
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation. Please try again.");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] max-w-md">
        <DialogHeader className="border-b-4 border-foreground pb-4 mb-6">
          <DialogTitle className="text-2xl font-black font-sans uppercase tracking-tight text-foreground">
            INVITE COLLABORATOR
          </DialogTitle>
          <p className="text-sm font-bold font-serif uppercase tracking-wide text-muted-foreground mt-2">
            SHARE YOUR GROCERY DESTRUCTION
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-black font-sans uppercase tracking-wide text-foreground"
            >
              EMAIL ADDRESS
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ENTER THEIR EMAIL..."
              {...register("email")}
              className="border-4 border-foreground bg-background text-foreground placeholder:text-muted-foreground font-bold font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] focus:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
            />
            {errors.email && (
              <p className="text-red-500 text-sm font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label
              htmlFor="message"
              className="text-sm font-black font-sans uppercase tracking-wide text-foreground"
            >
              PERSONAL MESSAGE (OPTIONAL)
            </Label>
            <Input
              id="message"
              placeholder="JOIN MY GROCERY MISSION..."
              {...register("message")}
              className="border-4 border-foreground bg-background text-foreground placeholder:text-muted-foreground font-bold font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] focus:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-accent text-accent-foreground border-4 border-accent-foreground hover:bg-accent-foreground hover:text-accent font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "SENDING..." : "SEND INVITE"}
            </Button>
            <Button
              type="button"
              onClick={() => onClose()}
              variant="outline"
              className="bg-background text-foreground border-4 border-foreground hover:bg-foreground hover:text-background font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
