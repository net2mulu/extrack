"use client";

import { RecurringInstance, RecurringRule, Category } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { payRecurringBill } from "@/server/actions/transactionActions";
import { CategoryIcon } from "@/lib/iconMap";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

type InstanceWithRule = RecurringInstance & {
  rule: RecurringRule & { category: Category | null };
};

export function RecurringBillList({ 
  instances, 
  limit 
}: { 
  instances: InstanceWithRule[];
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);

  if (instances.length === 0) return <div className="text-sm text-muted-foreground">No recurring bills found.</div>;

  // Sort: unpaid bills first, then by day of month
  const sortedInstances = [...instances].sort((a, b) => {
    // DUE bills come first
    if (a.status === "DUE" && b.status !== "DUE") return -1;
    if (a.status !== "DUE" && b.status === "DUE") return 1;
    // Then sort by day of month
    return a.rule.dayOfMonth - b.rule.dayOfMonth;
  });

  // If no limit is provided, show all instances
  const displayInstances = limit ? (showAll ? sortedInstances : sortedInstances.slice(0, limit)) : sortedInstances;
  const hasMore = limit ? sortedInstances.length > limit : false;

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {displayInstances.map(inst => (
          <BillItem key={inst.id} instance={inst} />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
              {showAll ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View More ({sortedInstances.length - (limit || 0)} more)
                </>
              )}
        </Button>
      )}
    </div>
  );
}

function BillItem({ instance }: { instance: InstanceWithRule }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { addToast } = useToast();
  const isPaid = instance.status === "PAID";
  
  const handlePay = async () => {
    if (loading || isPaid) return;
    setShowConfirm(true);
  };

  const confirmPay = async () => {
    setLoading(true);
    try {
      await payRecurringBill(instance.id, instance.amountDue, new Date());
      addToast(`${instance.rule.name} marked as paid`, "success");
    } catch (e) {
      addToast("Failed to pay bill", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className={cn(
        "transition-all duration-300",
        isPaid ? "opacity-50 bg-muted/20 border-l-4 border-l-green-500/50" : "bg-card border-l-4 border-l-primary shadow-md"
      )}>
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <div className="bg-secondary/50 p-2.5 rounded-xl">
              <CategoryIcon iconName={instance.rule.category?.icon} className="h-5 w-5" />
            </div>
            <div>
              <div className={cn("font-bold text-sm", isPaid && "line-through text-muted-foreground")}>{instance.rule.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                {isPaid ? (
                  <span className="text-green-500 font-bold flex items-center gap-1"><Check size={12}/> Paid</span>
                ) : (
                  <span className="text-yellow-500 font-bold flex items-center gap-1"><Clock size={12}/> Due {instance.rule.dayOfMonth}th</span>
                )}
                <span>{formatCurrency(instance.amountDue)}</span>
              </div>
            </div>
          </div>
          {!isPaid && (
            <Button size="sm" variant="secondary" onClick={handlePay} disabled={loading} className="h-8 text-xs">
              {loading ? "..." : "Pay"}
            </Button>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Mark as Paid"
        description={`Mark ${instance.rule.name} (${formatCurrency(instance.amountDue)}) as PAID? This will create a transaction.`}
        confirmText="Mark Paid"
        cancelText="Cancel"
        onConfirm={confirmPay}
      />
    </>
  )
}
