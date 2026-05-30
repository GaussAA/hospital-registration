"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Standard Next.js data fetching pattern */

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import AdminHeader from "@/components/layout/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import type { Column, ColumnValue } from "@/components/admin/DataTable";
import DepartmentForm from "@/components/admin/DepartmentForm";
import type { DepartmentFormData } from "@/components/admin/DepartmentForm";

interface HospitalOption {
  id: string;
  name: string;
}

interface DepartmentRecord {
  id: string;
  name: string;
  description: string;
  hospitalId: string;
}

export default function AdminDepartmentsPage() {
  const { showToast } = useToast();
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");

  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<DepartmentRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Load hospital list
  useEffect(() => {
    fetch("/api/admin/hospitals?page=1&pageSize=999")
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 0) {
          setHospitals(json.data.list);
          if (json.data.list.length > 0) {
            setSelectedHospitalId(json.data.list[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const fetchDepartments = useCallback(async () => {
    if (!selectedHospitalId) {
      setDepartments([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/hospitals/${selectedHospitalId}/departments?page=${page}&pageSize=${pageSize}`
      );
      const json = await res.json();
      if (json.code === 0) {
        setDepartments(json.data.list);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("获取科室列表失败", err);
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalId, page]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSave = async (data: DepartmentFormData) => {
    setSaving(true);
    try {
      const url = editRecord
        ? `/api/admin/departments/${editRecord.id}`
        : `/api/admin/hospitals/${selectedHospitalId}/departments`;
      const method = editRecord ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.code === 0) {
        setShowModal(false);
        setEditRecord(null);
        fetchDepartments();
      } else {
        showToast(json.message || "操作失败", "error");
      }
    } catch (err) {
      showToast("操作失败", "error");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: DepartmentRecord) => {
    if (!confirm(`确定要删除科室"${record.name}"吗？`)) return;
    try {
      const res = await fetch(`/api/admin/departments/${record.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.code === 0) {
        fetchDepartments();
      } else {
        showToast(json.message || "删除失败", "error");
      }
    } catch (err) {
      showToast("删除失败", "error");
      console.error(err);
    }
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHospitalId(e.target.value);
    setPage(1);
  };

  const openCreate = () => {
    setEditRecord(null);
    setShowModal(true);
  };

  const openEdit = (record: DepartmentRecord) => {
    setEditRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRecord(null);
  };

  const columns: Column<DepartmentRecord>[] = [
    { key: "name", title: "科室名称" },
    {
      key: "description",
      title: "描述",
      render: (value) => (
        <span className="text-gray-400 max-w-xs truncate block">
          {value || "暂无描述"}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="科室管理" />
      <div className="p-6">
        {/* Hospital Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择医院
          </label>
          <select
            value={selectedHospitalId}
            onChange={handleHospitalChange}
            className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- 请选择医院 --</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {selectedHospitalId && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                {hospitals.find((h) => h.id === selectedHospitalId)?.name}
                {" "}- 科室列表
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新增科室
              </button>
            </div>

            <DataTable
              columns={columns}
              data={departments}
              loading={loading}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </>
        )}

        {!selectedHospitalId && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            请先选择医院
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedHospitalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editRecord ? "编辑科室" : "新增科室"}
              </h3>
            </div>
            <div className="px-6 py-4">
              <DepartmentForm
                hospitalId={selectedHospitalId}
                initialData={editRecord ?? undefined}
                onSave={handleSave}
                onCancel={closeModal}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
