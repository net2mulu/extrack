"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getMonthKey, getMonthDateRange } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function createBudget(data: {
  categoryId: string;
  monthKey: string;
  limit: number;
}) {
  const userId = await getCurrentUserId();
  
  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_monthKey: {
        userId,
        categoryId: data.categoryId,
        monthKey: data.monthKey,
      },
    },
    create: {
      categoryId: data.categoryId,
      monthKey: data.monthKey,
      limit: data.limit,
      userId,
    },
    update: {
      limit: data.limit,
    },
  });
  revalidatePath("/budgets");
  revalidatePath("/");
  return budget;
}

export async function updateBudget(
  budgetId: string,
  data: { limit: number }
) {
  const userId = await getCurrentUserId();
  
  // Verify budget belongs to user
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
  });
  
  if (!budget || budget.userId !== userId) {
    throw new Error("Budget not found");
  }
  
  const updated = await prisma.budget.update({
    where: { id: budgetId },
    data: { limit: data.limit },
  });
  revalidatePath("/budgets");
  revalidatePath("/");
  return updated;
}

export async function deleteBudget(budgetId: string) {
  const userId = await getCurrentUserId();
  
  // Verify budget belongs to user
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
  });
  
  if (!budget || budget.userId !== userId) {
    throw new Error("Budget not found");
  }
  
  await prisma.budget.delete({
    where: { id: budgetId },
  });
  revalidatePath("/budgets");
  revalidatePath("/");
}

export async function getBudgetsForMonth(monthKey: string) {
  const userId = await getCurrentUserId();
  
  const budgets = await prisma.budget.findMany({
    where: { userId, monthKey },
    include: { category: true },
  });

  // Calculate proper date range for the month
  const { startDate, endDate } = getMonthDateRange(monthKey);

  // Calculate spent amounts for each category
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: {
            gte: startDate,
            lt: endDate, // Use lt (less than) for exclusive end date
          },
        },
        _sum: { amount: true },
      });

      return {
        ...budget,
        spent: spent._sum.amount || 0,
        percentage: budget.limit > 0 ? ((spent._sum.amount || 0) / budget.limit) * 100 : 0,
      };
    })
  );

  return budgetsWithSpent;
}

export async function suggestBudget(categoryId: string, monthKey: string) {
  const userId = await getCurrentUserId();
  
  // Get last 3 months of expenses for this category
  const currentDate = new Date(`${monthKey}-01`);
  const threeMonthsAgo = new Date(currentDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: {
        gte: threeMonthsAgo,
        lt: currentDate,
      },
    },
    select: { amount: true, date: true },
  });

  if (expenses.length === 0) return null;

  // Group by month and calculate average
  const monthlyTotals: Record<string, number> = {};
  expenses.forEach((expense) => {
    const monthKey = expense.date.toISOString().slice(0, 7);
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
  });

  const totals = Object.values(monthlyTotals);
  const average = totals.reduce((sum, val) => sum + val, 0) / totals.length;

  return Math.round(average);
}

export async function getAllCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

