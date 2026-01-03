"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBudget, suggestBudget } from "@/server/actions/budgetActions";
import { Category } from "@prisma/client";
import { Plus, Lightbulb } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function AddBudgetDialog({
  categories,
  monthKey,
}: {
  categories: Category[];
  monthKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    categoryId: categories[0]?.id || "",
    limit: "",
  });

  const handleSuggest = async () => {
    if (!formData.categoryId) return;
    setSuggesting(true);
    try {
      const suggested = await suggestBudget(formData.categoryId, monthKey);
      if (suggested !== null) {
        setFormData({ ...formData, limit: suggested.toString() });
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
    if (!formData.categoryId || !formData.limit) return;

    setLoading(true);
    try {
      await createBudget({
        categoryId: formData.categoryId,
        monthKey,
        limit: parseFloat(formData.limit),
      });
      setFormData({
        categoryId: categories[0]?.id || "",
        limit: "",
      });
      setOpen(false);
      addToast("Budget created successfully", "success");
    } catch (e) {
      addToast("Failed to create budget", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(
    (c) => c.id === formData.categoryId
  );

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Budget
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
          <h2 className="text-xl font-bold">New Budget</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value, limit: "" })
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Limit (ETB)</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSuggest}
                disabled={suggesting || !formData.categoryId}
                className="h-7 text-xs gap-1"
              >
                <Lightbulb className="h-3 w-3" />
                {suggesting ? "Calculating..." : "Suggest"}
              </Button>
            </div>
            <Input
              type="number"
              value={formData.limit}
              onChange={(e) =>
                setFormData({ ...formData, limit: e.target.value })
              }
              placeholder="Enter amount"
              required
              min="0"
              step="0.01"
            />
            {selectedCategory && formData.limit && (
              <p className="text-xs text-muted-foreground mt-1">
                Based on last 3 months average for {selectedCategory.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create Budget"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

