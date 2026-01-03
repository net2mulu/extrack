"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function createRecurringRule(data: {
  name: string;
  amount: number;
  dayOfMonth: number;
  categoryId?: string | null;
  active?: boolean;
}) {
  const userId = await getCurrentUserId();
  
  const rule = await prisma.recurringRule.create({
    data: {
      name: data.name,
      amount: data.amount,
      dayOfMonth: data.dayOfMonth,
      categoryId: data.categoryId || null,
      active: data.active !== undefined ? data.active : true,
      interval: "MONTHLY",
      userId,
    },
    include: { category: true },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  return rule;
}

export async function updateRecurringRule(
  ruleId: string,
  data: {
    name?: string;
    amount?: number;
    dayOfMonth?: number;
    categoryId?: string | null;
    active?: boolean;
  }
) {
  const userId = await getCurrentUserId();
  
  // Verify rule belongs to user
  const rule = await prisma.recurringRule.findUnique({
    where: { id: ruleId },
  });
  
  if (!rule || rule.userId !== userId) {
    throw new Error("Recurring rule not found");
  }
  
  const updated = await prisma.recurringRule.update({
    where: { id: ruleId },
    data,
    include: { category: true },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  return updated;
}

export async function deleteRecurringRule(ruleId: string) {
  const userId = await getCurrentUserId();
  
  // Verify rule belongs to user
  const rule = await prisma.recurringRule.findUnique({
    where: { id: ruleId },
  });
  
  if (!rule || rule.userId !== userId) {
    throw new Error("Recurring rule not found");
  }
  
  await prisma.recurringRule.delete({
    where: { id: ruleId },
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function getAllRecurringRules() {
  const userId = await getCurrentUserId();
  
  return await prisma.recurringRule.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { dayOfMonth: "asc" },
  });
}

