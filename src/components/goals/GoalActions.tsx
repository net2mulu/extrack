"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToGoal, subtractFromGoal, deleteGoal } from "@/server/actions/goalActions";
import { SavingGoal } from "@prisma/client";
import { Trash2, Plus, Minus } from "lucide-react";
import { EditGoalDialog } from "./EditGoalDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function GoalActions({ goal }: { goal: SavingGoal }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { addToast } = useToast();

  const handleAdd = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setLoading(true);
    try {
      await addToGoal(goal.id, value);
      setAmount("");
      addToast("Amount added to goal", "success");
    } catch (e) {
      addToast("Failed to add amount", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubtract = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setLoading(true);
    try {
      await subtractFromGoal(goal.id, value);
      setAmount("");
      addToast("Amount subtracted from goal", "success");
    } catch (e) {
      addToast("Failed to subtract amount", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteGoal(goal.id);
      addToast("Goal deleted successfully", "success");
    } catch (e) {
      addToast("Failed to delete goal", "error");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 h-9"
            disabled={loading}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            disabled={loading || !amount}
            className="h-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSubtract}
            disabled={loading || !amount}
            className="h-9"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <EditGoalDialog goal={goal} />
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-9"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Goal"
        description={`Delete goal "${goal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  );
}

