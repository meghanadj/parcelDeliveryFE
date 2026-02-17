"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useParams } from "next/navigation";
import { defaultClient } from "@/lib/apiClient";
import type { OrderDTO, ParcelDTO, Address } from "@/lib/apiTypes";

const DEPARTMENT_NAMES: Record<number, string> = {
  0: "General",
  1: "Mail",
  2: "Heavy",
  3: "Insurance",
};

export default function OrderParcelsPage() {
  const params = useParams();
  const idParam = params?.id as string | undefined;
  const orderId = useMemo(() => {
    if (!idParam) return undefined;
    const n = Number(idParam);
    return Number.isFinite(n) ? n : undefined;
  }, [idParam]);

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [parcels, setParcels] = useState<ParcelDTO[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<number | "all">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (id?: string) => {
    if (!id) return;
    try {
      await defaultClient.patchParcelApproval(id, { newStatus: 1 }); // 1 = Approved
      setParcels((prev) =>
        prev.map((p) => (p.id === id ? { ...p, approvalStatus: 1 } : p))
      );
    } catch (e) {
      alert("Failed to approve parcel: " + e);
    }
  };

  const handleReject = async (id?: string) => {
    if (!id) return;
    try {
      await defaultClient.patchParcelApproval(id, { newStatus: 2 }); // 2 = Rejected
      setParcels((prev) =>
        prev.map((p) => (p.id === id ? { ...p, approvalStatus: 2 } : p))
      );
    } catch (e) {
      alert("Failed to reject parcel: " + e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!orderId) {
        setError("Invalid order id");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const o = await defaultClient.getOrderById(orderId);
        if (cancelled) return;
        setOrder(o ?? null);
        const p = (o?.parcels ?? []) as ParcelDTO[];
        setParcels(Array.isArray(p) ? p : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(String(e?.message ?? e ?? "Failed to load order"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div style={{ padding: "1rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Order Parcels</h1>
      {orderId != null && (
        <p style={{ marginTop: 4, color: "#555" }}>Order ID: {orderId}</p>
      )}

      {loading && <p style={{ marginTop: 12 }}>Loading parcels…</p>}
      {error && (
        <p style={{ marginTop: 12, color: "#b00020" }}>Error: {error}</p>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16, display: "flex", gap: "8px" }}>
            <button
              style={{
                ...filterBtnStyle,
                background: departmentFilter === "all" ? "#000" : "#f0f0f0",
                color: departmentFilter === "all" ? "#fff" : "#000",
              }}
              onClick={() => setDepartmentFilter("all")}
            >
              All
            </button>
            {Object.entries(DEPARTMENT_NAMES).map(([key, label]) => {
              const k = Number(key);
              return (
                <button
                  key={k}
                  style={{
                    ...filterBtnStyle,
                    background: departmentFilter === k ? "#000" : "#f0f0f0",
                    color: departmentFilter === k ? "#fff" : "#000",
                  }}
                  onClick={() => setDepartmentFilter(k)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {parcels
            .filter(
              (p) =>
                departmentFilter === "all" || p.department === departmentFilter
            )
            .length === 0 ? (
            <p>No parcels found for this filter.</p>
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
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Weight</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Recipient</th>
                  <th style={thStyle}>Address</th>
                  {departmentFilter === 3 && <th style={thStyle}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {parcels
                  .filter(
                    (p) =>
                      departmentFilter === "all" ||
                      p.department === departmentFilter
                  )
                  .map((p, idx) => (
                    <tr key={idx}>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={tdStyle}>{p.weight ?? "—"}</td>
                      <td style={tdStyle}>{p.value ?? "—"}</td>
                      <td style={tdStyle}>
                        {p.department != null
                          ? DEPARTMENT_NAMES[p.department] ?? p.department
                          : "—"}
                      </td>
                      <td style={tdStyle}>{p.recipientName ?? "—"}</td>
                      <td style={tdStyle}>
                        {formatAddress(p.recipientAddress)}
                      </td>
                      {departmentFilter === 3 && (
                        <td style={tdStyle}>
                          {!p.approvalStatus || p.approvalStatus === 0 ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                style={{
                                  ...actionBtnStyle,
                                  background: "#4caf50",
                                  color: "#fff",
                                }}
                                onClick={() => p.id && handleApprove(p.id)}
                              >
                                Approve
                              </button>
                              <button
                                style={{
                                  ...actionBtnStyle,
                                  background: "#f44336",
                                  color: "#fff",
                                }}
                                onClick={() => p.id && handleReject(p.id)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                color:
                                  p.approvalStatus === 1 ? "#4caf50" : "#f44336",
                                fontWeight: 500,
                              }}
                            >
                              {p.approvalStatus === 1 ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
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

function formatAddress(addr?: Address) {
  if (!addr) return "—";
  const parts = [addr.street, addr.houseNo, addr.city].filter(Boolean);
  const base = parts.join(", ");
  return base ? `${base} (${addr.pincode})` : String(addr.pincode ?? "—");
}

const filterBtnStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.9rem",
};

const actionBtnStyle: CSSProperties = {
  padding: "4px 8px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.8rem",
};
