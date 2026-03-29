import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UserSettingsDropdownProps {
  email: string;
  initial: string;
  expanded?: boolean;
}

export function UserSettingsDropdown({
  email,
  initial,
  expanded = true,
}: UserSettingsDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSettings = () => {
    setIsOpen(false);
    navigate("/settings");
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate("/login");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg transition-colors hover:bg-white/[0.06]",
            expanded ? "px-2 py-1.5 w-full" : "p-2 justify-center",
          )}
          title={email}
          aria-label="User menu"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-syne text-xs font-medium text-text-primary cursor-pointer hover:bg-white/[0.12]"
            title={email}
          >
            {initial}
          </div>
          {expanded ? (
            <span className="min-w-0 flex-1 truncate text-left">
              <p className="font-syne text-xs text-text-secondary">{email}</p>
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-64 z-[80]">
        <DropdownMenuLabel className="font-syne text-sm">
          <span className="block max-w-[14rem] truncate text-text-primary" title={email}>
            {email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSettings}>
          <Settings size={16} className="mr-2" />
          <span className="text-sm font-syne">Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-negative focus:text-negative"
        >
          <LogOut size={16} className="mr-2" />
          <span className="text-sm font-syne">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
