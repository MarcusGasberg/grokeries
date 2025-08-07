import z from "zod";

export const groceryFormSchema = z.object({
  id: z.string().nanoid().optional(),
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().positive("lol noob"),
});

export type GroceryFormValue = z.infer<typeof groceryFormSchema>;
