"use client";

import { AdminHeader, DataTable, HospitalForm } from "@/features/admin/client";
import type { Column, HospitalFormData } from "@/features/admin/client";
import { useAdminCrud } from "@/shared/hooks/useAdminCrud";
import Modal from "@/shared/ui/Modal";

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
  const crud = useAdminCrud<HospitalRecord>({
    baseUrl: "/api/admin/hospitals",
  });

  const handleSave = async (data: HospitalFormData) => {
    await crud.save(data as unknown as Record<string, unknown>);
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
            onClick={crud.openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新增医院
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
      </div>

      {/* Modal */}
      <Modal open={crud.showModal} onClose={crud.closeModal} title={crud.editRecord ? "编辑医院" : "新增医院"} maxWidth="max-w-2xl">
        <HospitalForm
          initialData={crud.editRecord ?? undefined}
          onSave={handleSave}
          onCancel={crud.closeModal}
          saving={crud.saving}
        />
      </Modal>
    </>
  );
}
