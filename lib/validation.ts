import type { DiscountType } from "./types";

export type FieldErrors = Record<string, string>;

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
}

export interface ParticipantInput {
  name: string;
}

export interface ItemInput {
  name: string;
  price: number;
  qty: number;
  sharedBy: number[];
}

export interface FeesInput {
  shippingFee: number;
  discountType: DiscountType;
  discountValue: number;
  taxFee: number;
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors: FieldErrors };

const MAX_NAME_LENGTH = 80;

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fail<T>(message: string, fieldErrors: FieldErrors): ParseResult<T> {
  return { ok: false, message, fieldErrors };
}

function parsePositiveInteger(
  raw: string,
  label: string,
): { value: number } | { error: string } {
  if (raw === "") return { error: `${label} wajib diisi.` };

  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { error: `${label} harus berupa angka bulat.` };
  }
  if (value <= 0) return { error: `${label} harus lebih dari 0.` };

  return { value };
}

function parseNonNegativeInteger(
  raw: string,
  label: string,
): { value: number } | { error: string } {
  if (raw === "") return { value: 0 };

  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { error: `${label} harus berupa angka bulat (tanpa desimal).` };
  }
  if (value < 0) return { error: `${label} tidak boleh negatif.` };

  return { value };
}

function parseNonNegativeNumber(
  raw: string,
  label: string,
): { value: number } | { error: string } {
  if (raw === "") return { value: 0 };

  const value = Number(raw);
  if (!Number.isFinite(value)) return { error: `${label} harus berupa angka.` };
  if (value < 0) return { error: `${label} tidak boleh negatif.` };

  return { value };
}

export function parseRowId(value: number): number | null {
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function parseParticipantForm(formData: FormData): ParseResult<ParticipantInput> {
  const name = getText(formData, "name");

  if (name === "") {
    return fail("Nama peserta wajib diisi.", { name: "Nama peserta wajib diisi." });
  }
  if (name.length > MAX_NAME_LENGTH) {
    const message = `Nama peserta maksimal ${MAX_NAME_LENGTH} karakter.`;
    return fail(message, { name: message });
  }

  return { ok: true, data: { name } };
}

export function parseItemForm(formData: FormData): ParseResult<ItemInput> {
  const fieldErrors: FieldErrors = {};

  const name = getText(formData, "name");
  if (name === "") {
    fieldErrors.name = "Nama item wajib diisi.";
  } else if (name.length > MAX_NAME_LENGTH) {
    fieldErrors.name = `Nama item maksimal ${MAX_NAME_LENGTH} karakter.`;
  }

  const price = parsePositiveInteger(getText(formData, "price"), "Harga");
  if ("error" in price) fieldErrors.price = price.error;

  const qty = parsePositiveInteger(getText(formData, "qty"), "Qty");
  if ("error" in qty) fieldErrors.qty = qty.error;

  const sharedBy = Array.from(
    new Set(
      formData
        .getAll("shared_by")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  if (sharedBy.length === 0) {
    fieldErrors.sharedBy = "Pilih minimal satu peserta yang menanggung item ini.";
  }

  if (Object.keys(fieldErrors).length > 0 || "error" in price || "error" in qty) {
    return fail("Periksa kembali data item.", fieldErrors);
  }

  return {
    ok: true,
    data: {
      name,
      price: price.value,
      qty: qty.value,
      sharedBy,
    },
  };
}

export function parseFeesForm(formData: FormData): ParseResult<FeesInput> {
  const fieldErrors: FieldErrors = {};

  const shippingFee = parseNonNegativeInteger(getText(formData, "shipping_fee"), "Ongkir");
  if ("error" in shippingFee) fieldErrors.shippingFee = shippingFee.error;

  const taxFee = parseNonNegativeInteger(getText(formData, "tax_fee"), "Pajak");
  if ("error" in taxFee) fieldErrors.taxFee = taxFee.error;

  const discountValue = parseNonNegativeNumber(
    getText(formData, "discount_value"),
    "Nilai diskon",
  );
  if ("error" in discountValue) fieldErrors.discountValue = discountValue.error;

  const rawDiscountType = getText(formData, "discount_type");
  if (
    rawDiscountType !== "" &&
    rawDiscountType !== "amount" &&
    rawDiscountType !== "percent"
  ) {
    fieldErrors.discountType = "Jenis diskon tidak valid.";
  }
  const discountType: DiscountType = rawDiscountType === "percent" ? "percent" : "amount";

  if (
    discountType === "percent" &&
    "value" in discountValue &&
    discountValue.value > 100
  ) {
    fieldErrors.discountValue = "Diskon persen maksimal 100%.";
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    "error" in shippingFee ||
    "error" in taxFee ||
    "error" in discountValue
  ) {
    return fail("Periksa kembali biaya tambahan.", fieldErrors);
  }

  return {
    ok: true,
    data: {
      shippingFee: shippingFee.value,
      taxFee: taxFee.value,
      discountValue: discountValue.value,
      discountType,
    },
  };
}
