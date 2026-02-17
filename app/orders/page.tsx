"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { defaultClient } from "@/lib/apiClient";
import type { OrderDTO } from "@/lib/apiTypes";
import styles from "./page.module.css";

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
    <div className={styles.container}>
      <h1 className={styles.title}>Orders</h1>

      {loading && <p className={styles.loading}>Loading orders…</p>}
      {error && (
        <p className={styles.error}>Error: {error}</p>
      )}

      {!loading && !error && (
        <div className={styles.content}>
          {orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>Order #</th>
                  <th className={styles.th}>Shipping Date</th>
                  <th className={styles.th}>Parcels</th>
                  <th className={styles.th}>Actions</th>
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
                      <td className={styles.td}>{id ?? "—"}</td>
                      <td className={styles.td}>{o.orderNumber ?? "—"}</td>
                      <td className={styles.td}>{shippingDate}</td>
                      <td className={styles.td}>{parcelsCount}</td>
                      <td className={styles.td}>
                        {typeof id === "number" ? (
                          <Link
                            href={`/orders/${encodeURIComponent(String(id))}`}
                            className={styles.buttonLink}
                          >
                            View Parcels
                          </Link>
                        ) : (
                          <span className={styles.unavailable}>Unavailable</span>
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
