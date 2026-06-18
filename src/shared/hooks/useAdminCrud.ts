"use client";

import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { useToast } from "@/shared/ui/Toast";

/* ── Types ── */

interface UseAdminCrudOptions {
  /** API base URL for list/create/update/delete */
  baseUrl: string;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Additional dependencies for the fetch callback (e.g., selected filter IDs) */
  fetchDeps?: unknown[];
  /** Transform the fetch URL. Useful for dynamic path segments. */
  buildFetchUrl?: (baseUrl: string, page: number, pageSize: number) => string;
  /** Transform the create URL. Default: baseUrl */
  buildCreateUrl?: (baseUrl: string) => string;
  /** Transform the update URL for a record. Default: baseUrl + "/" + record.id */
  buildUpdateUrl?: (baseUrl: string, record: { id: string }) => string;
  /** Transform the delete URL for a record. Default: baseUrl + "/" + record.id */
  buildDeleteUrl?: (baseUrl: string, record: { id: string }) => string;
}

interface UseAdminCrudReturn<T> {
  /* ── State ── */
  data: T[];
  loading: boolean;
  page: number;
  total: number;
  saving: boolean;

  /* ── Modal state ── */
  showModal: boolean;
  editRecord: T | null;

  /* ── Actions ── */
  setPage: (page: number) => void;
  refresh: () => void;
  openCreate: () => void;
  openEdit: (record: T) => void;
  closeModal: () => void;
  save: (formData: Record<string, unknown>) => Promise<boolean>;
  remove: (record: T) => Promise<void>;
}

/**
 * Generic admin CRUD hook.
 * Manages list fetching, pagination, create/update modal state, and delete.
 *
 * @example
 * ```tsx
 * const crud = useAdminCrud<HospitalRecord>({
 *   baseUrl: "/api/admin/hospitals",
 * });
 *
 * return (
 *   <>
 *     <DataTable data={crud.data} ... onEdit={crud.openEdit} onDelete={crud.remove} />
 *     {crud.showModal && <Form onSave={crud.save} onCancel={crud.closeModal} saving={crud.saving} />}
 *   </>
 * );
 * ```
 */
export function useAdminCrud<T extends { id: string }>(
  options: UseAdminCrudOptions,
): UseAdminCrudReturn<T> {
  const {
    baseUrl,
    pageSize = 10,
    fetchDeps = [],
    buildFetchUrl,
    buildCreateUrl,
    buildUpdateUrl,
    buildDeleteUrl,
  } = options;

  const { showToast } = useToast();
  const mountedRef = useRef(true);

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<T | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /* ── Fetch ── */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const url = buildFetchUrl
        ? buildFetchUrl(baseUrl, page, pageSize)
        : `${baseUrl}?page=${page}&pageSize=${pageSize}`;

      const res = await fetch(url);
      const json = await res.json();
      if (mountedRef.current && json.code === 0) {
        setData(json.data.list);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error(`[useAdminCrud] Fetch error:`, err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, page, pageSize, fetchDeps]);

  useEffect(() => {
    startTransition(() => {
      refresh();
    });
  }, [refresh]);

  /* ── Save (create/update) ── */
  const save = useCallback(
    async (formData: Record<string, unknown>): Promise<boolean> => {
      setSaving(true);
      try {
        const url = editRecord
          ? buildUpdateUrl
            ? buildUpdateUrl(baseUrl, editRecord)
            : `${baseUrl}/${editRecord.id}`
          : buildCreateUrl
            ? buildCreateUrl(baseUrl)
            : baseUrl;

        const method = editRecord ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();

        if (json.code === 0) {
          setShowModal(false);
          setEditRecord(null);
          refresh();
          return true;
        } else {
          showToast(json.message || "操作失败", "error");
          return false;
        }
      } catch (err) {
        showToast("操作失败", "error");
        console.error(err);
        return false;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [baseUrl, editRecord, buildCreateUrl, buildUpdateUrl, refresh, showToast],
  );

  /* ── Delete ── */
  const remove = useCallback(
    async (record: T) => {
      try {
        const url = buildDeleteUrl
          ? buildDeleteUrl(baseUrl, record)
          : `${baseUrl}/${record.id}`;

        const res = await fetch(url, { method: "DELETE" });
        const json = await res.json();
        if (json.code === 0) {
          refresh();
        } else {
          showToast(json.message || "删除失败", "error");
        }
      } catch (err) {
        showToast("删除失败", "error");
        console.error(err);
      }
    },
    [baseUrl, buildDeleteUrl, refresh, showToast],
  );

  /* ── Modal actions ── */
  const openCreate = useCallback(() => {
    setEditRecord(null);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((record: T) => {
    setEditRecord(record);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditRecord(null);
  }, []);

  return {
    data,
    loading,
    page,
    total,
    saving,
    showModal,
    editRecord,
    setPage,
    refresh,
    openCreate,
    openEdit,
    closeModal,
    save,
    remove,
  };
}
