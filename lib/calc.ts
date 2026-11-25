import type {
  BillSummary,
  DiscountType,
  ExtraFees,
  Item,
  Participant,
  ParticipantBill,
} from "./types";

function toNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Membagi `total` (Rupiah bulat) ke beberapa bobot secara proporsional.
 * Memakai metode sisa terbesar (largest remainder) supaya jumlah hasil
 * pembagian selalu sama persis dengan `total`.
 */
function allocate(total: number, weights: number[]): number[] {
  const count = weights.length;
  if (count === 0) return [];

  const safeTotal = Math.max(0, Math.round(total));
  const cleanWeights = weights.map((weight) => toNonNegative(weight));
  const sumWeights = cleanWeights.reduce((sum, weight) => sum + weight, 0);

  // Jika semua bobot nol (mis. belum ada item), biaya dibagi rata.
  const effectiveWeights = sumWeights > 0 ? cleanWeights : cleanWeights.map(() => 1);
  const divisor = sumWeights > 0 ? sumWeights : count;

  const exact = effectiveWeights.map((weight) => (safeTotal * weight) / divisor);
  const result = exact.map(Math.floor);

  let remainder = safeTotal - result.reduce((sum, value) => sum + value, 0);

  // Beri tambahan 1 Rupiah ke peserta dengan pecahan terbesar lebih dulu.
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    result[order[i].index] += 1;
    remainder -= 1;
  }

  return result;
}

function normalizeFees(fees: ExtraFees): {
  shippingFee: number;
  taxFee: number;
  discountType: DiscountType;
  discountValue: number;
} {
  return {
    shippingFee: Math.round(toNonNegative(fees.shippingFee)),
    taxFee: Math.round(toNonNegative(fees.taxFee)),
    discountType: fees.discountType === "percent" ? "percent" : "amount",
    discountValue: toNonNegative(fees.discountValue),
  };
}

/**
 * Menghitung pembagian tagihan proporsional per peserta.
 *
 * Rumus inti:
 * - subtotal item = price * qty, dibagi rata ke peserta di `sharedBy`
 * - subtotal peserta = jumlah porsi item yang ditanggungnya
 * - diskon persen = total subtotal * (discountValue / 100)
 * - diskon nominal = min(discountValue, total subtotal)
 * - ongkir, pajak, dan diskon dialokasikan sebanding rasio
 *   (subtotal peserta / total subtotal)
 * - total peserta = subtotal - diskon + pajak + ongkir
 */
export function calculateSplit(
  participants: Participant[],
  items: Item[],
  fees: ExtraFees,
): BillSummary {
  const participantIds = new Set(participants.map((participant) => participant.id));
  const subtotalById = new Map<number, number>(
    participants.map((participant) => [participant.id, 0]),
  );
  const unassignedItemIds: number[] = [];

  for (const item of items) {
    const itemSubtotal = toNonNegative(item.price) * toNonNegative(item.qty);

    // Hanya ID peserta yang valid dan unik yang boleh menanggung item.
    const sharers = Array.from(new Set(item.sharedBy ?? [])).filter((id) =>
      participantIds.has(id),
    );

    if (itemSubtotal <= 0) continue;

    if (sharers.length === 0) {
      // Item tanpa pembagi valid tidak bisa dialokasikan; dicatat untuk validasi UI.
      unassignedItemIds.push(item.id);
      continue;
    }

    const share = itemSubtotal / sharers.length;
    for (const id of sharers) {
      subtotalById.set(id, (subtotalById.get(id) ?? 0) + share);
    }
  }

  const rawSubtotals = participants.map((participant) => subtotalById.get(participant.id) ?? 0);
  const totalSubtotal = Math.round(rawSubtotals.reduce((sum, value) => sum + value, 0));

  const { shippingFee, taxFee, discountType, discountValue } = normalizeFees(fees);

  // Diskon tidak boleh melebihi subtotal agar total peserta tidak negatif.
  const rawDiscount =
    discountType === "percent" ? totalSubtotal * (discountValue / 100) : discountValue;
  const discountAmount = Math.min(Math.round(toNonNegative(rawDiscount)), totalSubtotal);

  // Setiap komponen dibulatkan per peserta dan dipastikan jumlahnya tetap pas.
  const subtotals = allocate(totalSubtotal, rawSubtotals);
  const discounts = allocate(discountAmount, rawSubtotals);
  const shippingShares = allocate(shippingFee, rawSubtotals);
  const taxShares = allocate(taxFee, rawSubtotals);

  const bills: ParticipantBill[] = participants.map((participant, index) => ({
    participantId: participant.id,
    name: participant.name,
    subtotal: subtotals[index],
    discount: discounts[index],
    tax: taxShares[index],
    shipping: shippingShares[index],
    total: subtotals[index] - discounts[index] + taxShares[index] + shippingShares[index],
  }));

  return {
    participants: bills,
    totalSubtotal,
    discountAmount,
    totalShipping: shippingFee,
    totalTax: taxFee,
    grandTotal: bills.reduce((sum, bill) => sum + bill.total, 0),
    unassignedItemIds,
  };
}
