-- AlterTable: Add userId columns as nullable first
ALTER TABLE "Transaction" ADD COLUMN "userId" TEXT;
ALTER TABLE "Budget" ADD COLUMN "userId" TEXT;
ALTER TABLE "SavingGoal" ADD COLUMN "userId" TEXT;
ALTER TABLE "MonthLedger" ADD COLUMN "userId" TEXT;
ALTER TABLE "RecurringRule" ADD COLUMN "userId" TEXT;

-- For existing data: Delete rows that don't have a user (or assign to first user if needed)
-- Since we're adding multi-user support, we'll delete orphaned data
-- If you need to keep existing data, uncomment the following and set a specific userId:
-- UPDATE "Transaction" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;
-- UPDATE "Budget" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;
-- UPDATE "SavingGoal" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;
-- UPDATE "MonthLedger" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;
-- UPDATE "RecurringRule" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;

-- Delete orphaned data (data without userId)
DELETE FROM "Transaction" WHERE "userId" IS NULL;
DELETE FROM "Budget" WHERE "userId" IS NULL;
DELETE FROM "SavingGoal" WHERE "userId" IS NULL;
DELETE FROM "MonthLedger" WHERE "userId" IS NULL;
DELETE FROM "RecurringRule" WHERE "userId" IS NULL;
DELETE FROM "RecurringInstance" WHERE "ruleId" IN (SELECT id FROM "RecurringRule" WHERE "userId" IS NULL);

-- Now make userId required
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Budget" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SavingGoal" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "MonthLedger" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "RecurringRule" ALTER COLUMN "userId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavingGoal" ADD CONSTRAINT "SavingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MonthLedger" ADD CONSTRAINT "MonthLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Budget_userId_idx" ON "Budget"("userId");
CREATE INDEX IF NOT EXISTS "SavingGoal_userId_idx" ON "SavingGoal"("userId");
CREATE INDEX IF NOT EXISTS "MonthLedger_userId_idx" ON "MonthLedger"("userId");
CREATE INDEX IF NOT EXISTS "RecurringRule_userId_idx" ON "RecurringRule"("userId");

-- Drop old unique constraints and add new ones with userId
ALTER TABLE "MonthLedger" DROP CONSTRAINT IF EXISTS "MonthLedger_monthKey_key";
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "Budget_categoryId_monthKey_key";

-- Add new unique constraints with userId
ALTER TABLE "MonthLedger" ADD CONSTRAINT "MonthLedger_userId_monthKey_key" UNIQUE ("userId", "monthKey");
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_categoryId_monthKey_key" UNIQUE ("userId", "categoryId", "monthKey");

