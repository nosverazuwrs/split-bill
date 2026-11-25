"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createParticipant } from "@/app/actions";
import type { Participant } from "@/lib/types";
import {
  parseParticipantForm,
  type ActionResult,
  type FieldErrors,
} from "@/lib/validation";
import { buttonClass, Card, Field, FormAlert, inputClass } from "./form-ui";
import { ParticipantList } from "./participant-list";

export function ParticipantForm({ participants }: { participants: Participant[] }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = parseParticipantForm(formData);

    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      setResult({ ok: false, message: parsed.message });
      return;
    }

    setErrors({});
    setResult(null);

    startTransition(async () => {
      const response = await createParticipant(formData);
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
      step="01"
      title="Peserta"
      description="Tambahkan orang yang ikut patungan."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Nama peserta" htmlFor="participant-name" error={errors.name}>
          <input
            id="participant-name"
            name="name"
            type="text"
            maxLength={80}
            autoComplete="off"
            placeholder="Contoh: Andi"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Menyimpan..." : "Tambah peserta"}
          </button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {participants.length} peserta terdaftar
          </span>
        </div>

        {result?.message ? <FormAlert ok={result.ok}>{result.message}</FormAlert> : null}
      </form>

      <ParticipantList participants={participants} />
    </Card>
  );
}
