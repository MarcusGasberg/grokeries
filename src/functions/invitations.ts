import { createServerFn } from "@tanstack/react-start";
import { db } from "@/drizzle/drizzle";
import { auth } from "@/lib/auth";
import { groceryListInvitations, groceryListMembers } from "@/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";

const acceptInvitationSchema = z.object({
  token: z.string(),
});

const declineInvitationSchema = z.object({
  token: z.string(),
});

export const acceptInvitation = createServerFn({ method: "POST" })
  .inputValidator(acceptInvitationSchema)
  .handler(async ({ data: { token } }) => {
    try {
      // Find the invitation
      const invitation = await db
        .select()
        .from(groceryListInvitations)
        .where(
          and(
            eq(groceryListInvitations.token, token),
            eq(groceryListInvitations.status, "pending"),
          ),
        )
        .limit(1);

      if (!invitation.length) {
        return { error: "invitations.accept.invitationNotFound" };
      }

      const inv = invitation[0];

      // Check if invitation is expired
      if (new Date() > new Date(inv.expiresAt)) {
        // Mark as expired
        await db
          .update(groceryListInvitations)
          .set({ status: "expired" })
          .where(eq(groceryListInvitations.id, inv.id));

        return { error: "invitations.accept.invitationExpired" };
      }

      // Get current user from session
      const session = await auth.api.getSession(getRequest());

      if (!session) {
        return { error: "invitations.accept.mustBeLoggedIn" };
      }

      const currentUserId = session.user.id;

      // Check if the invitation email matches the current user's email
      if (session.user.email !== inv.inviteeEmail) {
        return { error: "invitations.accept.wrongEmail" };
      }

      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(groceryListMembers)
        .where(
          and(
            eq(groceryListMembers.listId, inv.listId),
            eq(groceryListMembers.userId, currentUserId),
          ),
        )
        .limit(1);

      if (existingMember.length) {
        // Mark invitation as accepted (even though they're already a member)
        await db
          .update(groceryListInvitations)
          .set({ status: "accepted" })
          .where(eq(groceryListInvitations.id, inv.id));

        return {
          success: true,
          messageKey: "invitations.accept.alreadyMember",
          listId: inv.listId,
        };
      }

      // Add user to the list
      await db.insert(groceryListMembers).values({
        userId: currentUserId,
        listId: inv.listId,
        role: inv.role,
        joinedAt: new Date(),
      });

      // Mark invitation as accepted
      await db
        .update(groceryListInvitations)
        .set({ status: "accepted" })
        .where(eq(groceryListInvitations.id, inv.id));

      return {
        success: true,
        messageKey: "invitations.accept.successMessage",
        listId: inv.listId,
      };
    } catch (error) {
      console.error(`Error accepting invitation:`, error);
      return { error: "invitations.accept.unexpectedError" };
    }
  });

export const declineInvitation = createServerFn({ method: "POST" })
  .inputValidator(declineInvitationSchema)
  .handler(async ({ data: { token } }) => {
    try {
      // Find the invitation
      const invitation = await db
        .select()
        .from(groceryListInvitations)
        .where(
          and(
            eq(groceryListInvitations.token, token),
            eq(groceryListInvitations.status, "pending"),
          ),
        )
        .limit(1);

      if (!invitation.length) {
        return { error: "invitations.decline.invitationNotFound" };
      }

      const inv = invitation[0];

      // Check if invitation is expired
      if (new Date() > new Date(inv.expiresAt)) {
        // Mark as expired
        await db
          .update(groceryListInvitations)
          .set({ status: "expired" })
          .where(eq(groceryListInvitations.id, inv.id));

        return { error: "invitations.decline.invitationExpired" };
      }

      // Mark invitation as declined
      await db
        .update(groceryListInvitations)
        .set({ status: "declined" })
        .where(eq(groceryListInvitations.id, inv.id));

      return {
        success: true,
        messageKey: "invitations.decline.successMessage",
      };
    } catch (error) {
      console.error(`Error declining invitation:`, error);
      return { error: "invitations.decline.unexpectedError" };
    }
  });

