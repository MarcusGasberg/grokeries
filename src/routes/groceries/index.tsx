import { createFileRoute } from '@tanstack/react-router'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useQuery, useZero } from "@rocicorp/zero/react";
import { Grocery, Schema } from '@/zero/zero-schema';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ExistingGroceryItemDialog } from '@/components/ExistingGroceryItemDialog';
import { groceryFormSchema, GroceryFormValue } from '@/shared/grocery.form';


export const Route = createFileRoute('/groceries/')({
  component: RouteComponent,
});

function RouteComponent() {
  const z = useZero<Schema>();

  const groceryQuery = z.query.groceries
    .orderBy('updatedAt', 'desc')
    .related('author')
    .limit(10);

  const [groceries] = useQuery(groceryQuery);
  const [showExistingGroceryItemDialog, setShowExistingGroceryItemDialog] = useState<Grocery | undefined>(undefined);

  const form = useForm<GroceryFormValue>({
    resolver: zodResolver(groceryFormSchema),
    defaultValues: {
      name: '',
      quantity: 1
    },
  });

  const onSubmit = (data: GroceryFormValue) => {
    const existingGroceryItem = groceries.find(grocery => grocery.name === data.name);
    if (existingGroceryItem) {
      setShowExistingGroceryItemDialog({
        ...existingGroceryItem,
        quantity: data.quantity + existingGroceryItem.quantity
      });
      return;
    }

    z.mutate.groceries.insert({
      ...data,
      createdAt: Date.now(),
      id: nanoid(),
    });
  };

  const onUpdateFromExistingGroceryItem = (data: GroceryFormValue | undefined) => {
    setShowExistingGroceryItemDialog(undefined);
    if (!data?.id) return;

    z.mutate.groceries.upsert({
      ...data,
      id: data.id,
      updatedAt: Date.now()
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl">Grocery List</h1>
      <Form {...form} >
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-center">
          <FormField {...form.register("name")} render={({ field }) => (<FormItem>
            <FormLabel>Grocery Name</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Grocery Name"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>)
          }>
          </FormField>

          <FormField {...form.register("quantity")} render={({ field }) => (<FormItem>
            <FormLabel>Quantity</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Quantity"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>)
          }>
          </FormField>

          <Button
            className="self-center"
            disabled={!form.formState.isValid}
            type="submit"
          >
            Add
          </Button>
        </form>
      </Form>

      <ul className="space-y-2">
        {groceries.map(grocery => (
          <li key={grocery.id} className="flex justify-between items-center p-2 border rounded-md bg-white shadow-sm">
            <span><b>{grocery.name}</b> - {grocery.quantity}</span>
            <span className="text-sm text-gray-500">Added by {grocery.author?.name || 'Unknown'}</span>
            {grocery.createdAt && <span className="text-sm text-gray-400" suppressHydrationWarning={true}>{new Date(grocery.createdAt).toLocaleDateString()} {new Date(grocery.createdAt).toLocaleTimeString()}</span>}
          </li>
        ))
        }
      </ul>
      {<ExistingGroceryItemDialog existingGroceryItem={showExistingGroceryItemDialog} close={(res) => onUpdateFromExistingGroceryItem(res)} />}
    </div>
  )
}
