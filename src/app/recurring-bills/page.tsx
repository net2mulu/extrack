import { getRecurringInstancesForMonth } from "@/server/actions/recurringInstanceActions";
import { ensureMonthLedger } from "@/server/actions/ledgerActions";
import { getMonthKey } from "@/lib/utils";
import { RecurringBillList } from "@/components/dashboard/RecurringBillList";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { RecurringInstance, RecurringRule, Category } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable all caching

export default async function RecurringBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }> | { month?: string };
}) {
  // Handle both Promise (Next.js 15+) and direct searchParams
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const monthKey = params?.month || getMonthKey();
  
  type InstanceWithRule = RecurringInstance & { rule: RecurringRule & { category: Category | null } };
  let instances: InstanceWithRule[] = [];
  try {
    // Ensure ledger exists (this also creates recurring instances if needed)
    await ensureMonthLedger(monthKey);
    // Fetch all recurring instances for this month
    instances = await getRecurringInstancesForMonth(monthKey);
  } catch (error) {
    // User not authenticated - middleware should redirect, but handle gracefully
    instances = [];
  }

  return (
    <div key={`recurring-bills-${monthKey}`} className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/?month=${monthKey}`}>
            <Button variant="ghost" size="icon" className="-ml-2 sm:-ml-3 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Recurring Bills</h1>
        </div>
      </div>

      {/* Month Selector */}
      <MonthSelector />

      {/* Recurring Bills List */}
      {instances && instances.length > 0 ? (
        <RecurringBillList instances={instances} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-muted p-6 rounded-full">
            <span className="text-4xl">📋</span>
          </div>
          <h2 className="text-xl font-bold">No Recurring Bills</h2>
          <p className="text-muted-foreground max-w-sm">
            No recurring bills found for this month. They will appear here once created.
          </p>
          <Link href="/settings">
            <Button size="sm" variant="outline">
              Manage Rules
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

