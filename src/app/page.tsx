import { getDashboardData } from "@/server/actions/ledgerActions";
import { getMonthKey, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringBillList } from "@/components/dashboard/RecurringBillList";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { CategoryIcon } from "@/lib/iconMap";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// Force dynamic rendering to ensure data refreshes when month changes
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable all caching

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }> | { month?: string };
}) {
  // Handle both Promise (Next.js 15+) and direct searchParams
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const monthKey = params?.month || getMonthKey();
  
  // Fetch data for this specific month
  const data = await getDashboardData(monthKey);

  // Ensure all values are numbers and default to 0 if undefined/null
  const expenses = Number(data.totalExpenses) || 0;
  const targetIncome = Number(data.ledger?.income) || 0;
  const actualIncome = Number(data.totalIncome) || 0;
  
  // Use target income for balance calculation if set, otherwise use actual income
  const incomeForBalance = targetIncome > 0 ? targetIncome : actualIncome;
  const balance = incomeForBalance - expenses;
  
  // Budget progress is Expenses / Target Income (if set), otherwise use Actual Income as baseline
  const baselineIncome = targetIncome > 0 ? targetIncome : actualIncome;
  const budgetProgress = baselineIncome > 0 ? (expenses / baselineIncome) * 100 : 0;

  const displayDate = new Date(`${monthKey}-01`);

  return (
    <div key={`dashboard-${monthKey}`} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="ExTrack Logo" 
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
          />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
      </div>

      {/* Month Selector */}
      <MonthSelector />

      {/* Summary Cards - Stack on mobile, 3 cols on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/20 via-green-500/10 to-green-500/5 border-green-500/30 shadow-lg shadow-green-500/10">
           <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
           <CardContent className="p-4 sm:p-5 relative">
             <div className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
               {targetIncome > 0 ? "Target Income" : "Income"}
             </div>
             <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
               {formatCurrency(targetIncome > 0 ? targetIncome : actualIncome)}
             </div>
             {targetIncome > 0 && actualIncome > 0 && actualIncome !== targetIncome && (
               <div className="text-xs text-green-400/60 mt-2">
                 Actual: {formatCurrency(actualIncome)}
               </div>
             )}
           </CardContent>
         </Card>
         <Card className="relative overflow-hidden bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 border-red-500/30 shadow-lg shadow-red-500/10">
           <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
           <CardContent className="p-4 sm:p-5 relative">
             <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Spent</div>
             <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">{formatCurrency(expenses)}</div>
             {baselineIncome > 0 && (
               <div className="text-xs text-red-400/60 mt-2">
                 {Math.round((expenses / baselineIncome) * 100)}% of income
               </div>
             )}
           </CardContent>
         </Card>
         <Card className={`relative overflow-hidden border shadow-lg ${
           balance >= 0 
             ? "bg-gradient-to-br from-green-500/20 via-green-500/10 to-green-500/5 border-green-500/30 shadow-green-500/10" 
             : "bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 border-red-500/30 shadow-red-500/10"
         }`}>
           <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 blur-2xl ${
             balance >= 0 ? "bg-green-500/10" : "bg-red-500/10"
           }`}></div>
           <CardContent className="p-4 sm:p-5 relative">
             <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
               balance >= 0 ? "text-green-400" : "text-red-400"
             }`}>Balance</div>
             <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
               balance >= 0 ? "text-green-400" : "text-red-400"
             }`}>
               {formatCurrency(balance)}
             </div>
             {balance < 0 && (
               <div className="text-xs text-red-400/70 mt-2 font-medium">
                 Over budget
               </div>
             )}
             {balance >= 0 && (
               <div className="text-xs text-green-400/60 mt-2">
                 On track
               </div>
             )}
           </CardContent>
         </Card>
      </div>

      {/* Overall Budget Progress */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Monthly Overview</CardTitle>
            <Link href={`/budgets?month=${monthKey}`} className="text-xs text-primary">Manage</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
           <div>
             <div className="flex justify-between text-sm mb-2 font-bold">
               <span>Total Spending</span>
               <span className="text-muted-foreground">{formatCurrency(baselineIncome)} Income</span>
             </div>
             <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${budgetProgress >= 100 ? 'bg-red-500' : budgetProgress >= 80 ? 'bg-yellow-500' : 'bg-primary'}`}
                  style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                />
             </div>
             <div className="text-xs text-muted-foreground mt-1 text-center">
               {Math.round(budgetProgress)}% of income spent
             </div>
           </div>
           {baselineIncome === 0 && (
             <div className="text-xs text-muted-foreground text-center">
               No income set. <Link href="/add" className="underline">Add Income</Link>
             </div>
           )}
        </CardContent>
      </Card>

      {/* Category Budgets */}
      {data.budgets && data.budgets.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold">Category Budgets</h2>
            <Link href={`/budgets?month=${monthKey}`} className="text-primary text-xs sm:text-sm">View All</Link>
          </div>
          <div className="grid gap-3">
            {data.budgets.slice(0, 3).map((budget) => {
              const isOverBudget = budget.percentage >= 100;
              const isWarning = budget.percentage >= 80 && budget.percentage < 100;
              return (
                <Card key={budget.id} className={isOverBudget ? "bg-red-500/10 border-red-500/30" : isWarning ? "bg-yellow-500/10 border-yellow-500/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CategoryIcon iconName={budget.category?.icon} className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm font-bold">{budget.category?.name || "Unknown"}</span>
                      </div>
                      {(isOverBudget || isWarning) && (
                        <span className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-yellow-500'}`}>
                          {isOverBudget ? 'Over' : 'Warning'}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}</span>
                      <span className="font-bold">{Math.round(budget.percentage)}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recurring Bills */}
      {data.instances && data.instances.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold">Recurring Bills</h2>
            <Link href={`/recurring-bills?month=${monthKey}`} className="text-primary text-xs sm:text-sm">View All</Link>
          </div>
          <RecurringBillList instances={data.instances} limit={3} />
        </div>
      )}

       {/* Goals Snippet */}
       <div className="space-y-3">
        <div className="flex justify-between items-center">
           <h2 className="text-base sm:text-lg font-semibold">Goals</h2>
           <Link href="/goals" className="text-primary text-xs sm:text-sm">View All</Link>
        </div>
        <div className="grid gap-3">
          {data.goals.slice(0, 2).map(goal => (
            <Card key={goal.id} className="overflow-hidden">
               <div className="h-1 w-full" style={{ backgroundColor: goal.color || '#333' }} />
               <CardContent className="p-4 flex justify-between items-center">
                 <div>
                   <div className="font-bold">{goal.title}</div>
                   <div className="text-xs text-muted-foreground">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                   </div>
                 </div>
                 <div className="text-sm font-bold text-primary">
                    {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                 </div>
               </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
