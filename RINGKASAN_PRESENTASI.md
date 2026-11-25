# Ringkasan Presentasi — SplitBill & Ongkir Kalkulator

## 1. Alur Input → Proses → Output

| Tahap | Aksi di UI | Yang terjadi di balik layar |
| --- | --- | --- |
| Input peserta | Isi nama lalu klik **Tambah peserta** | Validasi nama, simpan ke tabel `participants` |
| Input item | Isi nama, harga, qty, centang peserta pembagi lalu **Tambah item** | Validasi angka, simpan `shared_by_json` ke tabel `items` |
| Input biaya | Isi ongkir, diskon (nominal/persen), pajak lalu **Simpan biaya** | Validasi nilai, upsert baris `extra_fees` id = 1 |
| Proses | Otomatis setelah data berubah | `calculateSplit()` menghitung porsi tiap peserta |
| Output | Kartu **Rincian tagihan** | Subtotal, diskon, pajak, ongkir, total akhir per orang + grand total |
| Aksi lanjutan | **Edit/Hapus** dan **Copy Ringkasan** | Update/delete ke SQLite, salin teks Rupiah ke clipboard |

## 2. Rumus Inti

- `item_subtotal = price × qty`
- `porsi_item = item_subtotal / jumlah_pembagi`
- `subtotal_orang = Σ porsi_item` yang ditanggung peserta
- `diskon_persen = total_subtotal × (discount_value / 100)`
- `diskon_nominal = min(discount_value, total_subtotal)`
- `porsi_biaya = biaya × (subtotal_orang / total_subtotal)`
- `total_orang = subtotal_orang − porsi_diskon + porsi_pajak + porsi_ongkir`
- Pembulatan memakai **metode sisa terbesar** agar jumlah komponen per orang tetap sama dengan total keseluruhan.

## 3. Edge Case yang Sudah Ditangani

| Kasus | Perilaku aplikasi |
| --- | --- |
| 0 peserta | Form item menampilkan arahan, dashboard kosong, tombol copy disembunyikan |
| Item tanpa pembagi | Item ditandai kuning, tidak masuk total, dashboard memberi peringatan |
| Peserta dihapus | ID peserta dilepas dari semua item dalam satu transaksi |
| Diskon nominal sangat besar | Otomatis dibatasi sebesar subtotal, total tidak negatif |
| Diskon persen > 100% | Ditolak validasi (maksimal 100%) |
| Pembulatan Rupiah | Alokasi sisa terbesar; total per komponen dan grand total selalu konsisten |
| Input kosong/tidak valid | Pesan error per field; server tetap memvalidasi ulang |
| Item/peserta tidak ditemukan | Server Action mengembalikan pesan error yang jelas |

## 4. Skenario Demo (Data Contoh)

**Peserta:** Andi, Budi, Citra
**Item:** Nasi Goreng Rp25.000 × 2 (dibagi 3 orang), Es Teh Rp5.000 (Andi)
**Biaya:** Ongkir Rp10.000, pajak Rp5.000, diskon 10%

| Ringkasan | Nilai |
| --- | --- |
| Subtotal pesanan | Rp55.000 |
| Diskon 10% | −Rp5.500 |
| Ongkir | Rp10.000 |
| Pajak | Rp5.000 |
| **Grand total** | **Rp64.500** |
| Andi | Rp25.410 |
| Budi | Rp19.545 |
| Citra | Rp19.545 |

## 5. Poin Teknis untuk Dijelaskan

- **Next.js App Router + Server Actions**: form tetap reaktif di klien, penyimpanan aman di server.
- **Validasi ganda**: aturan sama dipakai di klien (`event.preventDefault()`) dan server.
- **SQLite (`better-sqlite3`)**: tabel `participants`, `items`, `extra_fees`; pembagi item disimpan sebagai JSON.
- **Cache Components**: data SQLite dibaca lewat `connection()` di dalam `<Suspense>` agar selalu fresh per request.
- **Responsif**: layout Tailwind menyesuaikan HP dan desktop; rincian memakai grid 2 kolom di layar kecil.
- **Copy Ringkasan**: `navigator.clipboard` dengan fallback `execCommand`, format Rupiah `id-ID`.
- **Verifikasi**: `tsc --noEmit`, `npm run lint`, `next build`, dan pengujian edge case kalkulasi/pembulatan.

## 6. Kalimat Singkat Presentasi

> “Aplikasi ini memudahkan patungan: pengguna cukup memasukkan peserta, item, dan biaya tambahan. Sistem menyimpan data di SQLite, menghitung porsi secara proporsional, lalu menampilkan total per orang yang siap disalin ke grup chat.”
