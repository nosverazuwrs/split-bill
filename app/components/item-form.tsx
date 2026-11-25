"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createItem } from "@/app/actions";
import type { Item, Participant } from "@/lib/types";
import { parseItemForm, type ActionResult, type FieldErrors } from "@/lib/validation";
import { buttonClass, Card, Field, FormAlert, inputClass } from "./form-ui";
import { ItemList } from "./item-list";

export function ItemForm({
  participants,
  items,
}: {
  participants: Participant[];
  items: Item[];
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = parseItemForm(formData);

    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      setResult({ ok: false, message: parsed.message });
      return;
    }

    setErrors({});
    setResult(null);

    startTransition(async () => {
      const response = await createItem(formData);
      setResult(response);

      if (response.ok) {
        form.reset();
        setErrors({});
      } else {
        setErrors(response.fieldErrors ?? {});
      }
    });
  }

  return (
    <Card
      step="02"
      title="Item pesanan"
      description="Isi nama, harga satuan, qty, lalu pilih peserta yang menanggung."
    >
      {participants.length === 0 ? (
        <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Tambahkan peserta terlebih dahulu sebelum membuat item pesanan.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Nama item" htmlFor="item-name" error={errors.name}>
            <input
              id="item-name"
              name="name"
              type="text"
              maxLength={80}
              autoComplete="off"
              placeholder="Contoh: Nasi goreng"
              className={inputClass}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Harga satuan (Rp)"
              htmlFor="item-price"
              error={errors.price}
            >
              <input
                id="item-price"
                name="price"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="25000"
                className={inputClass}
                aria-invalid={Boolean(errors.price)}
              />
            </Field>

            <Field label="Qty" htmlFor="item-qty" error={errors.qty}>
              <input
                id="item-qty"
                name="qty"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                defaultValue={1}
                className={inputClass}
                aria-invalid={Boolean(errors.qty)}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Dibagi ke peserta
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {participants.map((participant) => (
                <label
                  key={participant.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:border-emerald-400 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-emerald-500 dark:has-[:checked]:bg-emerald-500/10"
                >
                  <input
                    type="checkbox"
                    name="shared_by"
                    value={participant.id}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className="truncate">{participant.name}</span>
                </label>
              ))}
            </div>
            {errors.sharedBy ? (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.sharedBy}
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Pilih lebih dari satu peserta jika item ini dibagi rata.
              </p>
            )}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className={buttonClass}>
              {pending ? "Menyimpan..." : "Tambah item"}
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {items.length} item tersimpan
            </span>
          </div>

          {result?.message ? <FormAlert ok={result.ok}>{result.message}</FormAlert> : null}
        </form>
      )}

      <ItemList participants={participants} items={items} />
    </Card>
  );
}
