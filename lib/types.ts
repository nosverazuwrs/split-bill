export type DiscountType = "amount" | "percent";

export interface Participant {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  name: string;
  price: number;
  qty: number;
  sharedBy: number[];
}

export interface ExtraFees {
  shippingFee: number;
  discountType: DiscountType;
  discountValue: number;
  taxFee: number;
}

export interface ParticipantBill {
  participantId: number;
  name: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface BillSummary {
  participants: ParticipantBill[];
  totalSubtotal: number;
  discountAmount: number;
  totalShipping: number;
  totalTax: number;
  grandTotal: number;
  unassignedItemIds: number[];
}
