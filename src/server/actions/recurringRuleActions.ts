"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createRecurringRule(data: {
  name: string;
  amount: number;
  dayOfMonth: number;
  categoryId?: string | null;
  active?: boolean;
}) {
  const rule = await prisma.recurringRule.create({
    data: {
      name: data.name,
      amount: data.amount,
      dayOfMonth: data.dayOfMonth,
      categoryId: data.categoryId || null,
      active: data.active !== undefined ? data.active : true,
      interval: "MONTHLY",
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
  const rule = await prisma.recurringRule.update({
    where: { id: ruleId },
    data,
    include: { category: true },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  return rule;
}

export async function deleteRecurringRule(ruleId: string) {
  await prisma.recurringRule.delete({
    where: { id: ruleId },
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function getAllRecurringRules() {
  return await prisma.recurringRule.findMany({
    include: { category: true },
    orderBy: { dayOfMonth: "asc" },
  });
}

