import { relations } from "drizzle-orm";
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  // custom types are supported for any column type!
  email: text("email").$type<`${string}@${string}`>().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  groceries: many(groceries),
}));

export const groceries = pgTable("grocery", {
  id: text("id").primaryKey(),
  // this JSON type will be passed to Zero
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  authorId: text("author_id").references(() => users.id),
});

export const groceriesRelations = relations(groceries, ({ one }) => ({
  author: one(users, {
    fields: [groceries.authorId],
    references: [users.id],
  }),
}));
