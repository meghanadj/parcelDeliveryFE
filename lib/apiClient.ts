import {
  ApprovalDTO,
  OrderDTO,
  ParcelDTO,
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
    // Try to parse JSON, but some endpoints may return empty body
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
      // skip $id and $ref metadata
      if (k === '$id' || k === '$ref') continue;
      out[k] = this.normalizeJson(input[k]);
    }
    return out;
  }

  // Orders
  getOrders(): Promise<OrderDTO[]> {
    return this.request<OrderDTO[]>('/api/Orders');
  }

  getOrderById(id: number): Promise<OrderDTO> {
    return this.request<OrderDTO>(`/api/Orders/${encodeURIComponent(String(id))}`);
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

// Default client using NEXT_PUBLIC_API_BASE_URL if available
// Determine base URL in order of precedence:
// 1. `NEXT_PUBLIC_API_BASE_URL` (build-time env)
// 2. In-browser fallback to the running backend at port 5084
// 3. Empty string (relative)
const resolvedBaseUrl =
  typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5084`
    : '';

export const defaultClient = new ApiClient(resolvedBaseUrl);

export default ApiClient;
