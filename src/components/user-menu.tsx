import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import {
  MoreVertical,
  UserPlus,
  LogOut,
  Settings,
  Users,
  Share2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface UserMenuProps {
  onInviteClick: () => void;
  onCreateListClick: () => void;
  onDeleteList?: () => void;
  currentListId?: string;
}

export function UserMenu({ onInviteClick, onCreateListClick, onDeleteList, currentListId }: UserMenuProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleLogout = () => {
    authClient.signOut();
    router.navigate({
      to: "/login",
    });
  };

  const handleSettings = () => {
    router.navigate({
      to: "/settings",
    });
  };

  const handleShare = () => {
    // Add share logic here
    console.log("Sharing list...");
  };

  const handleViewCollaborators = () => {
    // Add view collaborators logic here
    console.log("Viewing collaborators...");
  };

  const handleDeleteList = () => {
    setIsDeleteDialogOpen(false);
    if (onDeleteList) {
      onDeleteList();
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-foreground text-background border-2 border-foreground hover:bg-background hover:text-foreground font-black font-sans uppercase text-xs shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] hover:shadow-[1px_1px_0px_0px_rgba(31,41,55,1)] transition-all p-2"
        >
          <MoreVertical className="w-4 h-4 " />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] p-2"
        align="end"
      >
        <DropdownMenuItem
          onClick={onCreateListClick}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! hover:fill-accent focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 group-hover:text-foreground!" />
          {t("userMenu.createList")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onInviteClick}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! hover:fill-accent focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 group-hover:text-foreground!" />
          {t("userMenu.inviteUser")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewCollaborators}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <Users className="w-4 h-4 group-hover:text-foreground!" />
          {t("userMenu.collaborators")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleShare}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 group-hover:text-foreground!" />
          {t("userMenu.shareList")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSettings}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4 group-hover:text-foreground!" />
          {t("userMenu.settings")}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border-t-2 border-foreground my-2" />

        {currentListId && onDeleteList && (
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-red-500 hover:bg-red-500 hover:text-white! focus:border-red-500 focus:bg-red-500 focus:text-white transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 group-hover:text-white!" />
            {t("userMenu.deleteList")}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-red-500 hover:bg-red-500 hover:text-white! focus:border-red-500 focus:bg-red-500 focus:text-white transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 group-hover:text-white!" />
          {t("userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(31,41,55,1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black font-sans uppercase text-xl text-foreground">
              {t("userMenu.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold font-serif text-sm text-muted-foreground">
              {t("userMenu.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-black font-sans uppercase text-xs border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] hover:shadow-[1px_1px_0px_0px_rgba(31,41,55,1)]">
              {t("userMenu.deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="font-black font-sans uppercase text-xs bg-red-500 hover:bg-red-600 text-white border-2 border-red-700 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] hover:shadow-[1px_1px_0px_0px_rgba(31,41,55,1)]"
            >
              {t("userMenu.deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}
