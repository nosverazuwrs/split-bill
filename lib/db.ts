import path from "node:path";
import Database from "better-sqlite3";

const DEFAULT_DB_PATH = path.join(process.cwd(), "splitbill.db");

export const DB_PATH = process.env.SPLITBILL_DB_PATH ?? DEFAULT_DB_PATH;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS participants (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  price          INTEGER NOT NULL,
  qty            INTEGER NOT NULL,
  shared_by_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS extra_fees (
  id             INTEGER PRIMARY KEY,
  shipping_fee   INTEGER NOT NULL DEFAULT 0,
  discount_type  TEXT NOT NULL DEFAULT 'amount'
                 CHECK (discount_type IN ('amount', 'percent')),
  discount_value REAL NOT NULL DEFAULT 0,
  tax_fee        INTEGER NOT NULL DEFAULT 0
);
`;

function createConnection(): Database.Database {
  const database = new Database(DB_PATH);

  // WAL membuat baca/tulis lebih aman saat dev, busy_timeout mencegah SQLITE_BUSY.
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");

  // Semua DDL bersifat idempotent, jadi aman dijalankan setiap kali koneksi dibuat.
  database.exec(SCHEMA_SQL);

  // Baris konfigurasi biaya tambahan selalu memakai id = 1.
  database
    .prepare(
      `INSERT OR IGNORE INTO extra_fees
         (id, shipping_fee, discount_type, discount_value, tax_fee)
       VALUES (1, 0, 'amount', 0, 0)`,
    )
    .run();

  return database;
}

declare global {
  // Simpan koneksi di globalThis agar hot reload Next.js tidak membuka koneksi baru terus-menerus.
  var __splitbillDb: Database.Database | undefined;
}

export const db: Database.Database =
  globalThis.__splitbillDb ?? (globalThis.__splitbillDb = createConnection());
