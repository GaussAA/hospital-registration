"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import AdminHeader from "@/components/layout/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import type { Column, ColumnValue } from "@/components/admin/DataTable";
import DepartmentForm from "@/components/admin/DepartmentForm";
import type { DepartmentFormData } from "@/components/admin/DepartmentForm";
import { useAdminCrud } from "@/lib/hooks/useAdminCrud";
import Modal from "@/components/ui/Modal";

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

  const crud = useAdminCrud<DepartmentRecord>({
    baseUrl: `/api/admin/hospitals/${selectedHospitalId}/departments`,
    fetchDeps: [selectedHospitalId],
    buildFetchUrl: (baseUrl, page, pageSize) =>
      `${baseUrl}?page=${page}&pageSize=${pageSize}`,
    buildCreateUrl: (baseUrl) => baseUrl,
    buildUpdateUrl: (_, record) => `/api/admin/departments/${record.id}`,
    buildDeleteUrl: (_, record) => `/api/admin/departments/${record.id}`,
  });

  const handleSave = async (data: DepartmentFormData) => {
    const saved = await crud.save(data as unknown as Record<string, unknown>);
    if (!saved) {
      showToast("操作失败", "error");
    }
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHospitalId(e.target.value);
    crud.setPage(1);
  };

  const columns: Column<DepartmentRecord>[] = [
    { key: "name", title: "科室名称" },
    {
      key: "description",
      title: "描述",
      render: (value: ColumnValue) => (
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

        {selectedHospitalId ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                {hospitals.find((h) => h.id === selectedHospitalId)?.name} - 科室列表
              </p>
              <button
                type="button"
                onClick={crud.openCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 新增科室
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
            请先选择医院
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={crud.showModal} onClose={crud.closeModal} title={crud.editRecord ? "编辑科室" : "新增科室"}>
        <DepartmentForm
          hospitalId={selectedHospitalId}
          initialData={crud.editRecord ?? undefined}
          onSave={handleSave}
          onCancel={crud.closeModal}
          saving={crud.saving}
        />
      </Modal>
    </>
  );
}
