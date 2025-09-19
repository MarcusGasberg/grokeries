import { CustomMutatorDefs } from "@rocicorp/zero";
import { schema } from "./zero-schema";
import { nanoid } from "nanoid";

type AuthData = {
  sub: string;
};

export function createMutators(authData: AuthData | undefined) {
  return {
    groceryList: {
      add: async (tx, { name }: { name: string }) => {
        if (!authData) {
          throw new Error("Not authenticated");
        }
        try {
          const listId = nanoid();
          await tx.mutate.groceryList.insert({
            id: listId,
            name,
          });
          await tx.mutate.groceryListMembers.insert({
            listId,
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
