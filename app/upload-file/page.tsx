"use client";

import React, { useState } from "react";
import Link from "next/link";
import { defaultClient } from "@/lib/apiClient";
// ...existing code...

export default function UploadFilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) {
      setFile(null);
      setError("Please choose a file.");
      return;
    }

    const nameIsXml = selectedFile.name.toLowerCase().endsWith(".xml");
    const typeIsXml = (selectedFile.type || "").toLowerCase().includes("xml");

    if (nameIsXml || typeIsXml) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please upload an .xml file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        let data: any = null;
        try {
          data = await res.json();
        } catch {}

        const order = data?.order;
        if (!order) {
          setError("Upload succeeded, but payload conversion failed.");
          setSuccess(false);
          setIsSubmitting(false);
          return;
        }

        try {
          await defaultClient.postOrder(order);
          setSuccess(true);
          setError(null);
          setFile(null);
        } catch (orderErr: any) {
          const msg = orderErr?.message ? String(orderErr.message) : "Failed to create order.";
          setError(msg);
          setSuccess(false);
        }
      } else {
        let message = "Error uploading file.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        setError(message);
        setSuccess(false);
      }
    } catch (err) {
      setError("Network or server error.");
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Upload XML File</h1>
        <Link href="/">
          <button type="button" className="px-3 py-1 rounded border">← Back to Home</button>
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Select XML file</label>
          <input
            type="file"
            accept=".xml"
            onChange={handleFileChange}
            className="mt-1 block w-full rounded border px-3 py-2"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {success && <p className="text-green-600 text-sm mt-1">Order created successfully!</p>}
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Upload"}
        </button>
      </form>
    </main>
  );
}
