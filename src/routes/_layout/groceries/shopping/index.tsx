import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ShoppingCart, X } from "lucide-react";
import { useQuery } from "@rocicorp/zero/react";
import { GroceryCategory } from "@/schema";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";
import { useShoppingStore } from "@/stores/shopping-store";
import { useEffect, useState, useRef } from "react";
import { Confetti } from "@/components/confetti";
import { nanoid } from "nanoid";
import { useTranslation } from "react-i18next";

const shoppingSearchSchema = z.object({
  listId: z.string().optional(),
});

export const Route = createFileRoute("/_layout/groceries/shopping/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return shoppingSearchSchema.parse(search);
  },
  beforeLoad: async () => {
    const { data: session, error } = await authClient.getSession();
    if (!session?.session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/groceries/shopping" },
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
  const { t } = useTranslation();
  const router = useRouter();
  const { zero, session } = router.options.context;
  const user = session?.data;
  const { listId } = Route.useSearch();
  const { startShopping, endShopping, categoryFilter, setCategoryFilter } =
    useShoppingStore();
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  const groceryQuery = zero.query.groceries
    .orderBy("createdAt", "desc")
    .related("author")
    .related("list")
    .where("listId", "=", listId ?? "-");

  const [groceries] = useQuery(groceryQuery);

  const listQuery = zero.query.groceryList.where("id", "=", listId ?? "-");
  const [lists] = useQuery(listQuery);
  const list = lists?.[0];

  const uncompletedItems = groceries.filter((item) => !item.completed);
  const completedItems = groceries.filter((item) => item.completed);

  const completedCount = completedItems.length;
  const totalCount = groceries.length;

  // Get unique categories from current list items
  const availableCategories = categories.filter((cat) =>
    groceries.some((item) => item.category === cat.value),
  );

  // Filter and sort items based on category filter
  const getFilteredItems = (items: typeof groceries) => {
    if (!categoryFilter) return items;

    const matching = items.filter((item) => item.category === categoryFilter);
    const nonMatching = items.filter(
      (item) => item.category !== categoryFilter,
    );

    return [...matching, ...nonMatching];
  };

  const filteredUncompletedItems = getFilteredItems(uncompletedItems);
  const filteredCompletedItems = getFilteredItems(completedItems);

  const handleCategoryFilter = (categoryValue: string | null) => {
    // Toggle: if clicking the same category, clear the filter
    if (categoryFilter === categoryValue) {
      setCategoryFilter(null);
    } else {
      setCategoryFilter(categoryValue);
    }
  };

  // Start shopping trip when component mounts
  useEffect(() => {
    if (listId) {
      startShopping(listId);
    }

    // Cleanup on unmount
    return () => {
      setShowConfetti(false);
      setShowCompletionOverlay(false);
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [listId, startShopping]);

  // Auto-redirect on 100% completion with celebration
  useEffect(() => {
    if (
      totalCount > 0 &&
      completedCount === totalCount &&
      !hasTriggeredRef.current
    ) {
      hasTriggeredRef.current = true;

      // Trigger confetti and completion overlay
      setShowConfetti(true);
      setShowCompletionOverlay(true);

      // Set timer (don't clear it in this effect)
      redirectTimerRef.current = setTimeout(() => {
        endShopping();
        router.navigate({
          to: "/groceries",
          search: { listId },
        });
      }, 2000) as NodeJS.Timeout;
    }
  }, [completedCount, totalCount, listId, router, endShopping]);

  const toggleItem = async (id: string) => {
    const item = groceries.find((item) => item.id === id);
    if (!item || !user) return;

    // Update the item completion status
    zero.mutate.groceries.update({
      id: item.id,
      completed: !item.completed,
      updatedAt: Date.now(),
    });

    // Track in user history when marking as complete
    if (!item.completed) {
      const historyQuery = zero.query.userGroceryHistory
        .where("userId", "=", user.userID)
        .where("nameNormalized", "=", item.name.toLowerCase().trim());

      const [existingHistory] = await historyQuery.run();

      if (existingHistory && existingHistory.length > 0) {
        // Update existing history entry
        const history = existingHistory[0];
        zero.mutate.userGroceryHistory.update({
          id: history.id,
          usageCount: history.usageCount + 1,
          lastUsedAt: Date.now(),
          category: item.category,
        });
      } else {
        // Create new history entry
        zero.mutate.userGroceryHistory.insert({
          id: nanoid(),
          userId: user.userID,
          name: item.name,
          nameNormalized: item.name.toLowerCase().trim(),
          category: item.category,
          language: "en",
          usageCount: 1,
          lastUsedAt: Date.now(),
          createdAt: Date.now(),
          globalItemId: null,
        });
      }
    }
  };

  const getCategoryInfo = (categoryValue: string | null) => {
    return (
      categories.find((cat) => cat.value === categoryValue) ||
      categories[categories.length - 1]
    );
  };

  const handleBack = () => {
    router.navigate({
      to: "/groceries",
      search: { listId },
    });
  };

  const handleFinishShopping = () => {
    // Reset celebration states
    setShowConfetti(false);
    setShowCompletionOverlay(false);
    endShopping();
    router.navigate({
      to: "/groceries",
      search: { listId },
    });
  };

  const handleExitClick = () => {
    const uncompletedCount = uncompletedItems.length;
    // Show confirmation if more than 5 uncompleted items
    if (uncompletedCount > 5) {
      setShowExitConfirmation(true);
    } else {
      handleFinishShopping();
    }
  };

  const confirmExit = () => {
    setShowExitConfirmation(false);
    handleFinishShopping();
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      {/* Confetti Animation */}
      <Confetti
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Completion Overlay */}
      {showCompletionOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-accent text-accent-foreground p-12 border-8 border-accent-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] animate-[bounce_0.5s_ease-in-out]">
            <div className="text-center">
              <p className="text-5xl font-black font-sans uppercase tracking-tight mb-4">
                {t("groceries:shopping.completionOverlay")}
              </p>
              <p className="text-2xl font-bold font-serif uppercase tracking-wide">
                {t("groceries:shopping.completionOverlaySubtitle")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Header */}
      <div className="mb-6 pt-4">
        <div className="bg-primary text-primary-foreground py-3 px-4 border-4 border-primary shadow-[6px_6px_0px_0px_var(--ring)]">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-primary-foreground/10 border-2 border-primary-foreground/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="p-1.5 bg-accent border-2 border-accent-foreground">
                <ShoppingCart className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-black font-sans tracking-tight uppercase">
                  {t("groceries:shopping.mode")}
                </h1>
                <p className="text-xs font-bold font-serif uppercase tracking-wide opacity-90">
                  {list?.name || t("groceries:shopping.loading")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitClick}
              className="p-2 hover:bg-destructive/20 border-2 border-primary-foreground/20 hover:border-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="bg-primary-foreground/10 p-3 border-2 border-primary-foreground/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black font-sans uppercase tracking-wide">
                {t("groceries:shopping.progress")}
              </span>
              <span className="text-lg font-black font-mono">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="w-full bg-primary-foreground/20 h-2 border-2 border-primary-foreground/30">
              <div
                className="bg-accent h-full transition-all duration-500 ease-out"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Bar - Sticky */}
      {availableCategories.length > 0 && (
        <div className="sticky top-0 z-30 bg-background pb-4 mb-6 border-b-4 border-primary">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              {/* ALL ITEMS Chip */}
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`flex-shrink-0 px-4 py-2 font-black font-sans uppercase tracking-wide text-sm border-4 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] ${
                  !categoryFilter
                    ? "bg-primary text-primary-foreground border-primary scale-105"
                    : "bg-background text-foreground border-muted-foreground hover:border-primary"
                }`}
              >
                {t("groceries:shopping.allItems")}
              </button>

              {/* Category Chips */}
              {availableCategories.map((cat) => {
                const isActive = categoryFilter === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryFilter(cat.value)}
                    className={`flex-shrink-0 px-4 py-2 font-black font-sans uppercase tracking-wide text-sm transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] ${
                      isActive
                        ? `${cat.color} scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]`
                        : `bg-background text-foreground border-4 border-muted-foreground hover:${cat.color.split(" ")[0]}`
                    }`}
                  >
                    {t(`groceries:form.categories.${cat.value}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Uncompleted Items - Large, Focused */}
      <div className="space-y-4 mb-8">
        {uncompletedItems.length === 0 && completedItems.length === 0 ? (
          <Card className="border-4 border-dashed border-muted-foreground">
            <CardContent className="p-8 text-center">
              <p className="font-black font-sans uppercase text-lg text-muted-foreground">
                {t("groceries:shopping.noItems")}
              </p>
              <p className="text-sm font-bold font-serif uppercase text-muted-foreground/70 mt-1">
                {t("groceries:shopping.noItemsDescription")}
              </p>
            </CardContent>
          </Card>
        ) : uncompletedItems.length === 0 ? (
          <Card className="border-4 border-accent bg-accent text-accent-foreground">
            <CardContent className="p-8 text-center">
              <p className="font-black font-sans uppercase text-xl">
                {t("groceries:shopping.allComplete")}
              </p>
              <p className="text-sm font-bold font-serif uppercase mt-1">
                {t("groceries:shopping.allCompleteDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUncompletedItems.map((item) => {
            const categoryInfo = getCategoryInfo(item.category);
            const isMatchingFilter =
              !categoryFilter || item.category === categoryFilter;
            const dimmed = !isMatchingFilter;

            return (
              <Card
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`transition-all duration-200 border-2 shadow-[3px_3px_0px_0px_var(--ring)] hover:shadow-[2px_2px_0px_0px_var(--ring)] bg-card border-primary hover:bg-card/90 cursor-pointer ${
                  dimmed ? "opacity-50" : "opacity-100"
                }`}
                style={{
                  viewTransitionName: `item-${item.id}`,
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={false}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="w-6 h-6 border-2 border-primary flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <span className="font-black font-sans text-lg uppercase tracking-wide text-card-foreground block mb-1">
                        {item.name}
                      </span>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs font-black font-sans uppercase tracking-wide ${categoryInfo.color}`}
                        >
                          {t(`groceries:form.categories.${categoryInfo.value}`)}
                        </Badge>
                        {item.quantity && (
                          <span className="text-sm font-bold font-mono text-muted-foreground">
                            {t("groceries:shopping.quantity", { quantity: item.quantity })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Completed Items - Grayed Out at Bottom */}
      {completedItems.length > 0 && (
        <div className="space-y-3 mt-8 pt-8 border-t-4 border-dashed border-muted-foreground">
          <p className="text-sm font-black font-sans uppercase tracking-wide text-muted-foreground mb-4">
            {t("groceries:shopping.completedSection", { count: completedItems.length })}
          </p>
          {filteredCompletedItems.map((item) => {
            const categoryInfo = getCategoryInfo(item.category);
            const isMatchingFilter =
              !categoryFilter || item.category === categoryFilter;
            const dimmed = !isMatchingFilter;

            return (
              <Card
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`relative transition-all duration-200 border-2 shadow-[2px_2px_0px_0px_var(--ring)] hover:shadow-[1px_1px_0px_0px_var(--ring)] bg-muted border-muted-foreground cursor-pointer overflow-hidden ${
                  dimmed ? "opacity-30" : "opacity-50"
                }`}
                style={{
                  viewTransitionName: `item-${item.id}`,
                }}
              >
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={true}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="w-5 h-5 border-2 border-primary data-[state=checked]:bg-accent data-[state=checked]:border-accent flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="font-black font-sans text-xs uppercase tracking-wide line-through text-muted-foreground">
                        {item.name}
                      </span>
                      <Badge
                        className={`text-[10px] font-black font-sans uppercase tracking-wide ${categoryInfo.color} opacity-70 flex-shrink-0`}
                      >
                        {t(`groceries:form.categories.${item.category}`)}
                      </Badge>
                      {item.quantity && (
                        <span className="text-[10px] font-bold font-mono text-muted-foreground flex-shrink-0">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User Stamp */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="rotate-[-15deg] bg-transparent text-destructive px-3 py-1 border-4 border-destructive border-dashed">
                      <p className="font-black font-sans text-sm uppercase tracking-wider">
                        ✓{" "}
                        <span className="underline">
                          {item.author?.name || "UNKNOWN"}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitConfirmation}
        onOpenChange={setShowExitConfirmation}
      >
        <DialogContent className="border-4 border-primary shadow-[8px_8px_0px_0px_var(--ring)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-sans uppercase tracking-tight">
              {t("groceries:shopping.exitConfirmTitle")}
            </DialogTitle>
            <DialogDescription className="text-base font-bold font-serif uppercase text-muted-foreground">
              {t("groceries:shopping.exitConfirmDescription", { count: uncompletedItems.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExitConfirmation(false)}
              className="font-black font-sans uppercase border-2 shadow-[2px_2px_0px_0px_var(--ring)]"
            >
              {t("groceries:shopping.keepShopping")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
              className="font-black font-sans uppercase border-2 border-destructive shadow-[2px_2px_0px_0px_var(--ring)]"
            >
              {t("groceries:shopping.exitAnyway")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
