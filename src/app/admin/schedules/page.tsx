"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Standard Next.js data fetching pattern */

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import AdminHeader from "@/components/layout/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";
import ScheduleForm from "@/components/admin/ScheduleForm";
import type { ScheduleFormData } from "@/components/admin/ScheduleForm";

interface HospitalOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

interface DoctorOption {
  id: string;
  name: string;
  title: string;
}

interface ScheduleRecord {
  id: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  quota: number;
  bookedCount: number;
  type: string;
}

const timeSlotLabels: Record<string, string> = {
  am: "上午",
  pm: "下午",
  evening: "晚间",
};

const typeLabels: Record<string, string> = {
  normal: "普通号",
  expert: "专家号",
  special: "特需号",
};

export default function AdminSchedulesPage() {
  const { showToast } = useToast();
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<ScheduleRecord | null>(null);
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
      setDoctors([]);
      setSelectedDoctorId("");
      return;
    }
    fetch(
      `/api/admin/hospitals/${selectedHospitalId}/departments?page=1&pageSize=999`
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 0) {
          setDepartments(json.data.list);
          setSelectedDepartmentId("");
          setDoctors([]);
          setSelectedDoctorId("");
        }
      })
      .catch(console.error);
  }, [selectedHospitalId]);

  // Load doctors when department changes
  useEffect(() => {
    if (!selectedDepartmentId) {
      setDoctors([]);
      setSelectedDoctorId("");
      return;
    }
    fetch(
      `/api/admin/departments/${selectedDepartmentId}/doctors?page=1&pageSize=999`
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 0) {
          setDoctors(json.data.list);
          if (json.data.list.length > 0) {
            setSelectedDoctorId(json.data.list[0].id);
          } else {
            setSelectedDoctorId("");
          }
        }
      })
      .catch(console.error);
  }, [selectedDepartmentId]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedDoctorId) {
      setSchedules([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/doctors/${selectedDoctorId}/schedules?page=${page}&pageSize=${pageSize}`
      );
      const json = await res.json();
      if (json.code === 0) {
        setSchedules(json.data.list);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("获取排班列表失败", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, page]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSave = async (data: ScheduleFormData) => {
    setSaving(true);
    try {
      const url = editRecord
        ? `/api/admin/schedules/${editRecord.id}`
        : `/api/admin/doctors/${selectedDoctorId}/schedules`;
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
        fetchSchedules();
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

  const handleDelete = async (record: ScheduleRecord) => {
    if (!confirm("确定要删除该排班记录吗？")) return;
    try {
      const res = await fetch(`/api/admin/schedules/${record.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.code === 0) {
        fetchSchedules();
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

  const openEdit = (record: ScheduleRecord) => {
    setEditRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditRecord(null);
  };

  const columns: Column<ScheduleRecord>[] = [
    { key: "date", title: "日期" },
    {
      key: "timeSlot",
      title: "时段",
      render: (value) => timeSlotLabels[value as string] || value,
    },
    {
      key: "type",
      title: "号源类型",
      render: (value) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            value === "expert"
              ? "bg-yellow-100 text-yellow-800"
              : value === "special"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {typeLabels[value as string] || value}
        </span>
      ),
    },
    {
      key: "quota",
      title: "总号源",
      render: (value) => <span>{value}</span>,
    },
    {
      key: "bookedCount",
      title: "已预约",
      render: (value) => <span>{value}</span>,
    },
    {
      key: "quota",
      title: "剩余",
      render: (value, record: ScheduleRecord) => {
        const remaining = (value as number) - record.bookedCount;
        return (
          <span
            className={
              remaining <= 0
                ? "text-red-600 font-medium"
                : remaining <= 5
                ? "text-yellow-600 font-medium"
                : "text-green-600"
            }
          >
            {remaining}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <AdminHeader title="排班管理" />
      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择医生
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedDepartmentId}
              >
                <option value="">-- 请选择医生 --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.title})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedDoctorId && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">排班列表</p>
              <button
                type="button"
                onClick={openCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新增排班
              </button>
            </div>

            <DataTable
              columns={columns}
              data={schedules}
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

        {!selectedDoctorId && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            请先选择医院、科室和医生
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedDoctorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editRecord ? "编辑排班" : "新增排班"}
              </h3>
            </div>
            <div className="px-6 py-4">
              <ScheduleForm
                doctorId={selectedDoctorId}
                initialData={
                  editRecord
                    ? {
                        date: editRecord.date,
                        timeSlot: editRecord.timeSlot,
                        quota: editRecord.quota,
                        type: editRecord.type,
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
