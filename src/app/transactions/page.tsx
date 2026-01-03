import prisma from "@/lib/prisma";
import { formatCurrency, getMonthKey, getMonthDateRange } from "@/lib/utils";
import { format } from "date-fns";
import { Transaction, Category } from "@prisma/client";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { CategoryIcon } from "@/lib/iconMap";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable all caching

type TransactionWithCategory = Transaction & { category: Category | null };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }> | { month?: string };
}) {
  // Handle both Promise (Next.js 15+) and direct searchParams
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const monthKey = params?.month || getMonthKey();
  // Calculate proper date range for the month
  const { startDate, endDate } = getMonthDateRange(monthKey);
  
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch (error) {
    // User not authenticated - middleware should redirect, but handle gracefully
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
        </div>
        <div className="text-center py-20 text-muted-foreground">
          Please sign in to view transactions.
        </div>
      </div>
    );
  }

  const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate, // Use lt (less than) for exclusive end date
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
      include: { category: true }
  });

  // Group by date
  const grouped = transactions.reduce((acc, t) => {
      const dateKey = format(t.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(t);
      return acc;
  }, {} as Record<string, TransactionWithCategory[]>);

  return (
      <div key={`transactions-${monthKey}`} className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
          </div>
          
          <MonthSelector />
          
          {Object.keys(grouped).length === 0 && (
             <div className="text-center py-20 text-muted-foreground">
               No transactions for this month.
             </div>
          )}

          {Object.entries(grouped).map(([date, txs]) => (
              <div key={date}>
                  <h3 className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wider">
                      {format(new Date(date), 'EEE, MMM d')}
                  </h3>
                  <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
                      {txs.map((t, i) => (
                          <div key={t.id} className={`flex justify-between items-center p-3 sm:p-4 hover:bg-muted/50 transition-colors ${i !== txs.length -1 ? 'border-b border-border/50' : ''}`}>
                             <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                 <div className="bg-secondary/50 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CategoryIcon iconName={t.category?.icon} className="h-4 w-4 sm:h-5 sm:w-5" />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                     <div className="font-semibold text-xs sm:text-sm truncate">{t.note || t.category?.name || 'Expense'}</div>
                                     <div className="text-xs text-muted-foreground truncate">{t.category?.name}</div>
                                 </div>
                             </div>
                             <div className={`font-mono font-bold text-xs sm:text-sm flex-shrink-0 ml-2 ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                                 {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
                             </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>
  )
}
