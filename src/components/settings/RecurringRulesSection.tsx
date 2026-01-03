"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  getAllRecurringRules,
} from "@/server/actions/recurringRuleActions";
import { RecurringRule, Category } from "@prisma/client";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAllCategories } from "@/server/actions/categoryActions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type RuleWithCategory = RecurringRule & { category: Category | null };

export function RecurringRulesSection({
  initialRules,
}: {
  initialRules: RuleWithCategory[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadCategories = async () => {
    const cats = await getAllCategories();
    setCategories(cats);
  };

  const handleAdd = async (formData: FormData) => {
    setLoading(true);
    try {
      const newRule = await createRecurringRule({
        name: formData.get("name") as string,
        amount: parseFloat(formData.get("amount") as string),
        dayOfMonth: parseInt(formData.get("dayOfMonth") as string),
        categoryId: (formData.get("categoryId") as string) || null,
        active: formData.get("active") === "on",
      });
      const updated = await getAllRecurringRules();
      setRules(updated);
      setShowAdd(false);
      addToast("Recurring rule created successfully", "success");
    } catch (e) {
      addToast("Failed to create rule", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (ruleId: string, formData: FormData) => {
    setLoading(true);
    try {
      await updateRecurringRule(ruleId, {
        name: formData.get("name") as string,
        amount: parseFloat(formData.get("amount") as string),
        dayOfMonth: parseInt(formData.get("dayOfMonth") as string),
        categoryId: (formData.get("categoryId") as string) || null,
        active: formData.get("active") === "on",
      });
      const updated = await getAllRecurringRules();
      setRules(updated);
      setEditingId(null);
      addToast("Recurring rule updated successfully", "success");
    } catch (e) {
      addToast("Failed to update rule", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    setLoading(true);
    try {
      await deleteRecurringRule(ruleToDelete);
      const updated = await getAllRecurringRules();
      setRules(updated);
      addToast("Recurring rule deleted successfully", "success");
    } catch (e) {
      addToast("Failed to delete rule", "error");
    } finally {
      setLoading(false);
      setRuleToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setShowAdd(true);
            loadCategories();
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {showAdd && (
        <RuleForm
          categories={categories}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={loading}
        />
      )}

      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recurring rules. Add one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) =>
            editingId === rule.id ? (
              <RuleForm
                key={rule.id}
                rule={rule}
                categories={categories}
                onSubmit={(formData) => handleUpdate(rule.id, formData)}
                onCancel={() => {
                  setEditingId(null);
                  loadCategories();
                }}
                loading={loading}
              />
            ) : (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold text-sm">{rule.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(rule.amount)} on day {rule.dayOfMonth} •{" "}
                    {rule.category?.name || "No category"} •{" "}
                    {rule.active ? "Active" : "Inactive"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(rule.id);
                      loadCategories();
                    }}
                    disabled={loading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(rule.id)}
                    disabled={loading || ruleToDelete === rule.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}
      {ruleToDelete && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Recurring Rule"
          description="Delete this recurring rule? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function RuleForm({
  rule,
  categories,
  onSubmit,
  onCancel,
  loading,
}: {
  rule?: RuleWithCategory;
  categories: Category[];
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <form
      action={onSubmit}
      className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border"
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">
          {rule ? "Edit Rule" : "New Rule"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block">Name</label>
        <Input
          name="name"
          defaultValue={rule?.name}
          placeholder="e.g., Monthly Rent"
          required
          className="h-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium mb-1 block">Amount (ETB)</label>
          <Input
            name="amount"
            type="number"
            defaultValue={rule?.amount}
            placeholder="32000"
            required
            min="0"
            step="0.01"
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Day of Month</label>
          <Input
            name="dayOfMonth"
            type="number"
            defaultValue={rule?.dayOfMonth}
            placeholder="1"
            required
            min="1"
            max="31"
            className="h-9"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block">Category</label>
        <select
          name="categoryId"
          defaultValue={rule?.categoryId || ""}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          id={`active-${rule?.id || "new"}`}
          defaultChecked={rule?.active !== false}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label
          htmlFor={`active-${rule?.id || "new"}`}
          className="text-xs font-medium"
        >
          Active
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" className="flex-1" disabled={loading}>
          {loading ? "Saving..." : rule ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

