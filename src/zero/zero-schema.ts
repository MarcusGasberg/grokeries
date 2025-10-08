import {
  ANYONE_CAN_DO_ANYTHING,
  type Row,
  definePermissions,
} from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

export type User = Row<typeof schema.tables.user>;
export type Grocery = Row<typeof schema.tables.groceries>;

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  account: ANYONE_CAN_DO_ANYTHING,
  groceries: ANYONE_CAN_DO_ANYTHING,
  groceryList: ANYONE_CAN_DO_ANYTHING,
  groceryListMembers: ANYONE_CAN_DO_ANYTHING,
  groceryListInvitations: ANYONE_CAN_DO_ANYTHING,
  jwks: ANYONE_CAN_DO_ANYTHING,
  session: ANYONE_CAN_DO_ANYTHING,
  user: ANYONE_CAN_DO_ANYTHING,
  verification: ANYONE_CAN_DO_ANYTHING,
}));
