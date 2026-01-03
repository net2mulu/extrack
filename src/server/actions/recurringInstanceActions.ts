"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function ensureRecurringInstancesForMonth(monthKey: string) {
  const userId = await getCurrentUserId();
  
  // Check if this is a current or future month
  const [year, month] = monthKey.split("-").map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Only create instances for current or future months
  // Don't create instances for past months
  if (monthDate < currentMonthStart) {
    return; // Don't create instances for past months
  }

  // Get all active recurring rules for this user
  const activeRules = await prisma.recurringRule.findMany({
    where: { active: true, userId },
  });

  // Ensure each active rule has an instance for this month
  for (const rule of activeRules) {
    const existing = await prisma.recurringInstance.findUnique({
      where: {
        ruleId_monthKey: {
          ruleId: rule.id,
          monthKey,
        },
      },
    });

    if (!existing) {
      await prisma.recurringInstance.create({
        data: {
          ruleId: rule.id,
          monthKey,
          amountDue: rule.amount,
          status: "DUE",
        },
      });
    }
  }
}

export async function getRecurringInstancesForMonth(monthKey: string) {
  const userId = await getCurrentUserId();
  
  // First ensure all active rules have instances (only for current/future months)
  await ensureRecurringInstancesForMonth(monthKey);

  // Then fetch all instances (including past months) for this user
  const instances = await prisma.recurringInstance.findMany({
    where: { 
      monthKey,
      rule: { userId },
    },
    include: { 
      rule: { 
        include: { category: true } 
      } 
    },
    orderBy: [
      { status: "asc" }, // Order by status (DUE, PARTIAL, SKIPPED, PAID)
      { rule: { dayOfMonth: "asc" } }, // Then by day of month
    ],
  });

  return instances;
}

