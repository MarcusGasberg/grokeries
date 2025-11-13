import { auth } from "@/lib/auth";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/drizzle/drizzle";
import {
  groceryList,
  groceryListMembers,
  groceryListInvitations,
  user,
} from "@/schema";
import { sendInvitationEmail } from "@/lib/email";
import { createFileRoute } from "@tanstack/react-router";
import { createServerOnlyFn } from "@tanstack/react-start";
import { acceptInvitation, declineInvitation } from "@/functions/invitations";

const sendInvitationSchema = z.object({
  listId: z.string(),
  email: z.string().email(),
  role: z.enum(["owner", "editor", "viewer"]).default("viewer"),
  message: z.string().optional(),
});

createServerOnlyFn;

export const Route = createFileRoute("/api/invitations/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return new Response(
              JSON.stringify({ error: "Token parameter required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          // Find the invitation
          const invitation = await db
            .select({
              id: groceryListInvitations.id,
              listId: groceryListInvitations.listId,
              inviterId: groceryListInvitations.inviterId,
              inviteeEmail: groceryListInvitations.inviteeEmail,
              role: groceryListInvitations.role,
              invitedAt: groceryListInvitations.invitedAt,
              expiresAt: groceryListInvitations.expiresAt,
              status: groceryListInvitations.status,
              listName: groceryList.name,
              inviterName: user.name,
            })
            .from(groceryListInvitations)
            .innerJoin(
              groceryList,
              eq(groceryListInvitations.listId, groceryList.id),
            )
            .innerJoin(user, eq(groceryListInvitations.inviterId, user.id))
            .where(eq(groceryListInvitations.token, token))
            .limit(1);

          if (!invitation.length) {
            return new Response(
              JSON.stringify({ error: "Invitation not found" }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const inv = invitation[0];

          // Check if invitation is expired
          if (
            new Date() > new Date(inv.expiresAt) ||
            inv.status !== "pending"
          ) {
            return new Response(
              JSON.stringify({ error: "Invitation is no longer valid" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          return new Response(
            JSON.stringify({
              id: inv.id,
              listId: inv.listId,
              listName: inv.listName,
              inviterName: inv.inviterName,
              inviteeEmail: inv.inviteeEmail,
              role: inv.role,
              invitedAt: inv.invitedAt,
              expiresAt: inv.expiresAt,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Error getting invitation:", error);
          return new Response(
            JSON.stringify({ error: "Failed to get invitation" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },

      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const action = url.searchParams.get("action");

          if (action === "accept" || action === "decline") {
            return handleAcceptDecline(request, action);
          }

          // Default to send invitation
          return handleSendInvitation(request);
        } catch (error) {
          console.error("Error processing invitation request:", error);
          return new Response(
            JSON.stringify({ error: "Failed to process request" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});

async function handleSendInvitation(request: Request) {
  // Get current user from session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const currentUserId = session.user.id;

  const body = await request.json();
  const { listId, email, role, message } = sendInvitationSchema.parse(body);

  // Check if the current user is a member of the list
  const membership = await db
    .select()
    .from(groceryListMembers)
    .where(
      and(
        eq(groceryListMembers.userId, currentUserId),
        eq(groceryListMembers.listId, listId),
      ),
    )
    .limit(1);

  if (!membership.length) {
    console.log("User", currentUserId, "is not a member of list", listId);
    return new Response(
      JSON.stringify({ error: "You are not a member of this list" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Check if the list exists
  const list = await db
    .select()
    .from(groceryList)
    .where(eq(groceryList.id, listId))
    .limit(1);

  if (!list.length) {
    return new Response(JSON.stringify({ error: "List not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if user with this email is already a member
  const existingUser = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUser.length) {
    const existingMember = await db
      .select()
      .from(groceryListMembers)
      .where(
        and(
          eq(groceryListMembers.listId, listId),
          eq(groceryListMembers.userId, existingUser[0].id),
        ),
      )
      .limit(1);

    if (existingMember.length) {
      return new Response(
        JSON.stringify({ error: "User is already a member of this list" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Check if there's already a pending invitation
  const existingInvitation = await db
    .select()
    .from(groceryListInvitations)
    .where(
      and(
        eq(groceryListInvitations.listId, listId),
        eq(groceryListInvitations.inviteeEmail, email),
        eq(groceryListInvitations.status, "pending"),
      ),
    )
    .limit(1);

  if (existingInvitation.length) {
    return new Response(
      JSON.stringify({ error: "Invitation already sent to this email" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Create invitation
  const invitationId = nanoid();
  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.insert(groceryListInvitations).values({
    id: invitationId,
    listId,
    inviterId: currentUserId,
    inviteeEmail: email,
    role,
    invitedAt: new Date(),
    expiresAt,
    status: "pending",
    token,
  });

  // Get inviter name
  const inviter = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, currentUserId))
    .limit(1);

  const inviterName = inviter.length ? inviter[0].name : "Team Member";

  // Send email
  const baseUrl = process.env.PUBLIC_SERVER || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/api/invitations/accept?token=${token}`;
  const declineUrl = `${baseUrl}/api/invitations/decline?token=${token}`;

  await sendInvitationEmail({
    to: email,
    inviterName,
    listName: list[0].name,
    acceptUrl,
    declineUrl,
  });

  return new Response(JSON.stringify({ success: true, invitationId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleAcceptDecline(
  request: Request,
  action: "accept" | "decline",
) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
      return new Response(
        JSON.stringify({ error: "Invitation not found or already processed" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const inv = invitation[0];

    // Check if invitation is expired
    if (new Date() > new Date(inv.expiresAt)) {
      // Mark as expired
      await db
        .update(groceryListInvitations)
        .set({ status: "expired" })
        .where(eq(groceryListInvitations.id, inv.id));

      return new Response(JSON.stringify({ error: "Invitation has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "decline") {
      // Mark invitation as declined
      await db
        .update(groceryListInvitations)
        .set({ status: "declined" })
        .where(eq(groceryListInvitations.id, inv.id));

      return new Response(
        JSON.stringify({ success: true, message: "Invitation declined" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // For accept action
    // Get current user from session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return new Response(
        JSON.stringify({
          error: "You must be logged in to accept invitations",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const currentUserId = session.user.id;

    // Check if the invitation email matches the current user's email
    if (session.user.email !== inv.inviteeEmail) {
      return new Response(
        JSON.stringify({
          error: "This invitation is not for your email address",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
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

    const baseUrl = process.env.PUBLIC_SERVER || "http://localhost:3000";

    const redirectUrl = new URL(`${baseUrl}/groceries`);
    redirectUrl.searchParams.append("listId", inv.listId);

    if (existingMember.length) {
      // Mark invitation as accepted (even though they're already a member)
      await db
        .update(groceryListInvitations)
        .set({ status: "accepted" })
        .where(eq(groceryListInvitations.id, inv.id));

      return Response.redirect(redirectUrl, 301);
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

    return Response.redirect(redirectUrl, 301);
  } catch (error) {
    console.error(`Error ${action}ing invitation:`, error);
    return new Response(
      JSON.stringify({ error: `Failed to ${action} invitation` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
