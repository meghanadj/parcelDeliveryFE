"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { defaultClient } from "@/lib/apiClient";
import type { OrderDTO, ParcelDTO, Address, DepartmentDTO } from "@/lib/apiTypes";
import styles from "./page.module.css";
import Link from "next/link";

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
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
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
        const [o, depts] = await Promise.all([
          defaultClient.getOrderById(orderId),
          defaultClient.getDepartments()
        ]);
        if (cancelled) return;
        setOrder(o ?? null);
        const p = (o?.parcels ?? []) as ParcelDTO[];
        setParcels(Array.isArray(p) ? p : []);
        setDepartments(Array.isArray(depts) ? depts : []);
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

  const insuranceDeptId = departments.find(d => d.name?.toLowerCase().includes("insurance"))?.id;

  return (
    <div className={styles.container}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Order Parcels</h1>
          {orderId != null && (
            <p className={styles.orderId}>Order ID: {orderId}</p>
          )}
        </div>

        <Link href="/">
          <button type="button" className="px-3 py-1 rounded border">
            ← Back to Home
          </button>
        </Link>
      </div>

      {loading && <p className={styles.loading}>Loading parcels…</p>}
      {error && (
        <p className={styles.error}>Error: {error}</p>
      )}
      {!loading && !error && (
        <div className={styles.content}>
          <div className={styles.filterContainer}>
            <button
              className={`${styles.filterBtn} ${departmentFilter === "all" ? styles.filterBtnActive : styles.filterBtnInactive}`}
              onClick={() => setDepartmentFilter("all")}
            >
              All
            </button>
            {departments.map((dept) => {
              const k = dept.id ?? -1;
              return (
                <button
                  key={k}
                  className={`${styles.filterBtn} ${departmentFilter === k ? styles.filterBtnActive : styles.filterBtnInactive}`}
                  onClick={() => setDepartmentFilter(k)}
                >
                  {dept.name ?? `Dept ${k}`}
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
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>#</th>
                  <th className={styles.th}>Weight</th>
                  <th className={styles.th}>Value</th>
                  <th className={styles.th}>Department</th>
                  <th className={styles.th}>Recipient</th>
                  <th className={styles.th}>Address</th>
                  {departmentFilter !== "all" && departmentFilter === insuranceDeptId && <th className={styles.th}>Actions</th>}
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
                      <td className={styles.td}>{idx + 1}</td>
                      <td className={styles.td}>{p.weight ?? "—"}</td>
                      <td className={styles.td}>{p.value ?? "—"}</td>
                      <td className={styles.td}>
                        {p.department != null
                          ? (departments.find(d => d.id === p.department)?.name ?? p.department)
                          : "—"}
                      </td>
                      <td className={styles.td}>{p.recipientName ?? "—"}</td>
                      <td className={styles.td}>
                        {formatAddress(p.recipientAddress)}
                      </td>
                      {departmentFilter !== "all" && departmentFilter === insuranceDeptId && (
                        <td className={styles.td}>
                          {!p.approvalStatus ? (
                            <div className={styles.actions}>
                              <button
                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                onClick={() => p.id && handleApprove(p.id)}
                              >
                                Approve
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                onClick={() => p.id && handleReject(p.id)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span
                              className={
                                p.approvalStatus === 1
                                  ? styles.statusApproved
                                  : styles.statusRejected
                              }
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

function formatAddress(addr?: Address) {
  if (!addr) return "—";
  const parts = [addr.street, addr.houseNo, addr.city].filter(Boolean);
  const base = parts.join(", ");
  return base ? `${base} (${addr.pincode})` : String(addr.pincode ?? "—");
}
