"use server";

import prisma from "@/lib/prisma";

const DEFAULT_CATEGORIES: Array<{
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}> = [
  // Expense
  { name: "Rent", icon: "🏠", color: "#ef4444", isDefault: true },
  { name: "Microfinance", icon: "🏦", color: "#f97316", isDefault: true },
  { name: "Taxi/Ride", icon: "🚕", color: "#eab308", isDefault: true },
  { name: "Cafe/Food", icon: "🍔", color: "#22c55e", isDefault: true },
  { name: "Church", icon: "⛪", color: "#06b6d4", isDefault: true },
  { name: "Family Support", icon: "👨‍👩‍👧", color: "#3b82f6", isDefault: true },
  { name: "Internet", icon: "🌐", color: "#8b5cf6", isDefault: true },
  { name: "Other", icon: "📦", color: "#64748b", isDefault: true },

  // Income
  { name: "Salary", icon: "💰", color: "#22c55e", isDefault: true },
  { name: "Business", icon: "💼", color: "#3b82f6", isDefault: true },
  { name: "Freelance", icon: "💻", color: "#a855f7", isDefault: true },
  { name: "Gift", icon: "🎁", color: "#ec4899", isDefault: true },
];

/**
 * Ensures the app has the default categories even if prisma seed wasn't run.
 * Safe to call repeatedly (idempotent).
 */
export async function ensureDefaultCategories() {
  // Only consider the known defaults; don't touch user-created categories.
  const defaultNames = DEFAULT_CATEGORIES.map((c) => c.name);
  const existing = await prisma.category.findMany({
    where: { name: { in: defaultNames } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name));

  const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name));
  if (missing.length === 0) return;

  await prisma.category.createMany({
    data: missing,
    skipDuplicates: true,
  });
}


