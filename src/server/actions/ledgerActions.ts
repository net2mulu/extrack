"use server";

import prisma from "@/lib/prisma";
import { getMonthKey, getMonthDateRange } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function ensureMonthLedger(monthKey: string) {
    // Check if ledger exists
    let ledger = await prisma.monthLedger.findUnique({
        where: { monthKey },
    });

    if (!ledger) {
        // Only create ledger if month is current or future
        // Don't auto-create for past months with no data
        const [year, month] = monthKey.split("-").map(Number);
        const monthDate = new Date(year, month - 1, 1);
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Only auto-create for current month or future months
        if (monthDate >= currentMonthStart) {
            // Create ledger
            ledger = await prisma.monthLedger.create({
                data: {
                    monthKey,
                    income: 0,
                },
            });

            // Generate Recurring Instances for this month
            const rules = await prisma.recurringRule.findMany({
                where: { active: true },
            });

            for (const rule of rules) {
                // Check if instance already exists (idempotency)
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
        } else {
            // For past months, return null (no ledger exists)
            return null;
        }
    }

    return ledger;
}

export async function getDashboardData(monthKey: string) {
    // Only ensure ledger for current/future months
    await ensureMonthLedger(monthKey);

    // Calculate proper date range for the month
    const { startDate, endDate } = getMonthDateRange(monthKey);

    const [ledger, instances, recentTransactions, goals, budgets] = await Promise.all([
        prisma.monthLedger.findUnique({ where: { monthKey } }),
        prisma.recurringInstance.findMany({
            where: { monthKey },
            include: { rule: { include: { category: true } } },
            orderBy: [
                { rule: { dayOfMonth: "asc" } }, // Order by day of month
            ],
        }),
        prisma.transaction.findMany({
            where: {
                date: {
                    gte: startDate,
                    lt: endDate, // Use lt (less than) for exclusive end date
                },
            },
            orderBy: { date: "desc" },
            take: 5,
            include: { category: true },
        }),
        prisma.savingGoal.findMany(),
        prisma.budget.findMany({
            where: { monthKey },
            include: { category: true },
        }),
    ]);

    // Calculate totals
    const totalExpenses = await prisma.transaction.aggregate({
        where: {
            type: "EXPENSE",
            date: {
                gte: startDate,
                lt: endDate, // Use lt (less than) for exclusive end date
            },
        },
        _sum: { amount: true },
    });

    // Calculate total income (Actual)
    const totalActualIncome = await prisma.transaction.aggregate({
        where: {
            type: "INCOME",
            date: {
                gte: startDate,
                lt: endDate, // Use lt (less than) for exclusive end date
            },
        },
        _sum: { amount: true },
    });

    // Use manual ledger income OR actual transaction income, whichever is higher (or logic preference)
    // Let's assume Actual Income is the realized amount, but Ledger Income might be "Target".
    // For "Net Balance", we definitely want Actual Income - Actual Expenses.

    const incomeSum = totalActualIncome._sum.amount || 0;

    // Calculate budget progress
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

    return {
        ledger,
        instances,
        recentTransactions,
        goals,
        budgets: budgetsWithSpent,
        totalExpenses: totalExpenses._sum.amount || 0,
        totalIncome: incomeSum, // Passing actual income sum
    };
}

export async function setMonthlyIncome(monthKey: string, income: number) {
    await prisma.monthLedger.upsert({
        where: { monthKey },
        create: { monthKey, income },
        update: { income },
    });
    revalidatePath("/");
}
