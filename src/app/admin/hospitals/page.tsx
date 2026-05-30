"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Standard Next.js data fetching pattern */

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import AdminHeader from "@/components/layout/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";
import HospitalForm from "@/components/admin/HospitalForm";
import type { HospitalFormData } from "@/components/admin/HospitalForm";

interface HospitalRecord {
  id: string;
  name: string;
  city: string;
  level: string;
  phone: string;
  address: string;
  description: string;
}

export default function AdminHospitalsPage() {
  const { showToast } = useToast();
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<HospitalRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals?page=${page}&pageSize=${pageSize}`);
      const json = await res.json();
      if (json.code === 0) {
        setHospitals(json.data.list);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("获取医院列表失败", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleSave = async (data: HospitalFormData) => {
    setSaving(true);
    try {
      const url = editRecord
        ? `/api/admin/hospitals/${editRecord.id}`
        : "/api/admin/hospitals";
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
        fetchHospitals();
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

  const handleDelete = async (record: HospitalRecord) => {
    if (!confirm(`确定要删除医院"${record.name}"吗？`)) return;
    try {
      const res = await fetch(`/api/admin/hospitals/${record.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.code === 0) {
        fetchHospitals();
      } else {
        showToast(json.message || "删除失败", "error");
      }
    } catch (err) {
      showToast("删除失败", "error");
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditRecord(null);
    setShowModal(true);
  };

  const openEdit = (record: HospitalRecord) => {
    setEditRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRecord(null);
  };

  const columns: Column<HospitalRecord>[] = [
    { key: "name", title: "医院名称" },
    { key: "city", title: "城市" },
    { key: "level", title: "等级" },
    { key: "phone", title: "联系电话" },
    { key: "address", title: "地址" },
  ];

  return (
    <>
      <AdminHeader title="医院管理" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">管理所有医院信息</p>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新增医院
          </button>
        </div>

        <DataTable
          columns={columns}
          data={hospitals}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editRecord ? "编辑医院" : "新增医院"}
              </h3>
            </div>
            <div className="px-6 py-4">
              <HospitalForm
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
