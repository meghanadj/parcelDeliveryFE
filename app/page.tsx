"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { OrderDTO } from "../lib/apiTypes";
import { defaultClient } from "../lib/apiClient";

export default function Home() {
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredOrders =
    orders?.filter((order) => {
      if (!searchQuery) return true;
      const str = JSON.stringify(order).toLowerCase();
      return str.includes(searchQuery.toLowerCase());
    }) ?? [];

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link href="/upload-file">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Upload XML File</button>
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <p>Loading orders…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <div>
          {filteredOrders.length > 0 ? (
            <ul className="space-y-4">
              {filteredOrders.map((order, index) => (
                <li key={`${order.id ?? "order"}-${index}`} className="border rounded p-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm text-zinc-500">Order Number</div>
                      <div className="font-medium">#{(order as any).orderNumber ?? order.id ?? "—"}</div>
                    </div>
                    <div className="text-sm text-zinc-600">
                      Shipping: {order.shippingDate ?? "—"}
                      {order.id && (
                        <Link href={`/orders/${order.id}`} className="ml-4 text-blue-600 hover:underline">
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* {order.parcels && order.parcels.length > 0 && (
                    <ul className="mt-3 ml-4 list-disc">
                      {order.parcels.map((p, i) => (
                        <li key={i}>
                          {p.recipientName ?? "Reciπpient"} — {p.weight ?? "—"} kg — ${p.value ?? "—"} — Dept {(p as any)?.department ?? "—"}
                        </li>
                      ))}
                    </ul>
                  )} */}
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
