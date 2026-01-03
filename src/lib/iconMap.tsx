import {
  Home,
  Building2,
  Car,
  UtensilsCrossed,
  Church,
  Users,
  Globe,
  Package,
  DollarSign,
  Briefcase,
  Laptop,
  Gift,
  CreditCard,
  Calendar,
  PiggyBank,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Home: Home,
  Bank: Building2,
  Car: Car,
  Food: UtensilsCrossed,
  Church: Church,
  Family: Users,
  Internet: Globe,
  Package: Package,
  Money: DollarSign,
  Business: Briefcase,
  Laptop: Laptop,
  Gift: Gift,
  CreditCard: CreditCard,
  Calendar: Calendar,
  PiggyBank: PiggyBank,
};

export function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Package;
  return ICON_MAP[iconName] || Package;
}

export function CategoryIcon({
  iconName,
  className = "h-5 w-5",
}: {
  iconName: string | null | undefined;
  className?: string;
}) {
  const Icon = getIconComponent(iconName);
  return <Icon className={className} />;
}

