"use client";

import { useState, useEffect } from "react";
import { getCategories, addTransaction } from "@/server/actions/transactionActions";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/lib/iconMap";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AddTransactionPage() {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const handleSubmit = async () => {
    if (!amount || !selectedCat) return;
    setLoading(true);
    try {
      const transactionDate = new Date();
      await addTransaction({
        amount: parseFloat(amount),
        type: type,
        categoryId: selectedCat,
        note,
        date: transactionDate,
      });
      addToast(`${type === "INCOME" ? "Income" : "Expense"} added successfully`, "success");
      router.back();
    } catch (e) {
      addToast("Failed to save transaction", "error");
      setLoading(false);
    }
  };

  const incomeCatNames = ["Salary", "Business", "Freelance", "Gift"];
  const filteredCategories = categories.filter((c) =>
    type === "INCOME" ? incomeCatNames.includes(c.name) : !incomeCatNames.includes(c.name)
  );

  return (
    <div className="flex flex-col h-full min-h-[80vh] animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-background z-10 py-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2 sm:-ml-3 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base sm:text-lg font-bold ml-2">Add Transaction</h1>
        </div>
      </div>

      {/* Type Toggle */}
      <div className="flex p-1 bg-muted/50 rounded-2xl mb-4 sm:mb-6">
        <button
          onClick={() => setType("EXPENSE")}
          className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            type === "EXPENSE"
              ? "bg-red-500/20 shadow-sm text-red-500 border border-red-500/30"
              : "text-muted-foreground"
          }`}
        >
          Expense
        </button>
        <button
          onClick={() => setType("INCOME")}
          className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            type === "INCOME"
              ? "bg-green-500/20 shadow-sm text-green-500 border border-green-500/30"
              : "text-muted-foreground"
          }`}
        >
          Income
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6 sm:gap-8">
        <div>
          <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Amount</label>
          <div className="relative mt-2">
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 text-lg sm:text-2xl font-bold mr-2 ${
                type === "INCOME" ? "text-green-500" : "text-red-500"
              }`}
            >
              ETB
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-transparent text-3xl sm:text-5xl font-bold pl-12 sm:pl-14 outline-none placeholder:text-muted-foreground/20 ${
                type === "INCOME" ? "text-green-500" : "text-red-500"
              }`}
              placeholder="0"
              autoFocus
              pattern="[0-9]*"
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-bold uppercase mb-2 sm:mb-3 block tracking-wider">
            Category
          </label>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all aspect-square justify-center ${
                  selectedCat === cat.id
                    ? (type === "INCOME"
                        ? "bg-green-600 text-white shadow-green-500/20"
                        : "bg-red-600 text-white shadow-red-500/20") + " scale-105 shadow-xl ring-2 ring-offset-2 ring-offset-background"
                    : "bg-muted/40 hover:bg-muted"
                }`}
                style={selectedCat === cat.id ? ({ "--tw-ring-color": type === "INCOME" ? "#16a34a" : "#dc2626" } as any) : {}}
              >
                <CategoryIcon iconName={cat.icon} className={`${selectedCat === cat.id ? "text-white" : ""} h-5 w-5 sm:h-6 sm:w-6`} />
                <span className="text-[9px] sm:text-[10px] font-bold truncate w-full text-center leading-tight">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-bold uppercase mb-2 block tracking-wider">Note</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Description (Optional)"
            className="h-12 sm:h-14 bg-muted/20 border-transparent focus:bg-muted/40 text-base sm:text-lg rounded-xl sm:rounded-2xl"
          />
        </div>
      </div>

      <div className="mt-6 sm:mt-8 pb-4 sticky bottom-4">
        <Button
          size="lg"
          className={`w-full text-base sm:text-lg h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg ${
            type === "INCOME"
              ? "bg-green-600 hover:bg-green-700 shadow-green-500/20"
              : "bg-red-600 hover:bg-red-700 shadow-red-500/20"
          }`}
          onClick={handleSubmit}
          disabled={!amount || !selectedCat || loading}
        >
          {loading ? "Saving..." : `Save ${type === "INCOME" ? "Income" : "Expense"}`}
        </Button>
      </div>
    </div>
  );
}


