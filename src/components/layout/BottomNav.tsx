"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, List, Target, PieChart, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dash", path: "/", icon: LayoutDashboard },
  { name: "Trans", path: "/transactions", icon: List },
  { name: "Budgets", path: "/budgets", icon: PieChart },
  { name: "Goals", path: "/goals", icon: Target },
  { name: "Settings", path: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  
  // Hide bottom nav on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }
  
  // Build href with month parameter preserved (except for Goals and Settings which don't use month)
  const getHref = (path: string) => {
    if (path === "/goals" || path === "/settings") {
      return path;
    }
    return monthParam ? `${path}?month=${monthParam}` : path;
  };

  return (
    <>
      {/* FAB - Fixed Bottom Right */}
      <div className="fixed bottom-20 right-4 z-50">
        <Link href="/add">
           <Button 
             size="fab" 
             className="rounded-full shadow-xl bg-primary hover:bg-primary/90 text-white w-14 h-14 p-0 flex items-center justify-center"
           >
             <Plus className="h-6 w-6" />
           </Button>
        </Link>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 pb-safe">
        <nav className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={getHref(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
