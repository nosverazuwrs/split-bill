import { Suspense } from "react";
import { calculateSplit } from "@/lib/calc";
import { getSplitBillState } from "@/lib/repository";
import { FeesForm } from "./components/fees-form";
import { ItemForm } from "./components/item-form";
import { ParticipantForm } from "./components/participant-form";
import { SummaryDashboard } from "./components/summary-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Tech for Convenience
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            SplitBill &amp; Ongkir Kalkulator
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Masukkan peserta, item pesanan, dan biaya tambahan. Semua data disimpan
            otomatis di database SQLite lokal.
          </p>
        </header>

        <Suspense fallback={<FormSkeleton />}>
          <SplitBillForms />
        </Suspense>
      </div>
    </main>
  );
}

async function SplitBillForms() {
  const { participants, items, fees } = await getSplitBillState();
  const summary = calculateSplit(participants, items, fees);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ParticipantForm participants={participants} />
          <ItemForm participants={participants} items={items} />
        </div>
        <div className="space-y-6">
          <FeesForm fees={fees} />
        </div>
      </div>

      <div className="mt-6">
        <SummaryDashboard summary={summary} />
      </div>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
        <div className="h-80 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
    </div>
  );
}
