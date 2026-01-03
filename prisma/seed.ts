import { prisma } from '../src/lib/prisma'
import bcrypt from "bcryptjs"

async function main() {
    console.log('🌱 Starting seed...')

    // 0. Ensure no existing data conflicts if needed, but we'll just upsert categories
    // Actually, let's keep it additive.

    // 1. Create/Update Categories
    // EXPENSE Categories
    const expenseCategories = [
        { name: 'Rent', icon: '🏠', color: '#ef4444' }, // Red
        { name: 'Microfinance', icon: '🏦', color: '#f97316' }, // Orange
        { name: 'Taxi/Ride', icon: '🚕', color: '#eab308' }, // Yellow
        { name: 'Cafe/Food', icon: '🍔', color: '#22c55e' }, // Green
        { name: 'Church', icon: '⛪', color: '#06b6d4' }, // Cyan
        { name: 'Family Support', icon: '👨‍👩‍👧', color: '#3b82f6' }, // Blue
        { name: 'Internet', icon: '🌐', color: '#8b5cf6' }, // Violet
        { name: 'Other', icon: '📦', color: '#64748b' }, // Slate
    ]

    // INCOME Categories
    const incomeCategories = [
        { name: 'Salary', icon: '💰', color: '#22c55e' },
        { name: 'Business', icon: '💼', color: '#3b82f6' },
        { name: 'Freelance', icon: '💻', color: '#a855f7' },
        { name: 'Gift', icon: '🎁', color: '#ec4899' },
    ]

    const categoriesMap = new Map()

    for (const cat of expenseCategories) {
        const created = await prisma.category.upsert({
            where: { name: cat.name },
            update: { icon: cat.icon, color: cat.color },
            create: {
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                isDefault: true,
            }
        })
        categoriesMap.set(cat.name, created.id)
        console.log(`Upserted category: ${cat.name}`)
    }

    for (const cat of incomeCategories) {
        const created = await prisma.category.upsert({
            where: { name: cat.name },
            update: { icon: cat.icon, color: cat.color },
            create: {
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                isDefault: true, // or maybe differentiate? Schema doesn't have 'type' on category yet.
                // We might want to add a type to Category if we want to filter them in UI.
                // For now, we'll just add them to the pool.
            }
        })
        categoriesMap.set(cat.name, created.id)
        console.log(`Upserted category: ${cat.name}`)
    }

    // 1.5 Create/ensure a default demo user for seeding user-owned data
    // This is a green-field app; the demo user makes seeds deterministic.
    const demoEmail = "demo@extrack.local";
    const demoPassword = "demo12345"; // change anytime
    const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });
    const demoUser =
        existingDemo ||
        (await prisma.user.create({
            data: {
                email: demoEmail,
                name: "Demo User",
                password: await bcrypt.hash(demoPassword, 10),
            },
        }));
    console.log(`Using demo user: ${demoUser.email}`);

    // 2. Ensuring Recurring Rules (Idempotent)
    const rentCatId = categoriesMap.get('Rent');
    if (rentCatId) {
        const existingRent = await prisma.recurringRule.findFirst({ where: { name: 'Monthly Rent', userId: demoUser.id } });
        if (!existingRent) {
            await prisma.recurringRule.create({
                data: {
                    name: 'Monthly Rent',
                    amount: 32000,
                    dayOfMonth: 1,
                    categoryId: rentCatId,
                    interval: 'MONTHLY',
                    userId: demoUser.id,
                }
            });
            console.log('Created Rent Rule');
        }
    }

    const microCatId = categoriesMap.get('Microfinance');
    if (microCatId) {
        const existingMicro = await prisma.recurringRule.findFirst({ where: { name: 'Microfinance Repayment', userId: demoUser.id } });
        if (!existingMicro) {
            await prisma.recurringRule.create({
                data: {
                    name: 'Microfinance Repayment',
                    amount: 12000,
                    dayOfMonth: 5,
                    categoryId: microCatId,
                    interval: 'MONTHLY',
                    userId: demoUser.id,
                }
            });
            console.log('Created Microfinance Rule');
        }
    }

    // 3. Saving Goal
    const existingGoal = await prisma.savingGoal.findFirst({ where: { title: 'New Phone', userId: demoUser.id } });
    if (!existingGoal) {
        await prisma.savingGoal.create({
            data: {
                title: 'New Phone',
                targetAmount: 50000,
                currentAmount: 15000,
                color: '#ec4899', // Pink
                userId: demoUser.id,
            }
        })
        console.log('Created Saving Goal');
    }

    console.log('✅ Seed updated successfully')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
