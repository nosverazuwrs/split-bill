# Perancangan Web App: SplitBill & Ongkir Kalkulator

- **Tema:** Tech for Convenience
- **Tech Stack:** Next.js (App Router) + Tailwind CSS + SQLite (`splitbill.db`)
- **Acuan:** Handbook Weekly Class #2 — Web Development (GDGoC)

---

## 1. Requirement Gathering

### Functional Requirement
- Menambah daftar peserta patungan (nama peserta).
- Menambah item pesanan (nama item, harga satuan, jumlah/qty, dan pilihan peserta yang menanggung item tersebut).
- Mengatur biaya tambahan global: ongkir, diskon (nominal Rp atau persentase), dan pajak/biaya layanan.
- Menghitung otomatis porsi bayar tiap orang secara proporsional serta menyediakan tombol **Copy Ringkasan** format teks Rupiah dan tombol **Hapus/Edit** data.

### Non-Functional Requirement
- **Responsive:** Tampilan nyaman digunakan di layar HP maupun laptop saat demo.
- **Persistensi Lokal:** Data tersimpan di file database lokal SQLite (`splitbill.db`) agar tidak hilang saat browser di-refresh.
- **Client-Side Validation:** Validasi input wajib diisi, angka positif (`> 0` untuk harga/qty), dan penanganan nilai biaya tambahan (`>= 0`) sebelum diproses.

---

## 2. Scope & Feature Definition (MVP)

| Status | Fitur | Alasan |
| :--- | :--- | :--- |
| **In-Scope (Wajib Jadi)** | Form peserta, item pesanan, dan biaya tambahan (ongkir, diskon, pajak) | Inti input data patungan |
| **In-Scope (Wajib Jadi)** | Perhitungan proporsional per orang + penyesuaian pembulatan Rupiah | Nilai utama aplikasi agar adil dan pas |
| **In-Scope (Wajib Jadi)** | Hapus/edit data + tombol Copy Ringkasan teks | Memudahkan koreksi dan pembagian hasil ke grup chat |
| **Out-of-Scope (Ditunda)** | Scan struk OCR otomatis, login multi-user, payment gateway | Berisiko memakan waktu di target pengerjaan 1 hari |

---

## 3. User Flow

1. Buka aplikasi -> Tampil halaman utama **SplitBill & Ongkir Kalkulator**.
2. Tambah peserta -> Input item pesanan (nama, harga, qty, pembagi) -> Input ongkir, diskon, dan pajak.
3. Klik tombol **Simpan / Hitung** (`event.preventDefault()` + konversi angka `parseFloat`/`parseInt`).
4. Validasi data:
   - Jika tidak valid -> Tampilkan pesan error yang jelas.
   - Jika valid -> Simpan ke SQLite dan perbarui kalkulasi otomatis.
5. Lihat rincian tagihan per orang -> Klik **Hapus/Edit** jika perlu revisi atau klik **Copy Ringkasan** untuk menyalin teks hasil.

---

## 4. Task Breakdown

1. **Architecture & SQLite:** Menyiapkan koneksi SQLite lokal, skema tabel (`participants`, `items`, `extra_fees`), dan fungsi kalkulasi proporsional.
2. **Form Input & Validation:** Membuat form peserta, item, dan biaya tambahan lengkap dengan validasi serta Server Action penyimpanan.
3. **Dashboard Hasil & Copy:** Menampilkan kartu/tabel rincian tagihan per orang, aksi hapus/edit, dan tombol *Copy Ringkasan*.
4. **Integrasi, Edge Cases & Presentasi:** Menguji skenario batas (0 peserta, item tanpa pembagi, diskon besar, pembulatan) dan menyiapkan poin penjelasan alur.

---

## 5. Rancangan Skema SQLite & Rumus Inti

### Tabel `participants`
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `name`: `TEXT NOT NULL`

### Tabel `items`
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `name`: `TEXT NOT NULL`
- `price`: `INTEGER NOT NULL`
- `qty`: `INTEGER NOT NULL`
- `shared_by_json`: `TEXT NOT NULL` (menyimpan array ID peserta yang membagi item)

### Tabel `extra_fees`
- `id`: `INTEGER PRIMARY KEY` (selalu baris ID `1` untuk konfigurasi aktif)
- `shipping_fee`: `INTEGER NOT NULL DEFAULT 0`
- `discount_type`: `TEXT NOT NULL DEFAULT 'amount'` (`'amount'` atau `'percent'`)
- `discount_value`: `REAL NOT NULL DEFAULT 0`
- `tax_fee`: `INTEGER NOT NULL DEFAULT 0`

