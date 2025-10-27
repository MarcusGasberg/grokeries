import {
  ANYONE_CAN,
  NOBODY_CAN,
  type Row,
  definePermissions,
} from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

export type User = Row<typeof schema.tables.user>;
export type Grocery = Row<typeof schema.tables.groceries>;
export type GlobalGroceryItem = Row<typeof schema.tables.globalGroceryItems>;
export type UserGroceryHistory = Row<typeof schema.tables.userGroceryHistory>;

// Auth data shape passed from getUserID
type AuthData = {
  sub: string; // User ID
  name: string;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => ({
  // Authentication tables - users can only see/modify their own data
  account: {
    row: {
      select: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
      insert: NOBODY_CAN,
      update: {
        preMutation: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
        postMutation: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
      },
      delete: NOBODY_CAN,
    },
  },

  session: {
    row: {
      select: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
      insert: NOBODY_CAN,
      update: { preMutation: NOBODY_CAN, postMutation: NOBODY_CAN },
      delete: NOBODY_CAN,
    },
  },

  user: {
    row: {
      // Users can see all users (for collaboration features)
      select: ANYONE_CAN,
      insert: NOBODY_CAN,
      // Users can only update their own profile
      update: {
        preMutation: [(authData, eb) => eb.cmp("id", "=", authData.sub)],
        postMutation: [(authData, eb) => eb.cmp("id", "=", authData.sub)],
      },
      delete: NOBODY_CAN,
    },
  },

  verification: {
    row: {
      select: NOBODY_CAN,
      insert: NOBODY_CAN,
      update: { preMutation: NOBODY_CAN, postMutation: NOBODY_CAN },
      delete: NOBODY_CAN,
    },
  },

  jwks: {
    row: {
      select: NOBODY_CAN,
      insert: NOBODY_CAN,
      update: { preMutation: NOBODY_CAN, postMutation: NOBODY_CAN },
      delete: NOBODY_CAN,
    },
  },

  // Grocery Lists - users can only see lists they are members of
  groceryList: {
    row: {
      select: [
        (authData, eb) =>
          eb.exists("members", (q) =>
            q.where("userId", "=", authData.sub)
          ),
      ],
      // Users can create lists (membership is handled by mutator)
      insert: ANYONE_CAN,
      // Only owners can update list details
      update: {
        preMutation: [
          (authData, eb) =>
            eb.exists("members", (q) =>
              q.where("userId", "=", authData.sub).where("role", "=", "owner")
            ),
        ],
        postMutation: [
          (authData, eb) =>
            eb.exists("members", (q) =>
              q.where("userId", "=", authData.sub).where("role", "=", "owner")
            ),
        ],
      },
      // Only owners can delete lists
      delete: [
        (authData, eb) =>
          eb.exists("members", (q) =>
            q.where("userId", "=", authData.sub).where("role", "=", "owner")
          ),
      ],
    },
  },

  // Grocery List Members - users can see members of their lists
  groceryListMembers: {
    row: {
      select: [
        (authData, eb) =>
          // User can see members if they are also a member of the same list
          eb.exists("list", (q) =>
            q.whereExists("members", (mq) =>
              mq.where("userId", "=", authData.sub)
            )
          ),
      ],
      // Only owners can add members (or via invitation acceptance)
      insert: [
        (authData, eb) =>
          eb.or(
            // User is adding themselves (via invitation)
            eb.cmp("userId", "=", authData.sub),
            // Or user is owner of the list
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub).where("role", "=", "owner")
              )
            ),
          ),
      ],
      // Only owners can change roles
      update: {
        preMutation: [
          (authData, eb) =>
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub).where("role", "=", "owner")
              )
            ),
        ],
        postMutation: [
          (authData, eb) =>
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub).where("role", "=", "owner")
              )
            ),
        ],
      },
      // Owners can remove members, or users can remove themselves
      delete: [
        (authData, eb) =>
          eb.or(
            eb.cmp("userId", "=", authData.sub),
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub).where("role", "=", "owner")
              )
            ),
          ),
      ],
    },
  },

  // Groceries - users can see groceries from their lists
  groceries: {
    row: {
      select: [
        (authData, eb) =>
          eb.exists("list", (q) =>
            q.whereExists("members", (mq) =>
              mq.where("userId", "=", authData.sub)
            )
          ),
      ],
      // Members can add groceries to their lists
      insert: [
        (authData, eb) =>
          eb.exists("list", (q) =>
            q.whereExists("members", (mq) =>
              mq.where("userId", "=", authData.sub)
            )
          ),
      ],
      // Members can update groceries in their lists
      update: {
        preMutation: [
          (authData, eb) =>
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub)
              )
            ),
        ],
        postMutation: [
          (authData, eb) =>
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub)
              )
            ),
        ],
      },
      // Members can delete groceries from their lists
      delete: [
        (authData, eb) =>
          eb.exists("list", (q) =>
            q.whereExists("members", (mq) =>
              mq.where("userId", "=", authData.sub)
            )
          ),
      ],
    },
  },

  // Invitations - users can see invitations they sent or received
  groceryListInvitations: {
    row: {
      select: [
        (authData, eb) =>
          eb.or(
            // Invitations sent by the user
            eb.cmp("inviterId", "=", authData.sub),
            // Or user is a member of the list (to see pending invitations)
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub)
              )
            ),
          ),
      ],
      // Only list members can create invitations
      insert: [
        (authData, eb) =>
          eb.exists("list", (q) =>
            q.whereExists("members", (mq) =>
              mq.where("userId", "=", authData.sub)
            )
          ),
      ],
      // Only inviter or list owner can update invitations
      update: {
        preMutation: [
          (authData, eb) =>
            eb.or(
              eb.cmp("inviterId", "=", authData.sub),
              eb.exists("list", (q) =>
                q.whereExists("members", (mq) =>
                  mq.where("userId", "=", authData.sub).where("role", "=", "owner")
                )
              ),
            ),
        ],
        postMutation: [
          (authData, eb) =>
            eb.or(
              eb.cmp("inviterId", "=", authData.sub),
              eb.exists("list", (q) =>
                q.whereExists("members", (mq) =>
                  mq.where("userId", "=", authData.sub).where("role", "=", "owner")
                )
              ),
            ),
        ],
      },
      // Only inviter or list owner can delete invitations
      delete: [
        (authData, eb) =>
          eb.or(
            eb.cmp("inviterId", "=", authData.sub),
            eb.exists("list", (q) =>
              q.whereExists("members", (mq) =>
                mq.where("userId", "=", authData.sub).where("role", "=", "owner")
              )
            ),
          ),
      ],
    },
  },

  // Global grocery items - read-only for everyone
  globalGroceryItems: {
    row: {
      select: ANYONE_CAN,
      insert: NOBODY_CAN,
      update: { preMutation: NOBODY_CAN, postMutation: NOBODY_CAN },
      delete: NOBODY_CAN,
    },
  },

  // User grocery history - users can only see their own history
  userGroceryHistory: {
    row: {
      select: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
      insert: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
      update: {
        preMutation: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
        postMutation: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
      },
      delete: [(authData, eb) => eb.cmp("userId", "=", authData.sub)],
    },
  },
}));
