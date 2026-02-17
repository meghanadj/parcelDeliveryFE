"use client";

import React, { useEffect, useState } from "react";
import { OrderDTO } from "../lib/apiTypes";
import { defaultClient } from "../lib/apiClient";

export default function Home() {
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    defaultClient
      .getOrders()
      .then((o) => {
        if (!mounted) return;
        setOrders(o || []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(String(e));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Orders</h1>

      {loading && <p>Loading orders…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <div>
          {orders && orders.length > 0 ? (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li key={order.id ?? Math.random()} className="border rounded p-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm text-zinc-500">Order ID</div>
                      <div className="font-medium">#{order.id ?? "—"}</div>
                    </div>
                    <div className="text-sm text-zinc-600">
                      Shipping: {order.shippingDate ?? "—"}
                    </div>
                  </div>

                  {order.parcels && order.parcels.length > 0 && (
                    <ul className="mt-3 ml-4 list-disc">
                      {order.parcels.map((p, i) => (
                        <li key={i}>
                          {p.recipientName ?? "Recipient"} — {p.weight ?? "—"} kg — ${p.value ?? "—"}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No orders found.</p>
          )}
        </div>
      )}
    </main>
  );
}
