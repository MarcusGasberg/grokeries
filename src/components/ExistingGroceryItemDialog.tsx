import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { groceryFormSchema, GroceryFormValue } from "@/shared/grocery.form"
import { Grocery } from "@/zero/zero-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect } from "react";

export function ExistingGroceryItemDialog(props: { existingGroceryItem?: Grocery, close: (formValue: GroceryFormValue | undefined) => void }) {
  const form = useForm<GroceryFormValue>({
    resolver: zodResolver(groceryFormSchema),
    defaultValues: {
      id: props.existingGroceryItem?.id,
      name: props.existingGroceryItem?.name,
      quantity: props.existingGroceryItem?.quantity
    },
  });

  useEffect(() => {
    form.reset({
      id: props.existingGroceryItem?.id,
      name: props.existingGroceryItem?.name,
      quantity: props.existingGroceryItem?.quantity
    });
  }, [props.existingGroceryItem, form]);

  const onSubmit = (value: GroceryFormValue) => {
    props.close(value);
  }

  return (
    <Dialog open={!!props.existingGroceryItem} onOpenChange={(open) => {
      if (!open) {
        props.close(undefined)
      }
    }}>
      <Form {...form} >
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex gap-2 items-center">
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Existing Grocery</DialogTitle>
              <DialogDescription>
                You are trying to add an item that already exists in your grocery list. You can update the quantity or cancel to keep the existing item.
              </DialogDescription>
            </DialogHeader>
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

            <DialogFooter>
              <Button
                disabled={!form.formState.isValid}
                type="submit"
                onClick={() => onSubmit(form.getValues())}
              >
                Update
              </Button>

              <DialogClose asChild>
                <Button type="reset" variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  )
}
