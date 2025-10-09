import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  ShoppingCart,
  CheckCircle2,
  Zap,
  ListPlus,
} from "lucide-react";
import { useQuery } from "@rocicorp/zero/react";
import { Schema } from "@/zero/zero-schema";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { groceryFormSchema, GroceryFormValue } from "@/shared/grocery.form";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { GroceryCategory } from "@/schema";
import { authClient } from "@/lib/auth-client";
import { UserMenu } from "@/components/user-menu";
import { InviteDialog } from "@/components/invite-dialog";
import { CreateListDialog } from "@/components/create-list-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_layout/groceries/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      listId: (search.listId as string) || undefined,
    };
  },
  beforeLoad: async () => {
    const { data: session, error } = await authClient.getSession();
    if (!session?.session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/groceries" }, // optional: send them back after login
      });
    }
  },
});

interface Category {
  value: GroceryCategory;
  name: string;
  color: string;
}

const categories: Category[] = [
  {
    value: "produce",
    name: "🥬 Produce",
    color: "bg-green-100 text-green-900 border-green-400 border-2",
  },
  {
    value: "dairy",
    name: "🥛 Dairy",
    color: "bg-blue-100 text-blue-900 border-blue-400 border-2",
  },
  {
    value: "meat",
    name: "🥩 Meat",
    color: "bg-red-100 text-red-900 border-red-400 border-2",
  },
  {
    value: "pantry",
    name: "🥫 pantry",
    color: "bg-amber-100 text-amber-900 border-amber-400 border-2",
  },
  {
    value: "bakery",
    name: "🍞 Bakery",
    color: "bg-yellow-100 text-yellow-900 border-yellow-400 border-2",
  },
  {
    value: "frozen",
    name: "🧊 Frozen",
    color: "bg-cyan-100 text-cyan-900 border-cyan-400 border-2",
  },
  {
    value: "beverages",
    name: "🍹 Beverages",
    color: "bg-purple-100 text-purple-900 border-purple-400 border-2",
  },
  {
    value: "household",
    name: "🧼 Household",
    color: "bg-pink-100 text-pink-900 border-pink-400 border-2",
  },
  {
    value: "other",
    name: "📦 Other",
    color: "bg-gray-100 text-gray-900 border-gray-400 border-2",
  },
] as const;

