"use client";

import { useState, useTransition, type FormEvent } from "react";
import { deleteItemAction, updateItemAction } from "@/app/actions";
import { formatRupiah } from "@/lib/format";
import type { Item, Participant } from "@/lib/types";
import { parseItemForm, type ActionResult, type FieldErrors } from "@/lib/validation";
import {
  FormAlert,
  inputClass,
  smallButtonClass,
  smallDangerButtonClass,
  smallSecondaryButtonClass,
} from "./form-ui";

export function ItemList({
  participants,
  items,
}: {
  participants: Participant[];
  items: Item[];
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const nameById = new Map(participants.map((participant) => [participant.id, participant.name]));

  function handleUpdate(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    const parsed = parseItemForm(formData);

    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      setResult({ ok: false, message: parsed.message });
      return;
    }

    setErrors({});
    setResult(null);
    setPendingId(id);

    startTransition(async () => {
      const response = await updateItemAction(id, formData);
      setResult(response);

      if (response.ok) {
        setEditingId(null);
      } else {
        setErrors(response.fieldErrors ?? {});
      }
      setPendingId(null);
    });
  }

  function handleDelete(id: number, name: string) {
    if (pending) return;

    const confirmed = window.confirm(`Hapus item "${name}"?`);
    if (!confirmed) return;

    setErrors({});
    setResult(null);
    setPendingId(id);

    startTransition(async () => {
      const response = await deleteItemAction(id);
      setResult(response);

      if (response.ok && editingId === id) {
        setEditingId(null);
      }
      setPendingId(null);
    });
  }

  return (
    <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Item tersimpan
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {items.length} item
        </span>
      </div>

      {result?.message ? (
        <div className="mt-3">
          <FormAlert ok={result.ok}>{result.message}</FormAlert>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item) => {
            const sharers = item.sharedBy
              .map((id) => nameById.get(id))
              .filter((name): name is string => Boolean(name));

            if (editingId === item.id) {
              return (
                <li
                  key={item.id}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <form
                    onSubmit={(event) => handleUpdate(event, item.id)}
                    noValidate
                    className="space-y-3"
                  >
                    <div>
                      <label
                        htmlFor={`edit-item-name-${item.id}`}
                        className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Nama item
                      </label>
                      <input
                        id={`edit-item-name-${item.id}`}
                        name="name"
                        type="text"
                        maxLength={80}
                        defaultValue={item.name}
                        autoComplete="off"
                        className={inputClass}
                        aria-invalid={Boolean(errors.name)}
                      />
                      {errors.name ? (
                        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                          {errors.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`edit-item-price-${item.id}`}
                          className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Harga satuan (Rp)
                        </label>
                        <input
                          id={`edit-item-price-${item.id}`}
                          name="price"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          defaultValue={item.price}
                          className={inputClass}
                          aria-invalid={Boolean(errors.price)}
                        />
                        {errors.price ? (
                          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                            {errors.price}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-item-qty-${item.id}`}
                          className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Qty
                        </label>
                        <input
                          id={`edit-item-qty-${item.id}`}
                          name="qty"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          defaultValue={item.qty}
                          className={inputClass}
                          aria-invalid={Boolean(errors.qty)}
                        />
                        {errors.qty ? (
                          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                            {errors.qty}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <fieldset>
                      <legend className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Dibagi ke peserta
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {participants.map((participant) => (
                          <label
                            key={participant.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-700 transition hover:border-emerald-400 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-emerald-500 dark:has-[:checked]:bg-emerald-500/10"
                          >
                            <input
                              type="checkbox"
                              name="shared_by"
                              value={participant.id}
                              defaultChecked={item.sharedBy.includes(participant.id)}
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
                      ) : null}
                    </fieldset>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={pending}
                        className={smallButtonClass}
                      >
                        {pendingId === item.id ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setEditingId(null);
                          setErrors({});
                        }}
                        className={smallSecondaryButtonClass}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </li>
              );
            }

            const hasNoSharers = sharers.length === 0;

            return (
              <li
                key={item.id}
                className={
                  hasNoSharers
                    ? "rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10"
                    : "rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {item.name}
                    </p>
                    <p
                      className={
                        hasNoSharers
                          ? "mt-0.5 text-xs text-amber-700 dark:text-amber-300"
                          : "mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
                      }
                    >
                      {item.qty} &times; {formatRupiah(item.price)} &middot; Dibagi ke:{" "}
                      {hasNoSharers
                        ? "belum ada peserta (tidak dihitung)"
                        : sharers.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pending || participants.length === 0}
                      title={
                        participants.length === 0
                          ? "Tambahkan peserta sebelum mengedit item."
                          : undefined
                      }
                      onClick={() => {
                        setEditingId(item.id);
                        setErrors({});
                        setResult(null);
                      }}
                      className={smallSecondaryButtonClass}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(item.id, item.name)}
                      className={smallDangerButtonClass}
                    >
                      {pendingId === item.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Belum ada item pesanan.
        </p>
      )}
    </div>
  );
}
