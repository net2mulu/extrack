"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCategory(data: {
  name: string;
  icon?: string | null;
  color?: string | null;
  isDefault?: boolean;
}) {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
      isDefault: data.isDefault || false,
    },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/add");
  return category;
}

export async function updateCategory(
  categoryId: string,
  data: {
    name?: string;
    icon?: string | null;
    color?: string | null;
    isDefault?: boolean;
  }
) {
  const category = await prisma.category.update({
    where: { id: categoryId },
    data,
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/add");
  return category;
}

export async function deleteCategory(categoryId: string) {
  // Check if category is used in transactions or budgets
  const [transactions, budgets, recurringRules] = await Promise.all([
    prisma.transaction.count({ where: { categoryId } }),
    prisma.budget.count({ where: { categoryId } }),
    prisma.recurringRule.count({ where: { categoryId } }),
  ]);

  if (transactions > 0 || budgets > 0 || recurringRules > 0) {
    throw new Error(
      "Cannot delete category that is used in transactions, budgets, or recurring rules"
    );
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/add");
}

export async function getAllCategories() {
  return await prisma.category.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