### Rumus Pembagian Proporsional
- **Subtotal Item:** `item_subtotal = price * qty`
- **Porsi Item per Peserta:** dibagi rata ke peserta yang memilih item tersebut, lalu dijumlahkan menjadi `subtotal_orang` tiap peserta.
- **Total Subtotal Pesanan:** `total_subtotal = sum(subtotal_orang semua peserta)`
- **Nominal Diskon Rupiah:** jika `'percent'`, `diskon_rp = total_subtotal * (discount_value / 100)`; jika `'amount'`, `diskon_rp = min(discount_value, total_subtotal)`.
- **Alokasi Biaya Tambahan per Peserta:** untuk biaya `shipping_fee`, `tax_fee`, dan `diskon_rp`, masing-masing dibagi sebanding dengan rasio `subtotal_orang / total_subtotal` (bila `total_subtotal > 0`).
- **Total Akhir per Peserta:** `subtotal_orang - porsi_diskon + porsi_pajak + porsi_ongkir` (dibulatkan ke Rupiah terdekat dengan penyesuaian selisih pembulatan agar total keseluruhan tetap akurat).

---

## 6. Prompt Chaining (4 Langkah di OpenCode)

### Prompt 1 — Architecture & SQLite
> **Role & Konteks:** Kamu adalah web developer yang membantu membangun aplikasi *SplitBill & Ongkir Kalkulator* (tema *Tech for Convenience*) menggunakan Next.js App Router, Tailwind CSS, dan SQLite.
> **Tugas Spesifik:** Buat koneksi database SQLite lokal (`splitbill.db`), inisialisasi tabel `participants`, `items`, dan `extra_fees`, serta fungsi helper perhitungan pembagian tagihan proporsional per orang.
> **Batasan (Scope):** Jangan buat komponen UI lengkap atau tombol copy dulu; fokus hanya pada koneksi SQLite, skema tabel, dan fungsi kalkulasi inti.
> **Hasil yang Diminta:** Kode yang bersih, terstruktur, dan disertai komentar singkat pada logika SQLite dan rumus perhitungan.

### Prompt 2 — Form Input & Client-Side Validation
> **Role & Konteks:** Melanjutkan proyek *SplitBill & Ongkir Kalkulator* di Next.js App Router + Tailwind CSS + SQLite dengan struktur dari Tahap 1.
> **Tugas Spesifik:** Buat form tambah peserta, form tambah item pesanan (nama, harga, qty, peserta pembagi), dan form biaya tambahan (ongkir, diskon nominal/persen, pajak) dengan `event.preventDefault()`, konversi angka, validasi input, dan Server Action penyimpanan ke SQLite.
> **Batasan (Scope):** Jangan buat ringkasan akhir yang kompleks atau fitur copy teks dulu; fokus pada form input, validasi, dan penyimpanan data.
> **Hasil yang Diminta:** Kode form yang rapi beserta pesan error yang jelas saat input kosong atau tidak valid.

### Prompt 3 — Dashboard Hasil, Hapus/Edit & Copy Ringkasan
> **Role & Konteks:** Melanjutkan *SplitBill & Ongkir Kalkulator* yang sudah memiliki form input dan penyimpanan SQLite dari Tahap 2.
> **Tugas Spesifik:** Buat tampilan rincian tagihan per orang (subtotal, diskon, pajak, ongkir, total akhir), tombol hapus/edit item atau peserta, serta tombol *Copy Ringkasan* format teks Rupiah.
> **Batasan (Scope):** Jangan tambahkan fitur di luar rincian per orang, hapus/edit, dan copy ringkasan teks.
> **Hasil yang Diminta:** Tampilan yang responsive di HP dan desktop serta berjalan tanpa error.

### Prompt 4 — Integrasi, Edge Cases & Ringkasan Presentasi
> **Role & Konteks:** Melanjutkan *SplitBill & Ongkir Kalkulator* yang sudah memiliki arsitektur, form validasi, dan tampilan hasil dari Tahap 1–3.
> **Tugas Spesifik:** Periksa integrasi seluruh alur, tangani edge case (0 peserta, item tanpa pembagi, diskon besar, pembulatan Rupiah), dan buatkan ringkasan singkat alur input-proses-output untuk presentasi.
> **Batasan (Scope):** Jangan menambah fitur besar baru; fokus pada stabilitas alur utama dan kejelasan penjelasan presentasi.
> **Hasil yang Diminta:** Perbaikan kode untuk edge case serta poin penjelasan singkat untuk presentasi.