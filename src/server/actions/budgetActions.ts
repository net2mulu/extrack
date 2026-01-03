"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getMonthKey, getMonthDateRange } from "@/lib/utils";

export async function createBudget(data: {
  categoryId: string;
  monthKey: string;
  limit: number;
}) {
  const budget = await prisma.budget.upsert({
    where: {
      categoryId_monthKey: {
        categoryId: data.categoryId,
        monthKey: data.monthKey,
      },
    },
    create: {
      categoryId: data.categoryId,
      monthKey: data.monthKey,
      limit: data.limit,
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
  const updated = await prisma.budget.update({
    where: { id: budgetId },
    data: { limit: data.limit },
  });
  revalidatePath("/budgets");
  revalidatePath("/");
  return updated;
}

export async function deleteBudget(budgetId: string) {
  await prisma.budget.delete({
    where: { id: budgetId },
  });
  revalidatePath("/budgets");
  revalidatePath("/");
}

export async function getBudgetsForMonth(monthKey: string) {
  const budgets = await prisma.budget.findMany({
    where: { monthKey },
    include: { category: true },
  });

  // Calculate proper date range for the month
  const { startDate, endDate } = getMonthDateRange(monthKey);

  // Calculate spent amounts for each category
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
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
  // Get last 3 months of expenses for this category
  const currentDate = new Date(`${monthKey}-01`);
  const threeMonthsAgo = new Date(currentDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await prisma.transaction.findMany({
    where: {
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

