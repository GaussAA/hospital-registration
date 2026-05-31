"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import type { Column } from "@/components/admin/DataTable";
import DoctorForm from "@/components/admin/DoctorForm";
import type { DoctorFormData } from "@/components/admin/DoctorForm";
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
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

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

  const crud = useAdminCrud<DoctorRecord>({
    baseUrl: selectedDepartmentId
      ? `/api/admin/departments/${selectedDepartmentId}/doctors`
      : "",
    fetchDeps: [selectedDepartmentId],
    buildFetchUrl: (baseUrl, page, pageSize) =>
      `${baseUrl}?page=${page}&pageSize=${pageSize}`,
    buildUpdateUrl: (_, record) => `/api/admin/doctors/${record.id}`,
    buildDeleteUrl: (_, record) => `/api/admin/doctors/${record.id}`,
  });

  const handleSave = async (data: DoctorFormData) => {
    await crud.save(data as unknown as Record<string, unknown>);
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
          </div>
        </div>

        {selectedDepartmentId ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">医生列表</p>
              <button
                type="button"
                onClick={crud.openCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新增医生
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
            请先选择医院和科室
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={crud.showModal} onClose={crud.closeModal} title={crud.editRecord ? "编辑医生" : "新增医生"}>
        <DoctorForm
          departmentId={selectedDepartmentId}
          initialData={
            crud.editRecord
              ? {
                  name: crud.editRecord.name,
                  title: crud.editRecord.title,
                  specialty: crud.editRecord.specialty,
                  introduction: crud.editRecord.introduction,
                  departmentId: crud.editRecord.departmentId,
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
