import { CustomMutatorDefs } from "@rocicorp/zero";
import { schema } from "./zero-schema";
import { nanoid } from "nanoid";

type AuthData = {
  sub: string;
};

export function createMutators(authData: AuthData | undefined) {
  return {
    groceryList: {
      addInitial: async (tx, { name, id }: { name: string; id: string }) => {
        if (!authData) {
          throw new Error("Not authenticated");
        }
        try {
          const existingLists = await tx.query.groceryListMembers
            .where("userId", "=", authData.sub)
            .one();
          if (existingLists) {
            return;
          }

          await tx.mutate.groceryList.insert({
            id,
            name,
            isDefault: true,
          });
          await tx.mutate.groceryListMembers.insert({
            listId: id,
            userId: authData.sub,
          });
        } catch (err) {
          console.error("error adding grocery list", err);
          throw err;
        }
      },
      add: async (tx, { name, id }: { name: string; id: string }) => {
        if (!authData) {
          throw new Error("Not authenticated");
        }
        try {
          await tx.mutate.groceryList.insert({
            id,
            name,
          });
          await tx.mutate.groceryListMembers.insert({
            listId: id,
            userId: authData.sub,
          });
        } catch (err) {
          console.error("error adding grocery list", err);
          throw err;
        }
      },
      delete: async (tx, { id }: { id: string }) => {
        if (!authData) {
          throw new Error("Not authenticated");
        }
        try {
          // Check if this is a default list
          const list = await tx.query.groceryList.where("id", "=", id).one();
          if (!list) {
            throw new Error("List not found");
          }
          if (list.isDefault) {
            throw new Error("Cannot delete default list");
          }

          // Delete all groceries in the list
          const groceries = await tx.query.groceries
            .where("listId", "=", id)
            .run();
          for (const grocery of groceries) {
            await tx.mutate.groceries.delete({ id: grocery.id });
          }

          // Delete all members of the list
          const members = await tx.query.groceryListMembers
            .where("listId", "=", id)
            .run();
          for (const member of members) {
            await tx.mutate.groceryListMembers.delete({
              listId: member.listId,
              userId: member.userId,
            });
          }

          // Delete all invitations for the list
          const invitations = await tx.query.groceryListInvitations
            .where("listId", "=", id)
            .run();
          for (const invitation of invitations) {
            await tx.mutate.groceryListInvitations.delete({
              id: invitation.id,
            });
          }

          // Finally, delete the list itself
          await tx.mutate.groceryList.delete({ id });
        } catch (err) {
          console.error("error deleting grocery list", err);
          throw err;
        }
      },
    },
  } as const satisfies CustomMutatorDefs<typeof schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
