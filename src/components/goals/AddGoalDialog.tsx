"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGoal } from "@/server/actions/goalActions";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

const COLORS = [
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

export function AddGoalDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    color: COLORS[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetAmount) return;

    setLoading(true);
    try {
      await createGoal({
        title: formData.title,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: formData.currentAmount
          ? parseFloat(formData.currentAmount)
          : 0,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        color: formData.color,
      });
      setFormData({
        title: "",
        targetAmount: "",
        currentAmount: "",
        deadline: "",
        color: COLORS[0],
      });
      setOpen(false);
      addToast("Goal created successfully", "success");
    } catch (e) {
      addToast("Failed to create goal", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        New Goal
      </Button>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[100] flex items-end"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-background w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom z-[101]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">New Saving Goal</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., New Phone"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Target Amount (ETB)
            </label>
            <Input
              type="number"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: e.target.value })
              }
              placeholder="50000"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Current Amount (ETB)
            </label>
            <Input
              type="number"
              value={formData.currentAmount}
              onChange={(e) =>
                setFormData({ ...formData, currentAmount: e.target.value })
              }
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Deadline (Optional)
            </label>
            <Input
              type="month"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              {loading ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

