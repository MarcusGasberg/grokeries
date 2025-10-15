import { relations } from "drizzle-orm";
import {
  pgTable,
  boolean,
  text,
  integer,
  timestamp,
  pgEnum,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  language: text("language").default("en").notNull(), // ISO 639-1 language code
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const listRole = pgEnum("list_role", ["owner", "editor", "viewer"]);

export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const groceryListMembers = pgTable(
  "grocery_list_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listId: text("list_id")
      .notNull()
      .references(() => groceryList.id, { onDelete: "cascade" }),
    role: listRole("role").notNull().default("viewer"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.listId] })],
);

export const groceryListInvitations = pgTable("grocery_list_invitations", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => groceryList.id, { onDelete: "cascade" }),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  inviteeEmail: text("invitee_email").notNull(),
  role: listRole("role").notNull().default("viewer"),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: invitationStatus("status").notNull().default("pending"),
  token: text("token").notNull().unique(),
});

export const GROCERY_CATEGORIES = [
  "produce",
  "dairy",
  "meat",
  "frozen",
  "bakery",
  "pantry",
  "beverages",
  "household",
  "other",
] as const;
export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];

export const groceryCategory = pgEnum("grocery_category", GROCERY_CATEGORIES);

// Grocery List Table
export const groceryList = pgTable("grocery_list", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Weekly groceries"
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Update groceries table to belong to a list
export const groceries = pgTable("grocery", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completed: boolean().notNull().default(false),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  listId: text("list_id") // 👈 groceries now belong to a list
    .notNull()
    .references(() => groceryList.id, { onDelete: "cascade" }),
  category: groceryCategory("category").notNull().default("other"),
});

// Global grocery items - reference data for autocomplete
export const globalGroceryItems = pgTable("global_grocery_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Display name (e.g., "Milk")
  nameNormalized: text("name_normalized").notNull(), // Lowercase for matching
  language: text("language").notNull().default("en"), // ISO 639-1 code
  category: groceryCategory("category").notNull(),
  popularity: integer("popularity").notNull().default(0), // Global popularity score
  aliases: jsonb("aliases").$type<string[]>(), // Alternative names as JSON array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// User grocery history - permanent record for learning and stats
export const userGroceryHistory = pgTable("user_grocery_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  category: groceryCategory("category").notNull(),
  language: text("language").notNull().default("en"),
  usageCount: integer("usage_count").notNull().default(1), // How many times added
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(), // Most recent addition
  globalItemId: text("global_item_id").references(() => globalGroceryItems.id), // Link if matched
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const groceryListRelations = relations(groceryList, ({ many }) => ({
  members: many(groceryListMembers),
  groceries: many(groceries),
  invitations: many(groceryListInvitations),
}));

export const groceryListMembersRelations = relations(
  groceryListMembers,
  ({ one }) => ({
    user: one(user, {
      fields: [groceryListMembers.userId],
      references: [user.id],
    }),
    list: one(groceryList, {
      fields: [groceryListMembers.listId],
      references: [groceryList.id],
    }),
  }),
);

export const groceryListInvitationsRelations = relations(
  groceryListInvitations,
  ({ one }) => ({
    list: one(groceryList, {
      fields: [groceryListInvitations.listId],
      references: [groceryList.id],
    }),
    inviter: one(user, {
      fields: [groceryListInvitations.inviterId],
      references: [user.id],
      relationName: "inviter",
    }),
  }),
);

export const groceriesRelations = relations(groceries, ({ one }) => ({
  author: one(user, {
    fields: [groceries.authorId],
    references: [user.id],
  }),
  list: one(groceryList, {
    fields: [groceries.listId],
    references: [groceryList.id],
  }),
}));

export const usersRelations = relations(user, ({ many }) => ({
  groceries: many(groceries),
  lists: many(groceryListMembers),
  sentInvitations: many(groceryListInvitations, { relationName: "inviter" }),
  groceryHistory: many(userGroceryHistory),
}));

export const globalGroceryItemsRelations = relations(
  globalGroceryItems,
  ({ many }) => ({
    userHistory: many(userGroceryHistory),
  }),
);

export const userGroceryHistoryRelations = relations(
  userGroceryHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [userGroceryHistory.userId],
      references: [user.id],
    }),
    globalItem: one(globalGroceryItems, {
      fields: [userGroceryHistory.globalItemId],
      references: [globalGroceryItems.id],
    }),
  }),
);
