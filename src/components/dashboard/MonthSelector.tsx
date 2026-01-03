"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, subMonths, addMonths, isSameMonth } from "date-fns";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export function MonthSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentMonthKey = searchParams.get("month") || format(new Date(), "yyyy-MM");
  const currentDate = new Date(`${currentMonthKey}-01`);
  const today = new Date();
  const isCurrentMonth = isSameMonth(currentDate, today);

  const updateMonth = (monthKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthKey);
    const newUrl = `${pathname}?${params.toString()}`;
    
    // Use client-side navigation without page refresh
    startTransition(() => {
      router.push(newUrl);
    });
  };

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(currentDate, 1);
    const monthKey = format(prevMonth, "yyyy-MM");
    updateMonth(monthKey);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1);
    const monthKey = format(nextMonth, "yyyy-MM");
    updateMonth(monthKey);
  };

  const handleToday = () => {
    const monthKey = format(today, "yyyy-MM");
    updateMonth(monthKey);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>

      <button
        onClick={handleToday}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
          isCurrentMonth
            ? "bg-primary/20 text-primary font-bold"
            : "bg-muted/50 hover:bg-muted text-foreground"
        }`}
      >
        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="font-medium truncate">
          {format(currentDate, "MMM yyyy")}
        </span>
        {isCurrentMonth && (
          <span className="text-[10px] sm:text-xs bg-primary/30 px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">Now</span>
        )}
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
}

