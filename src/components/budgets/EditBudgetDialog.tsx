"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget, suggestBudget } from "@/server/actions/budgetActions";
import { Category } from "@prisma/client";
import { Edit2, Lightbulb } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type BudgetWithSpent = {
  id: string;
  categoryId: string;
  monthKey: string;
  limit: number;
  spent: number;
  percentage: number;
  category: Category | null;
};

export function EditBudgetDialog({
  budget,
  monthKey,
}: {
  budget: BudgetWithSpent;
  monthKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const { addToast } = useToast();
  const [limit, setLimit] = useState(budget.limit.toString());

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const suggested = await suggestBudget(budget.categoryId, monthKey);
      if (suggested !== null) {
        setLimit(suggested.toString());
        addToast("Budget suggestion calculated", "success");
      } else {
        addToast("Not enough data to suggest a budget", "info");
      }
    } catch (e) {
      addToast("Failed to suggest budget", "error");
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit) return;

    setLoading(true);
    try {
      await updateBudget(budget.id, { limit: parseFloat(limit) });
      setOpen(false);
      addToast("Budget updated successfully", "success");
    } catch (e) {
      addToast("Failed to update budget", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        className="flex-1 h-8"
      >
        <Edit2 className="h-3 w-3 mr-1" />
        Edit
      </Button>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl z-[101] animate-in fade-in-0 zoom-in-95 border border-border"
        style={{ backgroundColor: 'hsl(var(--background))', opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Budget</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Category</label>
            </div>
            <div className="w-full h-10 rounded-md border border-input bg-muted/20 px-3 py-2 text-sm flex items-center gap-2">
              <span className="text-lg">{budget.category?.icon}</span>
              <span>{budget.category?.name}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Limit (ETB)</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSuggest}
                disabled={suggesting}
                className="h-7 text-xs gap-1"
              >
                <Lightbulb className="h-3 w-3" />
                {suggesting ? "Calculating..." : "Suggest"}
              </Button>
            </div>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Enter amount"
              required
              min="0"
              step="0.01"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current spending: {Math.round(budget.percentage)}% (
              {budget.spent.toLocaleString()} ETB)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOpen(false);
                setLimit(budget.limit.toString());
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Updating..." : "Update Budget"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

