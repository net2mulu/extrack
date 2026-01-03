import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function getMonthKey(date: Date = new Date()) {
    return date.toISOString().slice(0, 7) // "YYYY-MM"
}

export function getMonthDateRange(monthKey: string) {
    const [year, month] = monthKey.split("-").map(Number);
    // Use local time to match how transactions are created (new Date() creates local time)
    // Start of the month (first day at 00:00:00 local time)
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    // Start of next month (exclusive end date) - this ensures we capture all transactions in the month
    const endDate = new Date(year, month, 1, 0, 0, 0, 0);
    return { startDate, endDate };
}
