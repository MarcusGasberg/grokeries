import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import {
  MoreVertical,
  UserPlus,
  LogOut,
  Settings,
  Users,
  Share2,
} from "lucide-react";

interface UserMenuProps {
  onInviteClick: () => void;
}

export function UserMenu({ onInviteClick }: UserMenuProps) {
  const router = useRouter();
  const handleLogout = () => {
    authClient.signOut();
    router.navigate({
      to: "/login",
    });
  };

  const handleSettings = () => {
    // Add settings logic here
    console.log("Opening settings...");
  };

  const handleShare = () => {
    // Add share logic here
    console.log("Sharing list...");
  };

  const handleViewCollaborators = () => {
    // Add view collaborators logic here
    console.log("Viewing collaborators...");
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
        className="w-56 bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] p-2"
        align="end"
      >
        <DropdownMenuItem
          onClick={onInviteClick}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! hover:fill-accent focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 group-hover:text-foreground!" />
          INVITE USER
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewCollaborators}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <Users className="w-4 h-4 group-hover:text-foreground!" />
          COLLABORATORS
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleShare}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 group-hover:text-foreground!" />
          SHARE LIST
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSettings}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-accent hover:bg-accent hover:text-background! focus:border-accent focus:bg-accent focus:text-background transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4 group-hover:text-foreground!" />
          SETTINGS
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border-t-2 border-foreground my-2" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 font-black font-sans uppercase text-sm text-foreground border-2 border-transparent hover:border-red-500 hover:bg-red-500 hover:text-white! focus:border-red-500 focus:bg-red-500 focus:text-white transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 group-hover:text-white!" />
          LOGOUT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
