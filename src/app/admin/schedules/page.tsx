"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";
import ScheduleForm from "@/components/admin/ScheduleForm";
import type { ScheduleFormData } from "@/components/admin/ScheduleForm";
import { useAdminCrud } from "@/lib/hooks/useAdminCrud";
import Modal from "@/components/ui/Modal";

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
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

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
  const loadDepartments = useCallback(async () => {
    if (!selectedHospitalId) {
      setDepartments([]);
      setSelectedDepartmentId("");
      setDoctors([]);
      setSelectedDoctorId("");
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/hospitals/${selectedHospitalId}/departments?page=1&pageSize=999`
      );
      const json = await res.json();
      if (json.code === 0) {
        setDepartments(json.data.list);
        setSelectedDepartmentId("");
        setDoctors([]);
        setSelectedDoctorId("");
      }
    } catch {}
  }, [selectedHospitalId]);

  useEffect(() => {
    startTransition(() => {
      loadDepartments();
    });
  }, [loadDepartments]);

  // Load doctors when department changes
  const loadDoctors = useCallback(async () => {
    if (!selectedDepartmentId) {
      setDoctors([]);
      setSelectedDoctorId("");
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/departments/${selectedDepartmentId}/doctors?page=1&pageSize=999`
      );
      const json = await res.json();
      if (json.code === 0) {
        setDoctors(json.data.list);
        if (json.data.list.length > 0) {
          setSelectedDoctorId(json.data.list[0].id);
        } else {
          setSelectedDoctorId("");
        }
      }
    } catch {}
  }, [selectedDepartmentId]);

  useEffect(() => {
    startTransition(() => {
      loadDoctors();
    });
  }, [loadDoctors]);

  const crud = useAdminCrud<ScheduleRecord>({
    baseUrl: selectedDoctorId
      ? `/api/admin/doctors/${selectedDoctorId}/schedules`
      : "",
    fetchDeps: [selectedDoctorId],
    buildFetchUrl: (baseUrl, page, pageSize) =>
      `${baseUrl}?page=${page}&pageSize=${pageSize}`,
    buildUpdateUrl: (_, record) => `/api/admin/schedules/${record.id}`,
    buildDeleteUrl: (_, record) => `/api/admin/schedules/${record.id}`,
  });

  const handleSave = async (data: ScheduleFormData) => {
    await crud.save(data as unknown as Record<string, unknown>);
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
    { key: "quota", title: "总号源", render: (value) => <span>{value}</span> },
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
                  crud.setPage(1);
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
                  crud.setPage(1);
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
                  crud.setPage(1);
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

        {selectedDoctorId ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">排班列表</p>
              <button
                type="button"
                onClick={crud.openCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新增排班
              </button>
            </div>

            <DataTable
              columns={columns}
              data={crud.data}
              loading={crud.loading}
              page={crud.page}
              pageSize={10}
              total={crud.total}
              onPageChange={crud.setPage}
              onEdit={crud.openEdit}
              onDelete={crud.remove}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            请先选择医院、科室和医生
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={crud.showModal} onClose={crud.closeModal} title={crud.editRecord ? "编辑排班" : "新增排班"}>
        <ScheduleForm
          doctorId={selectedDoctorId}
          initialData={
            crud.editRecord
              ? {
                  date: crud.editRecord.date,
                  timeSlot: crud.editRecord.timeSlot,
                  quota: crud.editRecord.quota,
                  type: crud.editRecord.type,
                }
              : undefined
          }
          onSave={handleSave}
          onCancel={crud.closeModal}
          saving={crud.saving}
        />
      </Modal>
    </>
  );
}
