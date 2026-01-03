"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} from "@/server/actions/categoryActions";
import { Category } from "@prisma/client";
import { Plus, Edit2, Trash2, X, Package } from "lucide-react";
import {
  Home,
  Building2,
  Car,
  UtensilsCrossed,
  Church,
  Users,
  Globe,
  DollarSign,
  Briefcase,
  Laptop,
  Gift,
} from "lucide-react";
import { CategoryIcon } from "@/lib/iconMap";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

const ICON_OPTIONS = [
  { name: "Home", icon: Home },
  { name: "Bank", icon: Building2 },
  { name: "Car", icon: Car },
  { name: "Food", icon: UtensilsCrossed },
  { name: "Church", icon: Church },
  { name: "Family", icon: Users },
  { name: "Internet", icon: Globe },
  { name: "Package", icon: Package },
  { name: "Money", icon: DollarSign },
  { name: "Business", icon: Briefcase },
  { name: "Laptop", icon: Laptop },
  { name: "Gift", icon: Gift },
];

const COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#64748b", // Slate
];

export function CategoriesSection({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { addToast } = useToast();

  const handleAdd = async (formData: FormData) => {
    setLoading(true);
    try {
      await createCategory({
        name: formData.get("name") as string,
        icon: formData.get("icon") as string,
        color: formData.get("color") as string,
        isDefault: formData.get("isDefault") === "on",
      });
      const updated = await getAllCategories();
      setCategories(updated);
      setShowAdd(false);
      addToast("Category created successfully", "success");
    } catch (e) {
      addToast("Failed to create category", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (categoryId: string, formData: FormData) => {
    setLoading(true);
    try {
      await updateCategory(categoryId, {
        name: formData.get("name") as string,
        icon: formData.get("icon") as string,
        color: formData.get("color") as string,
        isDefault: formData.get("isDefault") === "on",
      });
      const updated = await getAllCategories();
      setCategories(updated);
      setEditingId(null);
      addToast("Category updated successfully", "success");
    } catch (e) {
      addToast("Failed to update category", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setLoading(true);
    try {
      await deleteCategory(categoryToDelete.id);
      const updated = await getAllCategories();
      setCategories(updated);
      addToast("Category deleted successfully", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to delete category", "error");
    } finally {
      setLoading(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowAdd(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {showAdd && (
        <CategoryForm
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={loading}
        />
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No categories. Add one to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((category) =>
            editingId === category.id ? (
              <CategoryForm
                key={category.id}
                category={category}
                onSubmit={(formData) => handleUpdate(category.id, formData)}
                onCancel={() => setEditingId(null)}
                loading={loading}
              />
            ) : (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color ? `${category.color}20` : undefined }}
                  >
                    {category.icon ? (
                      <CategoryIcon iconName={category.icon} className="h-4 w-4" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.isDefault ? "Default" : "Custom"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(category.id)}
                    disabled={loading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category)}
                    disabled={loading || categoryToDelete?.id === category.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}
      {categoryToDelete && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Category"
          description={`Delete category "${categoryToDelete.name}"? ${categoryToDelete.isDefault ? "This is a default category." : ""} This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onSubmit,
  onCancel,
  loading,
}: {
  category?: Category;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [selectedIcon, setSelectedIcon] = useState(
    category?.icon || ICON_OPTIONS[0].name
  );
  const [selectedColor, setSelectedColor] = useState(
    category?.color || COLORS[0]
  );

  const selectedIconComponent = ICON_OPTIONS.find(
    (opt) => opt.name === selectedIcon
  )?.icon || Package;

  return (
    <form
      action={onSubmit}
      className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border"
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">
          {category ? "Edit Category" : "New Category"}
        </h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block">Name</label>
        <Input
          name="name"
          defaultValue={category?.name}
          placeholder="e.g., Rent"
          required
          className="h-9"
        />
      </div>

      <div>
        <label className="text-xs font-medium mb-2 block">Icon</label>
        <div className="grid grid-cols-6 gap-2">
          {ICON_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => setSelectedIcon(option.name)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedIcon === option.name
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-muted/50"
                }`}
              >
                <IconComponent className="h-5 w-5" />
              </button>
            );
          })}
        </div>
        <input type="hidden" name="icon" value={selectedIcon} />
      </div>

      <div>
        <label className="text-xs font-medium mb-2 block">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? "border-foreground scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input type="hidden" name="color" value={selectedColor} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isDefault"
          id={`isDefault-${category?.id || "new"}`}
          defaultChecked={category?.isDefault}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label
          htmlFor={`isDefault-${category?.id || "new"}`}
          className="text-xs font-medium"
        >
          Default category
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
          {loading ? "Saving..." : category ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

