"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Standard Next.js data fetching pattern */

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import AdminHeader from "@/components/layout/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";
import DoctorForm from "@/components/admin/DoctorForm";
import type { DoctorFormData } from "@/components/admin/DoctorForm";

interface HospitalOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

interface DoctorRecord {
  id: string;
  name: string;
  title: string;
  specialty: string;
  introduction: string;
  departmentId: string;
  hospitalId: string;
}

export default function AdminDoctorsPage() {
  const { showToast } = useToast();
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<DoctorRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Load hospitals
  useEffect(() => {
    fetch("/api/admin/hospitals?page=1&pageSize=999")
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 0) {
          setHospitals(json.data.list);
        }
      })
      .catch(console.error);
  }, []);

  // Load departments when hospital changes
  useEffect(() => {
    if (!selectedHospitalId) {
      setDepartments([]);
      setSelectedDepartmentId("");
      return;
    }
    fetch(
      `/api/admin/hospitals/${selectedHospitalId}/departments?page=1&pageSize=999`
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 0) {
          setDepartments(json.data.list);
          if (json.data.list.length > 0) {
            setSelectedDepartmentId(json.data.list[0].id);
          } else {
            setSelectedDepartmentId("");
          }
        }
      })
      .catch(console.error);
  }, [selectedHospitalId]);

  const fetchDoctors = useCallback(async () => {
    if (!selectedDepartmentId) {
      setDoctors([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/departments/${selectedDepartmentId}/doctors?page=${page}&pageSize=${pageSize}`
      );
      const json = await res.json();
      if (json.code === 0) {
        setDoctors(json.data.list);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("获取医生列表失败", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartmentId, page]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSave = async (data: DoctorFormData) => {
    setSaving(true);
    try {
      const url = editRecord
        ? `/api/admin/doctors/${editRecord.id}`
        : `/api/admin/departments/${selectedDepartmentId}/doctors`;
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
        fetchDoctors();
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

  const handleDelete = async (record: DoctorRecord) => {
    if (!confirm(`确定要删除医生"${record.name}"吗？`)) return;
    try {
      const res = await fetch(`/api/admin/doctors/${record.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.code === 0) {
        fetchDoctors();
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

  const openEdit = (record: DoctorRecord) => {
    setEditRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRecord(null);
  };

  const columns: Column<DoctorRecord>[] = [
    { key: "name", title: "姓名" },
    { key: "title", title: "职称" },
    { key: "specialty", title: "擅长领域" },
  ];

  return (
    <>
      <AdminHeader title="医生管理" />
      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择医院
              </label>
              <select
                value={selectedHospitalId}
                onChange={(e) => {
                  setSelectedHospitalId(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- 请选择医院 --</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择科室
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => {
                  setSelectedDepartmentId(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedHospitalId}
              >
                <option value="">-- 请选择科室 --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedDepartmentId && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">医生列表</p>
              <button
                type="button"
                onClick={openCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新增医生
              </button>
            </div>

            <DataTable
              columns={columns}
              data={doctors}
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

        {!selectedDepartmentId && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            请先选择医院和科室
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedDepartmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editRecord ? "编辑医生" : "新增医生"}
              </h3>
            </div>
            <div className="px-6 py-4">
              <DoctorForm
                departmentId={selectedDepartmentId}
                initialData={
                  editRecord
                    ? {
                        name: editRecord.name,
                        title: editRecord.title,
                        specialty: editRecord.specialty,
                        introduction: editRecord.introduction,
                        departmentId: editRecord.departmentId,
                      }
                    : undefined
                }
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
