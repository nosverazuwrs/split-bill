import { connection } from "next/server";
import { db } from "./db";
import type { ExtraFees, Item, Participant } from "./types";
import type { ItemInput } from "./validation";

interface ParticipantRow {
  id: number;
  name: string;
}

interface ItemRow {
  id: number;
  name: string;
  price: number;
  qty: number;
  shared_by_json: string;
}

interface ExtraFeesRow {
  shipping_fee: number;
  discount_type: string;
  discount_value: number;
  tax_fee: number;
}

function readParticipants(): Participant[] {
  return db
    .prepare("SELECT id, name FROM participants ORDER BY id")
    .all() as ParticipantRow[];
}

function parseSharedBy(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

function readItems(): Item[] {
  const rows = db
    .prepare("SELECT id, name, price, qty, shared_by_json FROM items ORDER BY id")
    .all() as ItemRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    qty: row.qty,
    sharedBy: parseSharedBy(row.shared_by_json),
  }));
}

function readExtraFees(): ExtraFees {
  const row = db
    .prepare(
      "SELECT shipping_fee, discount_type, discount_value, tax_fee FROM extra_fees WHERE id = 1",
    )
    .get() as ExtraFeesRow | undefined;

  return {
    shippingFee: row?.shipping_fee ?? 0,
    discountType: row?.discount_type === "percent" ? "percent" : "amount",
    discountValue: row?.discount_value ?? 0,
    taxFee: row?.tax_fee ?? 0,
  };
}

/**
 * Membaca seluruh data yang dibutuhkan form.
 * better-sqlite3 bersifat sinkron, jadi `connection()` wajib dipanggil agar
 * query tidak dieksekusi saat prerendering.
 */
export async function getSplitBillState(): Promise<{
  participants: Participant[];
  items: Item[];
  fees: ExtraFees;
}> {
  await connection();
  return {
    participants: readParticipants(),
    items: readItems(),
    fees: readExtraFees(),
  };
}

/** Hanya dipakai di Server Action (sudah berjalan saat request). */
export function readParticipantIds(): number[] {
  return (db.prepare("SELECT id FROM participants").all() as { id: number }[]).map(
    (row) => row.id,
  );
}

export function insertParticipant(name: string): number {
  const result = db.prepare("INSERT INTO participants (name) VALUES (?)").run(name);
  return Number(result.lastInsertRowid);
}

export function insertItem(item: ItemInput): number {
  const result = db
    .prepare(
      "INSERT INTO items (name, price, qty, shared_by_json) VALUES (?, ?, ?, ?)",
    )
    .run(item.name, item.price, item.qty, JSON.stringify(item.sharedBy));

  return Number(result.lastInsertRowid);
}

export function updateParticipant(id: number, name: string): boolean {
  const result = db
    .prepare("UPDATE participants SET name = ? WHERE id = ?")
    .run(name, id);

  return result.changes > 0;
}

/**
 * Menghapus peserta sekaligus melepas ID-nya dari `shared_by_json` setiap item.
 * Item yang pembaginya habis akan muncul sebagai item tanpa pembagi di ringkasan.
 */
export function deleteParticipant(id: number): boolean {
  const remove = db.transaction((participantId: number) => {
    const result = db.prepare("DELETE FROM participants WHERE id = ?").run(participantId);
    if (result.changes === 0) return false;

    const rows = db
      .prepare("SELECT id, shared_by_json FROM items")
      .all() as { id: number; shared_by_json: string }[];
    const updateSharedBy = db.prepare(
      "UPDATE items SET shared_by_json = ? WHERE id = ?",
    );

    for (const row of rows) {
      const sharedBy = parseSharedBy(row.shared_by_json);
      if (!sharedBy.includes(participantId)) continue;

      updateSharedBy.run(
        JSON.stringify(sharedBy.filter((sharedId) => sharedId !== participantId)),
        row.id,
      );
    }

    return true;
  });

  return remove(id);
}

export function updateItem(id: number, item: ItemInput): boolean {
  const result = db
    .prepare(
      "UPDATE items SET name = ?, price = ?, qty = ?, shared_by_json = ? WHERE id = ?",
    )
    .run(item.name, item.price, item.qty, JSON.stringify(item.sharedBy), id);

  return result.changes > 0;
}

export function deleteItem(id: number): boolean {
  const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);
  return result.changes > 0;
}

export function upsertExtraFees(fees: ExtraFees): void {
  db.prepare(
    `INSERT INTO extra_fees (id, shipping_fee, discount_type, discount_value, tax_fee)
     VALUES (1, @shippingFee, @discountType, @discountValue, @taxFee)
     ON CONFLICT(id) DO UPDATE SET
       shipping_fee = excluded.shipping_fee,
       discount_type = excluded.discount_type,
       discount_value = excluded.discount_value,
       tax_fee = excluded.tax_fee`,
  ).run({ ...fees });
}
