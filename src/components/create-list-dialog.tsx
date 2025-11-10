import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { nanoid } from "nanoid";

// ------------------
// Schema
// ------------------
type CreateListFormValues = {
  name: string;
};

// ------------------
// Component
// ------------------
export function CreateListDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (listId: string) => void;
}) {
  const { t } = useTranslation("common");
  const { zero } = useRouter().options.context;

  // Create schema with i18n messages
  const createListSchema = z.object({
    name: z
      .string()
      .min(1, { message: t("createListDialog.validation.nameRequired") }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateListFormValues>({
    resolver: zodResolver(createListSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: CreateListFormValues) => {
    const listId = nanoid();

    // Optimistically update UI first
    onSuccess?.(listId);
    reset();
    onClose();

    // Then sync to server
    try {
      zero.mutate.groceryList.add({ id: listId, name: values.name });
      toast({
        title: t("createListDialog.success"),
        duration: 60_0000,
      });
    } catch (error) {
      console.error("Error creating grocery list:", error);
      toast({
        variant: "destructive",
        title: t("createListDialog.error"),
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] max-w-md">
        <DialogHeader className="border-b-4 border-foreground pb-4 mb-6">
          <DialogTitle className="text-2xl font-black font-sans uppercase tracking-tight text-foreground">
            {t("createListDialog.title")}
          </DialogTitle>
          <p className="text-sm font-bold font-serif uppercase tracking-wide text-muted-foreground mt-2">
            {t("createListDialog.subtitle")}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-black font-sans uppercase tracking-wide text-foreground"
            >
              {t("createListDialog.nameLabel")}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t("createListDialog.namePlaceholder")}
              {...register("name")}
              className="border-4 border-foreground bg-background text-foreground placeholder:text-muted-foreground font-bold font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] focus:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
            />
            {errors.name && (
              <p className="text-red-500 text-sm font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-accent text-accent-foreground border-4 border-accent-foreground hover:bg-accent-foreground hover:text-accent font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting
                ? t("createListDialog.creating")
                : t("createListDialog.createList")}
            </Button>
            <Button
              type="button"
              onClick={() => onClose()}
              variant="outline"
              className="bg-background text-foreground border-4 border-foreground hover:bg-foreground hover:text-background font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
