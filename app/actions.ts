"use server";

import { revalidatePath } from "next/cache";
import {
  deleteItem as deleteItemRow,
  deleteParticipant as deleteParticipantRow,
  insertItem,
  insertParticipant,
  readParticipantIds,
  updateItem as updateItemRow,
  updateParticipant as updateParticipantRow,
  upsertExtraFees,
} from "@/lib/repository";
import {
  parseFeesForm,
  parseItemForm,
  parseParticipantForm,
  parseRowId,
  type ActionResult,
} from "@/lib/validation";

function validateParticipantIds(sharedBy: number[]): ActionResult | null {
  const existingIds = new Set(readParticipantIds());
  const hasUnknownParticipant = sharedBy.some((id) => !existingIds.has(id));

  if (!hasUnknownParticipant) return null;

  return {
    ok: false,
    message: "Peserta yang dipilih tidak ditemukan. Muat ulang halaman lalu coba lagi.",
    fieldErrors: { sharedBy: "Pilih peserta yang masih terdaftar." },
  };
}

export async function createParticipant(formData: FormData): Promise<ActionResult> {
  const parsed = parseParticipantForm(formData);
  if (!parsed.ok) return parsed;

  try {
    insertParticipant(parsed.data.name);
    revalidatePath("/");
    return { ok: true, message: "Peserta berhasil ditambahkan." };
  } catch (error) {
    console.error("Gagal menambah peserta:", error);
    return { ok: false, message: "Gagal menyimpan peserta. Silakan coba lagi." };
  }
}

export async function createItem(formData: FormData): Promise<ActionResult> {
  const parsed = parseItemForm(formData);
  if (!parsed.ok) return parsed;

  const participantError = validateParticipantIds(parsed.data.sharedBy);
  if (participantError) return participantError;

  try {
    insertItem(parsed.data);
    revalidatePath("/");
    return { ok: true, message: "Item berhasil ditambahkan." };
  } catch (error) {
    console.error("Gagal menambah item:", error);
    return { ok: false, message: "Gagal menyimpan item. Silakan coba lagi." };
  }
}

export async function saveExtraFees(formData: FormData): Promise<ActionResult> {
  const parsed = parseFeesForm(formData);
  if (!parsed.ok) return parsed;

  try {
    upsertExtraFees(parsed.data);
    revalidatePath("/");
    return { ok: true, message: "Biaya tambahan berhasil disimpan." };
  } catch (error) {
    console.error("Gagal menyimpan biaya tambahan:", error);
    return {
      ok: false,
      message: "Gagal menyimpan biaya tambahan. Silakan coba lagi.",
    };
  }
}

export async function updateParticipantAction(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const participantId = parseRowId(id);
  if (participantId === null) {
    return { ok: false, message: "Peserta yang dipilih tidak valid." };
  }

  const parsed = parseParticipantForm(formData);
  if (!parsed.ok) return parsed;

  try {
    const changed = updateParticipantRow(participantId, parsed.data.name);
    if (!changed) return { ok: false, message: "Peserta tidak ditemukan." };

    revalidatePath("/");
    return { ok: true, message: "Peserta berhasil diperbarui." };
  } catch (error) {
    console.error("Gagal memperbarui peserta:", error);
    return { ok: false, message: "Gagal memperbarui peserta. Silakan coba lagi." };
  }
}

export async function deleteParticipantAction(id: number): Promise<ActionResult> {
  const participantId = parseRowId(id);
  if (participantId === null) {
    return { ok: false, message: "Peserta yang dipilih tidak valid." };
  }

  try {
    const deleted = deleteParticipantRow(participantId);
    if (!deleted) return { ok: false, message: "Peserta tidak ditemukan." };

    revalidatePath("/");
    return { ok: true, message: "Peserta berhasil dihapus." };
  } catch (error) {
    console.error("Gagal menghapus peserta:", error);
    return { ok: false, message: "Gagal menghapus peserta. Silakan coba lagi." };
  }
}

export async function updateItemAction(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const itemId = parseRowId(id);
  if (itemId === null) {
    return { ok: false, message: "Item yang dipilih tidak valid." };
  }

  const parsed = parseItemForm(formData);
  if (!parsed.ok) return parsed;

  const participantError = validateParticipantIds(parsed.data.sharedBy);
  if (participantError) return participantError;

  try {
    const changed = updateItemRow(itemId, parsed.data);
    if (!changed) return { ok: false, message: "Item tidak ditemukan." };

    revalidatePath("/");
    return { ok: true, message: "Item berhasil diperbarui." };
  } catch (error) {
    console.error("Gagal memperbarui item:", error);
    return { ok: false, message: "Gagal memperbarui item. Silakan coba lagi." };
  }
}

export async function deleteItemAction(id: number): Promise<ActionResult> {
  const itemId = parseRowId(id);
  if (itemId === null) {
    return { ok: false, message: "Item yang dipilih tidak valid." };
  }

  try {
    const deleted = deleteItemRow(itemId);
    if (!deleted) return { ok: false, message: "Item tidak ditemukan." };

    revalidatePath("/");
    return { ok: true, message: "Item berhasil dihapus." };
  } catch (error) {
    console.error("Gagal menghapus item:", error);
    return { ok: false, message: "Gagal menghapus item. Silakan coba lagi." };
  }
}
