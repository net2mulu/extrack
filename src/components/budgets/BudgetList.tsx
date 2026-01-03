"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/lib/iconMap";
import { EditBudgetDialog } from "./EditBudgetDialog";
import { deleteBudget } from "@/server/actions/budgetActions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Category } from "@prisma/client";

type BudgetWithSpent = {
  id: string;
  categoryId: string;
  monthKey: string;
  limit: number;
  spent: number;
  percentage: number;
  category: Category | null;
};

export function BudgetList({
  budgets,
  monthKey,
}: {
  budgets: BudgetWithSpent[];
  monthKey: string;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetWithSpent | null>(null);
  const { addToast } = useToast();

  const handleDelete = (budget: BudgetWithSpent) => {
    setBudgetToDelete(budget);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    setDeletingId(budgetToDelete.id);
    try {
      await deleteBudget(budgetToDelete.id);
      addToast("Budget deleted successfully", "success");
    } catch (e) {
      addToast("Failed to delete budget", "error");
      setDeletingId(null);
    } finally {
      setBudgetToDelete(null);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        {budgets.map((budget) => {
        const isOverBudget = budget.percentage >= 100;
        const isWarning = budget.percentage >= 80 && budget.percentage < 100;
        const remaining = budget.limit - budget.spent;

        return (
          <Card
            key={budget.id}
            className={`transition-all ${
              isOverBudget
                ? "bg-red-500/10 border-red-500/30"
                : isWarning
                ? "bg-yellow-500/10 border-yellow-500/30"
                : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/50 p-2 rounded-xl">
                    <CategoryIcon iconName={budget.category?.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {budget.category?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </div>
                  </div>
                </div>
                {isOverBudget && (
                  <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                    <AlertTriangle className="h-3 w-3" />
                    Over
                  </div>
                )}
                {isWarning && !isOverBudget && (
                  <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                    <AlertTriangle className="h-3 w-3" />
                    Warning
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {Math.round(budget.percentage)}% used
                  </span>
                  <span
                    className={`font-bold ${
                      remaining >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {remaining >= 0
                      ? `${formatCurrency(remaining)} left`
                      : `${formatCurrency(Math.abs(remaining))} over`}
                  </span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isOverBudget
                        ? "bg-red-500"
                        : isWarning
                        ? "bg-yellow-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <EditBudgetDialog budget={budget} monthKey={monthKey} />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(budget)}
                    disabled={deletingId === budget.id}
                    className="flex-1 h-8"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
      {budgetToDelete && (
        <ConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Delete Budget"
          description={`Delete budget for ${budgetToDelete.category?.name || "this category"}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

