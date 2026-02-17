"use client";

import { useEffect, useState } from "react";
import { defaultClient } from "@/lib/apiClient";
import type { DepartmentDTO } from "@/lib/apiTypes";
import styles from "./page.module.css";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [formData, setFormData] = useState<DepartmentDTO>({ name: "", weightLimit: 0 });

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await defaultClient.getDepartments();
      setDepartments(data);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateClick = () => {
    setEditingDeptId(null);
    setFormData({ name: "", weightLimit: 0 });
    setIsFormVisible(true);
  };

  const handleEditClick = (dept: DepartmentDTO) => {
    if (!dept.id) return;
    setEditingDeptId(dept.id);
    setFormData({ name: dept.name, weightLimit: dept.weightLimit });
    setIsFormVisible(true);
  };

  const handleCancelClick = () => {
    setIsFormVisible(false);
    setEditingDeptId(null);
    setFormData({ name: "", weightLimit: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingDeptId) {
        await defaultClient.updateDepartment(editingDeptId, formData);
      } else {
        await defaultClient.createDepartment(formData);
      }
      setIsFormVisible(false);
      fetchDepartments();
    } catch (e: any) {
      setError(e?.message || "Failed to save department");
    }
  };

  const handleInputChange = (field: keyof DepartmentDTO, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Departments</h1>

      {loading && <p className={styles.loading}>Loading departments...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isFormVisible && (
        <button className={styles.button} onClick={handleCreateClick}>
          Create Department
        </button>
      )}

      {isFormVisible && (
        <div className={styles.formContainer}>
          <h2>{editingDeptId ? "Edit Department" : "New Department"}</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input
                className={styles.input}
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Weight Limit</label>
              <input
                className={styles.input}
                type="number"
                value={formData.weightLimit || ""}
                onChange={(e) => handleInputChange("weightLimit", Number(e.target.value))}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <button type="submit" className={styles.button}>
                Save
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handleCancelClick}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && departments.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Weight Limit</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className={styles.row}>
                  <td className={styles.td}>{dept.id}</td>
                  <td className={styles.td}>{dept.name}</td>
                  <td className={styles.td}>{dept.weightLimit}</td>
                  <td className={styles.td}>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => handleEditClick(dept)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!loading && departments.length === 0 && !error && (
        <p>No departments found.</p>
      )}
    </div>
  );
}
