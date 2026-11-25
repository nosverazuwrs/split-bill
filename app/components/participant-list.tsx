"use client";

import { useState, useTransition, type FormEvent } from "react";
import { deleteParticipantAction, updateParticipantAction } from "@/app/actions";
import type { Participant } from "@/lib/types";
import {
  parseParticipantForm,
  type ActionResult,
  type FieldErrors,
} from "@/lib/validation";
import {
  FormAlert,
  inputClass,
  smallButtonClass,
  smallDangerButtonClass,
  smallSecondaryButtonClass,
} from "./form-ui";

export function ParticipantList({ participants }: { participants: Participant[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpdate(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    const parsed = parseParticipantForm(formData);

    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      setResult({ ok: false, message: parsed.message });
      return;
    }

    setErrors({});
    setResult(null);
    setPendingId(id);

    startTransition(async () => {
      const response = await updateParticipantAction(id, formData);
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

    const confirmed = window.confirm(
      `Hapus peserta "${name}"? Peserta ini juga akan dilepas dari item terkait.`,
    );
    if (!confirmed) return;

    setErrors({});
    setResult(null);
    setPendingId(id);

    startTransition(async () => {
      const response = await deleteParticipantAction(id);
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
          Daftar peserta
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {participants.length} orang
        </span>
      </div>

      {result?.message ? (
        <div className="mt-3">
          <FormAlert ok={result.ok}>{result.message}</FormAlert>
        </div>
      ) : null}

      {participants.length > 0 ? (
        <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
          {participants.map((participant, index) => (
            <li key={participant.id} className="py-2.5">
              {editingId === participant.id ? (
                <form
                  onSubmit={(event) => handleUpdate(event, participant.id)}
                  noValidate
                  className="space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      name="name"
                      type="text"
                      maxLength={80}
                      defaultValue={participant.name}
                      autoComplete="off"
                      autoFocus
                      className={`${inputClass} min-w-40 flex-1`}
                      aria-invalid={Boolean(errors.name)}
                    />
                    <button
                      type="submit"
                      disabled={pending}
                      className={smallButtonClass}
                    >
                      {pendingId === participant.id ? "Menyimpan..." : "Simpan"}
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
                  {errors.name ? (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  ) : null}
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {participant.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setEditingId(participant.id);
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
                      onClick={() => handleDelete(participant.id, participant.name)}
                      className={smallDangerButtonClass}
                    >
                      {pendingId === participant.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Belum ada peserta.
        </p>
      )}
    </div>
  );
}
