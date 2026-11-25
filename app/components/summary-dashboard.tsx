"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";
import type { BillSummary } from "@/lib/types";
import { buttonClass, Card } from "./form-ui";

function negativeRupiah(value: number): string {
  return value > 0 ? `-${formatRupiah(value)}` : formatRupiah(0);
}

function buildSummaryText(summary: BillSummary): string {
  const lines = [
    "SplitBill & Ongkir Kalkulator",
    "==============================",
    `Subtotal pesanan : ${formatRupiah(summary.totalSubtotal)}`,
    `Diskon           : ${negativeRupiah(summary.discountAmount)}`,
    `Ongkir           : ${formatRupiah(summary.totalShipping)}`,
    `Pajak            : ${formatRupiah(summary.totalTax)}`,
    `Grand total      : ${formatRupiah(summary.grandTotal)}`,
    "",
    "Rincian per orang:",
    ...summary.participants.map(
      (bill) =>
        `- ${bill.name}: ${formatRupiah(bill.total)} (subtotal ${formatRupiah(
          bill.subtotal,
        )}, diskon ${negativeRupiah(bill.discount)}, pajak ${formatRupiah(
          bill.tax,
        )}, ongkir ${formatRupiah(bill.shipping)})`,
    ),
  ];

  if (summary.unassignedItemIds.length > 0) {
    lines.push(
      "",
      `Catatan: ${summary.unassignedItemIds.length} item belum memiliki peserta pembagi.`,
    );
  }

  return lines.join("\n");
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  const succeeded = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!succeeded) throw new Error("Copy command failed");
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

export function SummaryDashboard({ summary }: { summary: BillSummary }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    try {
      await copyToClipboard(buildSummaryText(summary));
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <Card
      step="04"
      title="Rincian tagihan"
      description="Total akhir tiap peserta setelah diskon, pajak, dan ongkir."
    >
      {summary.participants.length === 0 ? (
        <div className="space-y-2">
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Belum ada peserta untuk dihitung. Tambahkan peserta dan item terlebih
            dahulu; biaya tambahan baru bisa dibagi setelah peserta tersedia.
          </p>
          {summary.unassignedItemIds.length > 0 ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              {summary.unassignedItemIds.length} item belum bisa dihitung karena tidak
              ada peserta pembagi.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-emerald-600 px-4 py-4 text-white shadow-sm dark:bg-emerald-500">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-50">
              Grand total
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {formatRupiah(summary.grandTotal)}
            </p>
            <p className="mt-1 text-xs text-emerald-50">
              {summary.participants.length} peserta
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Subtotal" value={formatRupiah(summary.totalSubtotal)} />
            <Stat label="Diskon" value={negativeRupiah(summary.discountAmount)} />
            <Stat label="Ongkir" value={formatRupiah(summary.totalShipping)} />
            <Stat label="Pajak" value={formatRupiah(summary.totalTax)} />
          </div>

          {summary.unassignedItemIds.length > 0 ? (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              {summary.unassignedItemIds.length} item belum memiliki peserta pembagi,
              sehingga tidak masuk ke total. Buka Edit pada item terkait untuk memilih
              peserta.
            </p>
          ) : null}

          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {summary.participants.map((bill) => (
              <li key={bill.participantId} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {bill.name}
                  </p>
                  <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {formatRupiah(bill.total)}
                  </p>
                </div>

                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">Subtotal</dt>
                    <dd className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                      {formatRupiah(bill.subtotal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">Diskon</dt>
                    <dd className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                      {negativeRupiah(bill.discount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">Pajak</dt>
                    <dd className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                      {formatRupiah(bill.tax)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">Ongkir</dt>
                    <dd className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                      {formatRupiah(bill.shipping)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleCopy} className={buttonClass}>
              {copied ? "Tersalin!" : "Copy Ringkasan"}
            </button>
            <span
              aria-live="polite"
              className="text-xs text-zinc-500 dark:text-zinc-400"
            >
              {copyError
                ? "Gagal menyalin. Coba lagi."
                : copied
                  ? "Ringkasan disalin ke clipboard."
                  : "Format teks Rupiah siap dibagikan."}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
