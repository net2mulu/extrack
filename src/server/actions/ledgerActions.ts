"use server";

import prisma from "@/lib/prisma";
import { getMonthKey, getMonthDateRange } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function ensureMonthLedger(monthKey: string) {
    try {
        let userId: string;
        try {
            userId = await getCurrentUserId();
        } catch (error) {
            // User not authenticated, return null gracefully
            return null;
        }
        
        // Check if ledger exists
        let ledger = await prisma.monthLedger.findUnique({
            where: { userId_monthKey: { userId, monthKey } },
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
                    userId,
                },
            });

            // Generate Recurring Instances for this month
            const rules = await prisma.recurringRule.findMany({
                where: { active: true, userId },
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
    } catch (error: any) {
        // If tables don't exist yet (migrations not run), return null gracefully
        if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
            return null;
        }
        throw error;
    }
}

export async function getDashboardData(monthKey: string) {
    try {
        let userId: string;
        try {
            userId = await getCurrentUserId();
        } catch (error: any) {
            // User not authenticated, return empty data
            if (error?.name === "UnauthenticatedError" || error?.message?.includes("not authenticated")) {
                return {
                    ledger: null,
                    instances: [],
                    recentTransactions: [],
                    goals: [],
                    budgets: [],
                    totalExpenses: 0,
                    totalIncome: 0,
                };
            }
            // Re-throw other errors
            throw error;
        }
        
        // Only ensure ledger for current/future months
        await ensureMonthLedger(monthKey);

        // Calculate proper date range for the month
        const { startDate, endDate } = getMonthDateRange(monthKey);

        const [ledger, instancesResult, recentTransactions, goals, budgets] = await Promise.all([
        prisma.monthLedger.findUnique({ where: { userId_monthKey: { userId, monthKey } } }),
        prisma.recurringInstance.findMany({
            where: { 
                monthKey,
                rule: { userId },
            },
            include: { rule: { include: { category: true } } },
            orderBy: [
                { rule: { dayOfMonth: "asc" } }, // Order by day of month
            ],
        }),
        prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lt: endDate, // Use lt (less than) for exclusive end date
                },
            },
            orderBy: { date: "desc" },
            take: 5,
            include: { category: true },
        }),
        prisma.savingGoal.findMany({ where: { userId } }),
        prisma.budget.findMany({
            where: { userId, monthKey },
            include: { category: true },
        }),
    ]);

    // Calculate totals
    const totalExpenses = await prisma.transaction.aggregate({
        where: {
            userId,
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
            userId,
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
                category: budget.category, // Explicitly include category
                spent: spent._sum.amount || 0,
                percentage: budget.limit > 0 ? ((spent._sum.amount || 0) / budget.limit) * 100 : 0,
            };
        })
    );

    // Type assertion for instances - Prisma includes all fields, so we can safely cast
    const instances = instancesResult as any;

    return {
        ledger,
        instances,
        recentTransactions,
        goals,
        budgets: budgetsWithSpent,
        totalExpenses: totalExpenses._sum.amount || 0,
        totalIncome: incomeSum, // Passing actual income sum
    };
    } catch (error: any) {
        // Log the error for debugging
        console.error("Error in getDashboardData:", error);
        console.error("Error details:", {
            message: error?.message,
            code: error?.code,
            name: error?.name,
        });
        
        // If tables don't exist yet (migrations not run), return empty data
        if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
            return {
                ledger: null,
                instances: [] as Array<{
                    id: string;
                    monthKey: string;
                    status: "DUE" | "PAID" | "SKIPPED" | "PARTIAL";
                    amountDue: number;
                    ruleId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    rule: {
                        id: string;
                        name: string;
                        amount: number;
                        dayOfMonth: number;
                        categoryId: string | null;
                        active: boolean;
                        interval: string;
                        createdAt: Date;
                        updatedAt: Date;
                        category: { id: string; name: string; icon: string | null; color: string | null } | null;
                    };
                }>,
                recentTransactions: [],
                goals: [],
                budgets: [],
                totalExpenses: 0,
                totalIncome: 0,
            };
        }
        
        // If it's an authentication error, return empty data
        if (error?.name === "UnauthenticatedError" || error?.message?.includes("not authenticated")) {
            return {
                ledger: null,
                instances: [],
                recentTransactions: [],
                goals: [],
                budgets: [],
                totalExpenses: 0,
                totalIncome: 0,
            };
        }
        
        // Re-throw other errors
        throw error;
    }
}

export async function setMonthlyIncome(monthKey: string, income: number) {
    const userId = await getCurrentUserId();
    
    await prisma.monthLedger.upsert({
        where: { userId_monthKey: { userId, monthKey } },
        create: { monthKey, income, userId },
        update: { income },
    });
    revalidatePath("/");
}
