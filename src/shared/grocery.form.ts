import z from "zod";
import { GROCERY_CATEGORIES } from "../schema";

export const groceryFormSchema = z.object({
  id: z.string().nanoid().optional(),
  name: z.string().min(1),
  quantity: z.coerce.number().positive(),
  category: z.enum(GROCERY_CATEGORIES),
});

export type GroceryFormValue = z.infer<typeof groceryFormSchema>;