function RouteComponent() {
  const router = useRouter();
  const { zero, session } = router.options.context;
  const user = session?.data;
  const { listId: listIdFromUrl } = Route.useSearch();

  const listsQuery = zero.query.groceryList
    .whereExists("members", (q) => q.where("userId", "=", user?.userID ?? "-"))
    .orderBy("name", "desc");

  const [lists] = useQuery(listsQuery);
  const [selectedListId, setSelectedListId] = useState<string>(
    listIdFromUrl || lists?.[0]?.id
  );

  const updateSelectedListId = (listId: string) => {
    setSelectedListId(listId);
    router.navigate({
      to: "/groceries",
      search: { listId },
      replace: true,
    });
  };

  listsQuery.preload().complete.then();

  useEffect(() => {
    if (user && lists?.length === 0) {
      const name = user.name.endsWith("s")
        ? `${user.name}' List`
        : `${user.name}'s List`;
      const listId = nanoid();
      zero.mutate.groceryList.addInital({
        name,
        id: listId,
      });
    } else if (!listIdFromUrl && lists?.[0]?.id) {
      updateSelectedListId(lists[0].id);
    }
  }, [lists, listIdFromUrl]);

  const groceryQuery = zero.query.groceries
    .orderBy("createdAt", "desc")
    .related("author")
    .related("list")
    .where("listId", "=", selectedListId);

  const [groceries] = useQuery(groceryQuery);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);

  const form = useForm<GroceryFormValue>({
    resolver: zodResolver(groceryFormSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      category: "produce",
    },
  });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.key !== "Enter" &&
        event.key !== "Backspace" &&
        event.key !== " " &&
        event.target.tagName !== "INPUT" &&
        event.target.tagName !== "TEXTAREA" &&
        event.target.tagName !== "SELECT" &&
        event.target.closest("#grocery-form-card")
      ) {
        form.setFocus("name");
        form.setValue("name", `${form.getValues("name")}${event.key}`);
      }
    };

    document.addEventListener("keypress", handleKeyPress);

    return () => {
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  const selectedCategory = form.watch("category");

  const addItem = (data: GroceryFormValue) => {
    const existingGroceryItem = groceries.find(
      (grocery) => grocery.name === data.name,
    );

    zero.mutate.groceries.insert({
      ...data,
      authorId: user?.userID ?? "",
      updatedAt: Date.now(),
      createdAt: Date.now(),
      id: nanoid(),
      listId: selectedListId,
    });

    form.resetField("name");
    form.resetField("quantity");
  };

  const completedCount = groceries.filter((item) => item.completed).length;
  const totalCount = groceries.length;

  const toggleItem = (id: string) => {
    const item = groceries.find((item) => item.id === id);
    if (item) {
      zero.mutate.groceries.update({
        id: item.id,
        completed: !item.completed,
        updatedAt: Date.now(),
      });
    }
  };

  const deleteItem = (id: string) => {
    zero.mutate.groceries.delete({ id });
  };

  const getCategoryInfo = (categoryValue: string | null) => {
    return (
      categories.find((cat) => cat.value === categoryValue) ||
      categories[categories.length - 1]
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-md md:max-w-3xl mx-auto">
      <div className="mb-8 pt-6">
        <div className="bg-primary text-primary-foreground py-4 px-6 border-4 border-primary shadow-[8px_8px_0px_0px_var(--ring)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-2 bg-accent border-2 border-accent-foreground flex-shrink-0">
                <ShoppingCart className="w-8 h-8 text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tight uppercase truncate">
                  {user?.name ?? ""}' GROKERIES
                </h1>
                <p className="text-xs md:text-sm font-bold font-serif uppercase tracking-wide">
                  EFFICIENT SHOPPING
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-center justify-end flex-shrink-0">
              <Select
                value={selectedListId}
                onValueChange={updateSelectedListId}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Grocery lists</SelectLabel>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <UserMenu
                onInviteClick={() => setIsInviteDialogOpen(true)}
                onCreateListClick={() => setIsCreateListDialogOpen(true)}
              />
            </div>
          </div>
        </div>

        {totalCount > 0 ? (
          completedCount != totalCount ? (
            <div className="mt-6 p-4 bg-accent text-accent-foreground border-4 border-accent shadow-[4px_4px_0px_0px_var(--primary)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black font-sans uppercase tracking-wide">
                  PROGRESS
                </span>
                <span className="text-lg font-black font-mono">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="w-full bg-accent-foreground h-3 border-2 border-primary">
                <div
                  className="bg-primary h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                groceries.forEach((item) => {
                  deleteItem(item.id);
                });
              }}
              className="mt-6 w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black font-sans uppercase tracking-wide text-sm border-2 border-destructive shadow-[4px_4px_0px_0px_var(--ring)] hover:shadow-[2px_2px_0px_0px_var(--ring)] transition-all"
            >
              COMPLETE MISSION
            </Button>
          )
        ) : (
          <></>
        )}
      </div>

      <Card
        id="grocery-form-card"
        className="mb-6 border-4 border-primary shadow-[6px_6px_0px_0px_var(--ring)]"
      >
        <CardContent className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(addItem)} className="space-y-4">
              <div className="flex gap-2">
                <FormField
                  {...form.register("name")}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          id="name-field"
                          placeholder="ADD ITEM..."
                          {...field}
                          className="flex-1 border-2 border-border font-serif font-bold uppercase placeholder:text-muted-foreground text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                ></FormField>

                <FormField
                  {...form.register("quantity")}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="QTY"
                          {...field}
                          className="w-20 border-2 border-border font-serif font-bold uppercase placeholder:text-muted-foreground text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                ></FormField>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    type="button"
                    variant={
                      selectedCategory === category.value
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => form.setValue("category", category.value)}
                    className={`text-xs font-black font-sans uppercase tracking-wide border-2 ${
                      selectedCategory === category.value
                        ? "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--accent)]"
                        : "border-border hover:shadow-[2px_2px_0px_0px_var(--ring)]"
                    }`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black font-sans uppercase tracking-wide text-sm border-2 border-accent shadow-[4px_4px_0px_0px_var(--ring)] hover:shadow-[2px_2px_0px_0px_var(--ring)] transition-all"
                disabled={!form.formState.isValid}
              >
                <Plus className="w-5 h-5 mr-2" />
                DESTROY HUNGER
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {groceries.length === 0 ? (
          <Card className="border-4 border-dashed border-muted-foreground col-span-full">
            <CardContent className="p-8 text-center">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="font-black font-sans uppercase text-lg text-muted-foreground">
                EMPTY LIST
              </p>
              <p className="text-sm font-bold font-serif uppercase text-muted-foreground/70 mt-1">
                ADD ITEMS TO DOMINATE
              </p>
            </CardContent>
          </Card>
        ) : (
          groceries.map((item) => {
            const categoryInfo = getCategoryInfo(item.category);
            return (
              <Card
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`transition-all duration-200 border-4 shadow-[4px_4px_0px_0px_var(--ring)] hover:shadow-[2px_2px_0px_0px_var(--ring)] ${
                  item.completed
                    ? "opacity-60 bg-muted border-muted-foreground"
                    : "bg-card border-primary hover:bg-card/90"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={!!item.completed}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="w-6 h-6 border-2 border-primary data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`font-black font-sans text-sm uppercase tracking-wide ${
                            item.completed
                              ? "line-through text-muted-foreground"
                              : "text-card-foreground"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.completed && (
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          className={`text-xs font-black font-sans uppercase tracking-wide ${categoryInfo.color}`}
                        >
                          {item.category}
                        </Badge>
                        {item.quantity && (
                          <span className="text-xs font-bold font-mono text-muted-foreground">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        deleteItem(item.id);
                        e.stopPropagation();
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 border-2 border-transparent hover:border-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {totalCount > 0 && completedCount === totalCount && (
        <Card className="mt-8 bg-accent text-accent-foreground border-4 border-accent shadow-[6px_6px_0px_0px_var(--ring)]">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-accent-foreground mx-auto mb-3" />
            <p className="font-black font-sans text-xl uppercase tracking-wide">
              MISSION COMPLETE!
            </p>
            <p className="text-sm font-bold font-serif uppercase mt-1">
              GROCERY DOMINATION ACHIEVED
            </p>
          </CardContent>
        </Card>
      )}

      <InviteDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        listId={selectedListId}
      />

      <CreateListDialog
        isOpen={isCreateListDialogOpen}
        onClose={() => setIsCreateListDialogOpen(false)}
        onSuccess={updateSelectedListId}
      />
    </div>
  );
}
