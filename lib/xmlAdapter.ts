import { OrderDTO, ParcelDTO, Address } from './apiTypes';

export interface XmlContainer {
  Container?: {
    Id?: string | number;
    ShippingDate?: string;
    parcels?: {
      Parcel?: any | any[];
    };
  };
}

function ensureArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function parseIntSafe(val: any): number | undefined {
  if (val == null) return undefined;
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseFloatSafe(val: any): number | undefined {
  if (val == null) return undefined;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : undefined;
}

function extractPincode(postalCode?: string): number | undefined {
  if (!postalCode) return undefined;
  const digits = String(postalCode).match(/\d+/g)?.join('');
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : undefined;
}

// Extracts leading numeric digits from mixed values (e.g., "ORD-123-A" -> 123)
function extractInteger(val: any): number | undefined {
  if (val == null) return undefined;
  const digits = String(val).match(/\d+/g)?.join('');
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : undefined;
}

function toStringOrNull(val: any): string | null | undefined {
  if (val == null) return undefined;
  const s = String(val).trim();
  return s.length ? s : null;
}

export function mapParsedXmlToOrderDTO(obj: any): OrderDTO {
  const container = obj?.Container ?? obj;
  const orderNumber = extractInteger(container?.Id);
  const shippingDate = container?.ShippingDate ? String(container.ShippingDate) : undefined;

  const parcelsRaw = container?.parcels?.Parcel ?? container?.parcels ?? [];
  const parcelList = ensureArray(parcelsRaw);

  const parcels: ParcelDTO[] = parcelList.map((p: any) => {
    const receipient = p?.Receipient ?? p?.Recipient ?? {};
    const name = toStringOrNull(receipient?.Name ?? receipient?.name);
    const address = receipient?.Address ?? receipient?.address ?? {};

    const street = toStringOrNull(address?.Street ?? address?.street);
    const houseNo = toStringOrNull(address?.HouseNumber ?? address?.houseNo);
    const cityName = toStringOrNull(address?.City ?? address?.city);
    const postalCode = address?.PostalCode ?? address?.pincode ?? undefined;
    const pincode = extractPincode(postalCode) ?? 0;

    const recipientAddress: Address = {
      street: street ?? null,
      houseNo: houseNo ?? null,
      city: cityName ?? null,
      pincode,
    };

    const weight = parseFloatSafe(p?.Weight ?? p?.weight);
    const value = parseFloatSafe(p?.Value ?? p?.value);
    const department = parseIntSafe(p?.Department ?? p?.department) ?? 0;

    const out: ParcelDTO = {
      recipientName: name ?? null,
      recipientAddress,
      weight,
      value,
      department,
    };
    return out;
  });

  const order: OrderDTO = {
    // Map uploaded file `Id` (possibly alphanumeric) to numeric orderNumber
    orderNumber: orderNumber,
    shippingDate,
    parcels,
  };
  return order;
}
