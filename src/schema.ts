import { relations } from "drizzle-orm";
import {
  pgTable,
  boolean,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  // custom types are supported for any column type!
  email: text("email").$type<`${string}@${string}`>().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  groceries: many(groceries),
}));

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

const groceryCategory = pgEnum("grocery_category", GROCERY_CATEGORIES);

export const groceries = pgTable("grocery", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completed: boolean().notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  authorId: text("author_id").references(() => users.id),
  category: groceryCategory("category").notNull().default("other"),
});

export const groceriesRelations = relations(groceries, ({ one }) => ({
  author: one(users, {
    fields: [groceries.authorId],
    references: [users.id],
  }),
}));
