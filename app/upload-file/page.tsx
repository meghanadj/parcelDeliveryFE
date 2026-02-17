"use client";

import React, { useState } from "react";
// ...existing code...

export default function UploadFilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/xml") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please upload a valid XML file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setSuccess(true);
        setError(null);
        setFile(null);
      } else {
        setError("Error uploading file.");
        setSuccess(false);
      }
    } catch (err) {
      setError("Error uploading file.");
      setSuccess(false);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Upload XML File</h1>
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
          {success && <p className="text-green-600 text-sm mt-1">File uploaded successfully!</p>}
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
      </form>
    </main>
  );
}
