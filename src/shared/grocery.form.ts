import z from "zod";

export const groceryFormSchema = z.object({
  id: z.string().nanoid().optional(),
  name: z.string().min(1),
  quantity: z.coerce.number().positive(),
});

export type GroceryFormValue = z.infer<typeof groceryFormSchema>;
