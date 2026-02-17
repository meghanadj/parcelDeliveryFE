"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { defaultClient } from "@/lib/apiClient";
import type { OrderDTO } from "@/lib/apiTypes";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const list = await defaultClient.getOrders();
        if (cancelled) return;
        setOrders(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(String(e?.message ?? e ?? "Failed to load orders"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: "1rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Orders</h1>

      {loading && <p style={{ marginTop: 12 }}>Loading orders…</p>}
      {error && (
        <p style={{ marginTop: 12, color: "#b00020" }}>Error: {error}</p>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 16 }}>
          {orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #ddd",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Order #</th>
                  <th style={thStyle}>Shipping Date</th>
                  <th style={thStyle}>Parcels</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const id = o.id;
                  const parcelsCount = Array.isArray(o.parcels) ? o.parcels.length : 0;
                  const shippingDate = o.shippingDate
                    ? new Date(o.shippingDate).toLocaleString()
                    : "—";
                  return (
                    <tr key={String(id ?? Math.random())}>
                      <td style={tdStyle}>{id ?? "—"}</td>
                      <td style={tdStyle}>{o.orderNumber ?? "—"}</td>
                      <td style={tdStyle}>{shippingDate}</td>
                      <td style={tdStyle}>{parcelsCount}</td>
                      <td style={tdStyle}>
                        {typeof id === "number" ? (
                          <Link
                            href={`/orders/${encodeURIComponent(String(id))}`}
                            style={buttonLinkStyle}
                          >
                            View Parcels
                          </Link>
                        ) : (
                          <span style={{ color: "#888" }}>Unavailable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px",
  borderBottom: "1px solid #ddd",
  background: "#f7f7f7",
};

const tdStyle: CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #eee",
};

const buttonLinkStyle: CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#fff",
  textDecoration: "none",
  color: "#333",
};
