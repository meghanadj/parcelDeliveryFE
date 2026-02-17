// Generated TypeScript types from OpenAPI payload.json

export type ApprovalStatus = 0 | 1 | 2;

export interface ApprovalDTO {
  newStatus?: ApprovalStatus;
}

export interface Address {
  street?: string | null;
  houseNo?: string | null;
  city?: string | null;
  pincode: number;
}

export interface ParcelDTO {
  id?: string;
  weight?: number;
  value?: number;
  recipientName?: string | null;
  recipientAddress: Address;
  department?: number;
  approvalStatus?: ApprovalStatus;
}

export interface OrderDTO {
  id?: number;
  orderNumber?: number;
  shippingDate?: string;
  parcels?: ParcelDTO[] | null;
}
