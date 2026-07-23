"use client";

import { Plus, Package, ShoppingCart, FolderTree, Tag, Store, TicketPercent, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";

export function AddNewDropdown() {
  const { t } = useI18n();

  const options = [
    { label: t("header.product"), icon: Package },
    { label: t("header.order"), icon: ShoppingCart },
    { label: t("header.category"), icon: FolderTree },
    { label: t("header.brand"), icon: Tag },
    { label: t("header.seller"), icon: Store },
    { label: t("header.coupon"), icon: TicketPercent },
    { label: t("header.blogPost"), icon: Newspaper },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("header.addNew")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {options.map((opt) => (
          <DropdownMenuItem key={opt.label} onClick={() => toast.success(`${opt.label} — form opened`)}>
            <opt.icon /> {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
