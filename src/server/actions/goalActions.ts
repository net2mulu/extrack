"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addTransaction } from "./transactionActions";

export async function createGoal(data: {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: Date | null;
  color?: string;
}) {
  const goal = await prisma.savingGoal.create({
    data: {
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      deadline: data.deadline || null,
      color: data.color || "#3b82f6",
    },
  });
  revalidatePath("/goals");
  revalidatePath("/");
  return goal;
}

export async function updateGoal(
  goalId: string,
  data: {
    title?: string;
    targetAmount?: number;
    deadline?: Date | null;
    color?: string;
  }
) {
  const goal = await prisma.savingGoal.update({
    where: { id: goalId },
    data,
  });
  revalidatePath("/goals");
  revalidatePath("/");
  return goal;
}

export async function deleteGoal(goalId: string) {
  await prisma.savingGoal.delete({
    where: { id: goalId },
  });
  revalidatePath("/goals");
  revalidatePath("/");
}

async function getOrCreateSavingsCategory() {
  // Try to find existing "Savings" category
  let savingsCategory = await prisma.category.findUnique({
    where: { name: "Savings" },
  });

  // If not found, create it
  if (!savingsCategory) {
    savingsCategory = await prisma.category.create({
      data: {
        name: "Savings",
        icon: "PiggyBank", // Lucide React icon name
        color: "#10b981", // Green
        isDefault: false,
      },
    });
  }

  return savingsCategory.id;
}

export async function addToGoal(goalId: string, amount: number) {
  // Get goal details for transaction note
  const goal = await prisma.savingGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  // Create EXPENSE transaction (money going out to savings)
  const savingsCategoryId = await getOrCreateSavingsCategory();
  await addTransaction({
    amount,
    type: "EXPENSE",
    categoryId: savingsCategoryId,
    note: `Savings: ${goal.title}`,
    date: new Date(),
  });

  // Update goal
  const updatedGoal = await prisma.savingGoal.update({
    where: { id: goalId },
    data: {
      currentAmount: { increment: amount },
    },
  });

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/transactions");
  return updatedGoal;
}

export async function subtractFromGoal(goalId: string, amount: number) {
  // Get goal details for transaction note
  const goal = await prisma.savingGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  // Ensure we don't subtract more than available
  if (goal.currentAmount < amount) {
    throw new Error("Insufficient amount in goal");
  }

  // Create INCOME transaction (money coming back from savings)
  const savingsCategoryId = await getOrCreateSavingsCategory();
  await addTransaction({
    amount,
    type: "INCOME",
    categoryId: savingsCategoryId,
    note: `Withdrawal from savings: ${goal.title}`,
    date: new Date(),
  });

  // Update goal
  const updatedGoal = await prisma.savingGoal.update({
    where: { id: goalId },
    data: {
      currentAmount: { decrement: amount },
    },
  });

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/transactions");
  return updatedGoal;
}

export async function getAllGoals() {
  return await prisma.savingGoal.findMany({
    orderBy: { createdAt: "desc" },
  });
}

