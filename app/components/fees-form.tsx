"use client";

import { useState, useTransition, type FormEvent } from "react";
import { saveExtraFees } from "@/app/actions";
import type { DiscountType, ExtraFees } from "@/lib/types";
import { parseFeesForm, type ActionResult, type FieldErrors } from "@/lib/validation";
import { buttonClass, Card, Field, FormAlert, inputClass } from "./form-ui";

export function FeesForm({ fees }: { fees: ExtraFees }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType>(fees.discountType);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    const parsed = parseFeesForm(formData);

    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      setResult({ ok: false, message: parsed.message });
      return;
    }

    setErrors({});
    setResult(null);

    startTransition(async () => {
      const response = await saveExtraFees(formData);
      setResult(response);
      setErrors(response.ok ? {} : (response.fieldErrors ?? {}));
    });
  }

  return (
    <Card
      step="03"
      title="Biaya tambahan"
      description="Ongkir, diskon, dan pajak dibagi proporsional ke tiap peserta."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ongkir (Rp)" htmlFor="shipping-fee" error={errors.shippingFee}>
            <input
              id="shipping-fee"
              name="shipping_fee"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={fees.shippingFee}
              className={inputClass}
              aria-invalid={Boolean(errors.shippingFee)}
            />
          </Field>

          <Field label="Pajak / biaya layanan (Rp)" htmlFor="tax-fee" error={errors.taxFee}>
            <input
              id="tax-fee"
              name="tax_fee"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={fees.taxFee}
              className={inputClass}
              aria-invalid={Boolean(errors.taxFee)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jenis diskon" htmlFor="discount-type" error={errors.discountType}>
            <select
              id="discount-type"
              name="discount_type"
              value={discountType}
              onChange={(event) => setDiscountType(event.target.value as DiscountType)}
              className={inputClass}
            >
              <option value="amount">Nominal Rupiah</option>
              <option value="percent">Persen (%)</option>
            </select>
          </Field>

          <Field
            label="Nilai diskon"
            htmlFor="discount-value"
            error={errors.discountValue}
            hint={
              discountType === "percent"
                ? "Isi 10 untuk diskon 10% (maksimal 100%)."
                : "Isi nominal Rupiah, mis. 15000. Otomatis dibatasi sebesar subtotal."
            }
          >
            <div className="relative">
              <input
                id="discount-value"
                name="discount_value"
                type="number"
                inputMode="decimal"
                min={0}
                max={discountType === "percent" ? 100 : undefined}
                step={discountType === "percent" ? 0.01 : 1}
                defaultValue={fees.discountValue}
                className={`${inputClass} ${discountType === "percent" ? "pr-8" : ""}`}
                aria-invalid={Boolean(errors.discountValue)}
              />
              {discountType === "percent" ? (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
                  %
                </span>
              ) : null}
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Menyimpan..." : "Simpan biaya"}
          </button>
        </div>

        {result?.message ? <FormAlert ok={result.ok}>{result.message}</FormAlert> : null}
      </form>
    </Card>
  );
}
