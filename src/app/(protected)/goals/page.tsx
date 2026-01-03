import { formatCurrency, getMonthKey } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { deleteGoal, addToGoal, subtractFromGoal, getAllGoals } from "@/server/actions/goalActions";
import { GoalActions } from "@/components/goals/GoalActions";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const monthKey = searchParams.month || getMonthKey();
  const goals = await getAllGoals();

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/?month=${monthKey}`}>
            <Button variant="ghost" size="icon" className="-ml-2 sm:-ml-3 h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Saving Goals</h1>
        </div>
        <AddGoalDialog />
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-muted p-6 rounded-full">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-xl font-bold">No Goals Yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Create your first saving goal to start tracking your progress.
          </p>
          <AddGoalDialog />
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isComplete = goal.currentAmount >= goal.targetAmount;
            return (
              <Card key={goal.id} className="overflow-hidden">
                <div
                  className="h-2 w-full transition-all"
                  style={{
                    backgroundColor: goal.color || "#3b82f6",
                    opacity: isComplete ? 0.6 : 1,
                  }}
                />
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold truncate">{goal.title}</h3>
                        {isComplete && (
                          <span className="text-[10px] sm:text-xs bg-green-500/20 text-green-500 px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                            COMPLETE
                          </span>
                        )}
                      </div>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground uppercase font-bold mt-1">
                          Target: {format(new Date(goal.deadline), "MMM yyyy")}
                        </p>
                      )}
                    </div>
                    <div
                      className="text-xl sm:text-2xl font-bold flex-shrink-0 ml-2"
                      style={{ color: goal.color || "#3b82f6" }}
                    >
                      {Math.round(progress)}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Saved</span>
                      <span className="font-bold">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: goal.color || "#3b82f6",
                        }}
                      />
                    </div>
                    <GoalActions goal={goal} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


