import { getAllRecurringRules } from "@/server/actions/recurringRuleActions";
import { getAllCategories } from "@/server/actions/categoryActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Settings, Repeat, Tag } from "lucide-react";
import { RecurringRulesSection } from "@/components/settings/RecurringRulesSection";
import { CategoriesSection } from "@/components/settings/CategoriesSection";
import { getMonthKey } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const monthKey = searchParams.month || getMonthKey();
  const [recurringRules, categories] = await Promise.all([
    getAllRecurringRules(),
    getAllCategories(),
  ]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/?month=${monthKey}`}>
            <Button variant="ghost" size="icon" className="-ml-2 sm:-ml-3 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
            <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Recurring Rules Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              <CardTitle className="text-base sm:text-lg">Recurring Bills</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RecurringRulesSection initialRules={recurringRules} />
        </CardContent>
      </Card>

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <CardTitle className="text-base sm:text-lg">Categories</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CategoriesSection initialCategories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}

