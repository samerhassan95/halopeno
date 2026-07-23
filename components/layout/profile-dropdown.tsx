"use client";

import { User, Settings, History, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";

export function ProfileDropdown() {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8 ring-2 ring-primary/15">
          <AvatarFallback className="bg-gradient-to-br from-[#149BFF] to-[#9061F9] text-white">SK</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case tracking-normal">
          <span className="text-sm font-semibold text-foreground">Sarah Kim</span>
          <span className="text-xs font-normal text-muted-foreground">{t("header.profile")}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User /> {t("header.myProfile")}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings /> {t("header.accountSettings")}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <History /> {t("header.activityLog")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => toast.success("Signed out successfully")}
        >
          <LogOut /> {t("header.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
