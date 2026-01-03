"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";

export async function addTransaction(data: {
    amount: number;
    type: TransactionType;
    categoryId?: string;
    note?: string;
    date: Date;
}) {
    await prisma.transaction.create({
        data: {
            amount: data.amount,
            type: data.type,
            categoryId: data.categoryId,
            note: data.note,
            date: data.date,
        },
    });
    revalidatePath("/");
    revalidatePath("/transactions");
}

export async function payRecurringBill(instanceId: string, amount: number, date: Date) {
    // 1. Get instance to find category
    const instance = await prisma.recurringInstance.findUnique({
        where: { id: instanceId },
        include: { rule: true },
    });

    if (!instance) throw new Error("Bill not found");

    // 2. Create transaction
    await prisma.transaction.create({
        data: {
            amount,
            type: "EXPENSE",
            categoryId: instance.rule.categoryId,
            note: `Payment for ${instance.rule.name}`,
            date,
            recurringInstanceId: instanceId,
        },
    });

    // 3. Update status
    // If amount >= amountDue, mark PAID. Else PARTIAL.
    // We need to sum all payments for this instance to be sure.
    // Ideally we do this in a transaction.

    // Checking total paid so far
    const allPayments = await prisma.transaction.findMany({
        where: { recurringInstanceId: instanceId },
    });
    const totalPaid = allPayments.reduce((sum, t) => sum + t.amount, 0) + amount; // + current one? No wait, create() is separate.

    // Actually I just created the transaction. So include it ?
    // My logic above created it. So findMany includes it.
    // Wait, Prisma write might not be immediate for read in same context? No, it's awaited.

    // Re-fetch to be safe
    const freshPayments = await prisma.transaction.findMany({
        where: { recurringInstanceId: instanceId },
    });
    const totalPaidFresh = freshPayments.reduce((sum, t) => sum + t.amount, 0);

    let status: "PAID" | "PARTIAL" = "PARTIAL";
    if (totalPaidFresh >= instance.amountDue * 0.99) { // tolerance
        status = "PAID";
    }

    await prisma.recurringInstance.update({
        where: { id: instanceId },
        data: { status },
    });

    revalidatePath("/");
}

export async function getCategories() {
    return await prisma.category.findMany({
        orderBy: { isDefault: 'desc' }, // default first
    });
}
