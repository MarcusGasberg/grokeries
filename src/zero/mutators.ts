import { CustomMutatorDefs } from "@rocicorp/zero";
import { schema } from "./zero-schema";
import { nanoid } from "nanoid";

type AuthData = {
  sub: string;
};

export function createMutators(authData: AuthData | undefined) {
  return {
    groceryList: {
      addInital: async (tx, { name, id }: { name: string; id: string }) => {
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
    },
  } as const satisfies CustomMutatorDefs<typeof schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
