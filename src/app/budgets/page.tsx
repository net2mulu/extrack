import { getBudgetsForMonth, getAllCategories, suggestBudget } from "@/server/actions/budgetActions";
import { getMonthKey, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Plus, Lightbulb } from "lucide-react";
import { BudgetList } from "@/components/budgets/BudgetList";
import { AddBudgetDialog } from "@/components/budgets/AddBudgetDialog";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable all caching

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }> | { month?: string };
}) {
  // Handle both Promise (Next.js 15+) and direct searchParams
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const monthKey = params?.month || getMonthKey();
  const budgets = await getBudgetsForMonth(monthKey);
  const categories = await getAllCategories();

  // Get expense categories (exclude income categories)
  const incomeCatNames = ["Salary", "Business", "Freelance", "Gift"];
  const expenseCategories = categories.filter(
    (cat) => !incomeCatNames.includes(cat.name)
  );

  // Get categories that don't have budgets yet
  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgetedCategories = expenseCategories.filter(
    (cat) => !budgetedCategoryIds.has(cat.id)
  );

  const displayDate = new Date(`${monthKey}-01`);

  return (
    <div key={`budgets-${monthKey}`} className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/?month=${monthKey}`}>
            <Button variant="ghost" size="icon" className="-ml-2 sm:-ml-3 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Budgets</h1>
        </div>
        <AddBudgetDialog
          categories={unbudgetedCategories}
          monthKey={monthKey}
        />
      </div>

      <MonthSelector />

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-muted p-6 rounded-full">
            <span className="text-4xl">📊</span>
          </div>
          <h2 className="text-xl font-bold">No Budgets Set</h2>
          <p className="text-muted-foreground max-w-sm">
            Create budgets for your expense categories to track spending.
          </p>
          <AddBudgetDialog
            categories={expenseCategories}
            monthKey={monthKey}
          />
        </div>
      ) : (
        <>
          <BudgetList budgets={budgets} monthKey={monthKey} />
          {unbudgetedCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add More Budgets</CardTitle>
              </CardHeader>
              <CardContent>
                <AddBudgetDialog
                  categories={unbudgetedCategories}
                  monthKey={monthKey}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
