import {
  ApprovalDTO,
  OrderDTO,
  ParcelDTO,
  DepartmentDTO,
} from './apiTypes';

export class ApiClient {
  constructor(private baseUrl = '') {}

  private url(path: string) {
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(this.url(path), init);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Request failed ${res.status} ${res.statusText}: ${text}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const raw = await res.json();
      const normalized = this.normalizeJson(raw);
      return normalized as T;
    }
    // @ts-ignore
    return undefined;
  }

  private normalizeJson(input: any): any {
    if (input == null) return input;
    if (Array.isArray(input)) return input.map((v) => this.normalizeJson(v));
    if (typeof input !== 'object') return input;

    if ('$values' in input && Array.isArray(input.$values)) {
      return this.normalizeJson(input.$values);
    }

    const out: Record<string, any> = {};
    for (const k of Object.keys(input)) {
      if (k === '$id' || k === '$ref') continue;
      out[k] = this.normalizeJson(input[k]);
    }
    return out;
  }

  // Orders
  async getOrders(): Promise<OrderDTO[]> {
    const raw = await this.request<any[]>('/api/Orders');
    return Array.isArray(raw) ? raw.map(o => this.transformOrder(o)) : [];
  }

  async getOrderById(id: number): Promise<OrderDTO> {
    const raw = await this.request<any>(`/api/Orders/${encodeURIComponent(String(id))}`);
    return this.transformOrder(raw);
  }

  private transformOrder(order: any): any {
    if (!order) return order;
    const parcels = Array.isArray(order.parcels) 
      ? order.parcels.map((p: any) => this.transformParcel(p))
      : [];
    return { ...order, parcels };
  }

  private transformParcel(parcel: any): any {
    if (!parcel) return parcel;

    let { recipientName, recipientAddress, weight, value, department } = parcel;

    // Normalize department object to ID
    if (department && typeof department === 'object' && 'id' in department) {
      department = department.id;
    }

    // Map nested recipient object if present
    const r = parcel.recipient;
    if (r) {
      if (!recipientName) recipientName = r.name;
      
      // Parse addressJson string if recipientAddress is missing/incomplete
      if (!recipientAddress && typeof r.addressJson === 'string') {
        try {
          const parsed = JSON.parse(r.addressJson);
          recipientAddress = {
            street: parsed.Street,
            houseNo: parsed.HouseNo,
            city: parsed.City,
            pincode: parsed.Pincode,
          };
        } catch { /* ignore */ }
      }
    }

    return {
      ...parcel,
      recipientName,
      recipientAddress,
      department: department ?? 0
    };
  }

  async getDepartments(): Promise<DepartmentDTO[]> {
    const raw = await this.request<any[]>('/api/Department');
    return Array.isArray(raw) ? raw : [];
  }

  async postOrder(order: OrderDTO): Promise<void> {
    try {
      await this.request<void>('/api/Orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (e: any) {
      const msg = String(e?.message || '');
      // Fallback: some servers require a `{ request: OrderDTO }` envelope
      if (msg.includes('request field is required')) {
        await this.request<void>('/api/Orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request: order }),
        });
        return;
      }
      throw e;
    }
  }

  // Parcels
  getParcels(): Promise<ParcelDTO[]> {
    return this.request<ParcelDTO[]>('/api/Parcels');
  }

  async patchParcelApproval(parcelId: string, body: ApprovalDTO): Promise<void> {
    await this.request<void>(`/api/Parcels/${encodeURIComponent(parcelId)}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}


const resolvedBaseUrl =
  typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5084`
    : '';

export const defaultClient = new ApiClient(resolvedBaseUrl);

export default ApiClient;
