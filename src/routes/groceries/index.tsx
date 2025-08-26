import { createFileRoute } from '@tanstack/react-router'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, ShoppingCart, CheckCircle2, Zap } from "lucide-react"
import { useQuery, useZero } from "@rocicorp/zero/react";
import { Grocery, Schema } from '@/zero/zero-schema';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { groceryFormSchema, GroceryFormValue } from '@/shared/grocery.form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';


export const Route = createFileRoute('/groceries/')({
  component: RouteComponent,
});

interface GroceryItem {
  id: string
  name: string
  category: string
  completed: boolean
  quantity?: string
}

const categories = [
  { name: "🥬 Produce", color: "bg-green-100 text-green-900 border-green-400 border-2" },
  { name: "🥛 Dairy", color: "bg-blue-100 text-blue-900 border-blue-400 border-2" },
  { name: "🥩 Meat", color: "bg-red-100 text-red-900 border-red-400 border-2" },
  { name: "🥫 Pantry", color: "bg-amber-100 text-amber-900 border-amber-400 border-2" },
  { name: "🧊 Frozen", color: "bg-cyan-100 text-cyan-900 border-cyan-400 border-2" },
  { name: "📦 Other", color: "bg-gray-100 text-gray-900 border-gray-400 border-2" },
]

function RouteComponent() {
  const z = useZero<Schema>();

  const groceryQuery = z.query.groceries
    .orderBy('updatedAt', 'desc')
    .related('author')
    .limit(10);

  const [items, setItems] = useState<GroceryItem[]>([
    { id: "1", name: "ORGANIC SPINACH", category: "🥬 Produce", completed: false, quantity: "1 BAG" },
    { id: "2", name: "GREEK YOGURT", category: "🥛 Dairy", completed: true, quantity: "2 CUPS" },
    { id: "3", name: "CHICKEN BREAST", category: "🥩 Meat", completed: false, quantity: "1 LB" },
    { id: "4", name: "WHOLE GRAIN BREAD", category: "🥫 Pantry", completed: false },
  ])

  const [groceries] = useQuery(groceryQuery);
  const [showExistingGroceryItemDialog, setShowExistingGroceryItemDialog] = useState<Grocery | undefined>(undefined);

  const form = useForm<GroceryFormValue>({
    resolver: zodResolver(groceryFormSchema),
    defaultValues: {
      name: '',
      quantity: 1
    },
  });

  const addItem = (data: GroceryFormValue) => {
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
      updatedAt: Date.now(),
      createdAt: Date.now(),
      id: nanoid(),
    });
  };

  const [selectedCategory, setSelectedCategory] = useState("📦 Other")

  const onUpdateFromExistingGroceryItem = (data: GroceryFormValue | undefined) => {
    setShowExistingGroceryItemDialog(undefined);
    if (!data?.id) return;

    z.mutate.groceries.upsert({
      ...data,
      id: data.id,
      updatedAt: Date.now()
    });
  }

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length


  const toggleItem = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const getCategoryInfo = (categoryName: string) => {
    return categories.find((cat) => cat.name === categoryName) || categories[categories.length - 1]
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="mb-8 pt-6">
        <div className="bg-primary text-primary-foreground p-6 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(139,92,246,1)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-accent border-2 border-accent-foreground">
              <ShoppingCart className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-sans tracking-tight uppercase">GROKERIES</h1>
              <h2 className="text-2xl font-black font-sans tracking-tight uppercase">GROCERY DESTROYER</h2>
            </div>
          </div>
          <p className="text-sm font-bold font-serif uppercase tracking-wide">BRUTALLY EFFICIENT SHOPPING</p>
        </div>

        {totalCount > 0 && (
          <div className="mt-6 p-4 bg-accent text-accent-foreground border-4 border-accent shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black font-sans uppercase tracking-wide">PROGRESS</span>
              <span className="text-lg font-black font-mono">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="w-full bg-accent-foreground h-3 border-2 border-primary">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Card className="mb-6 border-4 border-primary shadow-[6px_6px_0px_0px_rgba(31,41,55,1)]">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(addItem)} className="space-y-4">
              <div className="flex gap-2">
                <FormField {...form.register('name')} render={
                  ({ field }) => (<FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="ADD ITEM..."
                        {...field}
                        className="flex-1 border-2 border-border font-serif font-bold uppercase placeholder:text-muted-foreground text-sm"
                      />
                    </FormControl>
                    <FormMessage></FormMessage>
                  </FormItem>)
                }>
                </FormField>

                <FormField {...form.register('quantity')} render={
                  ({ field }) => (<FormItem>
                    <FormControl>
                      <Input
                        placeholder="QTY"
                        {...field}
                        className="w-20 border-2 border-border font-serif font-bold uppercase placeholder:text-muted-foreground text-sm"
                      />
                    </FormControl>
                    <FormMessage></FormMessage>
                  </FormItem>)
                } >

                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.name}
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`text-xs font-black font-sans uppercase tracking-wide border-2 ${selectedCategory === category.name
                      ? "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_rgba(139,92,246,1)]"
                      : "border-border hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)]"
                      }`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black font-sans uppercase tracking-wide text-sm border-2 border-accent shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
                disabled={!form.formState.isValid}
              >
                <Plus className="w-5 h-5 mr-2" />
                DESTROY HUNGER
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.length === 0 ? (
          <Card className="border-4 border-dashed border-muted-foreground">
            <CardContent className="p-8 text-center">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="font-black font-sans uppercase text-lg text-muted-foreground">EMPTY LIST</p>
              <p className="text-sm font-bold font-serif uppercase text-muted-foreground/70 mt-1">
                ADD ITEMS TO DOMINATE
              </p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const categoryInfo = getCategoryInfo(item.category)
            return (
              <Card
                key={item.id}
                className={`transition-all duration-200 border-4 shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] ${item.completed
                  ? "opacity-60 bg-muted border-muted-foreground"
                  : "bg-card border-primary hover:bg-card/90"
                  }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="w-6 h-6 border-2 border-primary data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`font-black font-sans text-sm uppercase tracking-wide ${item.completed ? "line-through text-muted-foreground" : "text-card-foreground"
                            }`}
                        >
                          {item.name}
                        </span>
                        {item.completed && <CheckCircle2 className="w-5 h-5 text-accent" />}
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs font-black font-sans uppercase tracking-wide ${categoryInfo.color}`}>
                          {item.category}
                        </Badge>
                        {item.quantity && (
                          <span className="text-xs font-bold font-mono text-muted-foreground">{item.quantity}</span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 border-2 border-transparent hover:border-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {totalCount > 0 && completedCount === totalCount && (
        <Card className="mt-8 bg-accent text-accent-foreground border-4 border-accent shadow-[6px_6px_0px_0px_rgba(31,41,55,1)]">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-accent-foreground mx-auto mb-3" />
            <p className="font-black font-sans text-xl uppercase tracking-wide">MISSION COMPLETE!</p>
            <p className="text-sm font-bold font-serif uppercase mt-1">GROCERY DOMINATION ACHIEVED</p>
          </CardContent>
        </Card>
      )}
    </div>)
}
