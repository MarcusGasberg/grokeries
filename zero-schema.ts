import {
  ANYONE_CAN_DO_ANYTHING,
  type Row,
  definePermissions,
} from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

export type User = Row<typeof schema.tables.users>;

export const permissions = definePermissions<{}, Schema>(schema, () => ({
  groceries: ANYONE_CAN_DO_ANYTHING,
}));
