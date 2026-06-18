"use client";

import { useState } from "react";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { TableSkeleton } from "@/shared/ui/Skeleton";

export type ColumnValue = string | number | boolean | null | undefined;

type Column<T> = {
  key: string;
  title: string;
  render?: (value: ColumnValue, record: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  deleteConfirmMessage?: string | ((record: T) => string);
}

export type { Column, DataTableProps };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onEdit,
  onDelete,
  deleteConfirmMessage,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [confirmRecord, setConfirmRecord] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (record: T) => {
    setConfirmRecord(record);
  };

  const getConfirmMessage = (record: T): string => {
    if (typeof deleteConfirmMessage === "function") {
      return deleteConfirmMessage(record);
    }
    if (typeof deleteConfirmMessage === "string") {
      return deleteConfirmMessage;
    }
    const name = record.name ?? "";
    return name
      ? `确定要删除"${name}"吗？此操作不可撤销。`
      : "确定要删除该记录吗？此操作不可撤销。";
  };

  const handleConfirmDelete = async () => {
    if (!confirmRecord || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(confirmRecord);
    } finally {
      setDeleting(false);
      setConfirmRecord(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-sm">
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-[var(--border-default)]">
          <thead className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider"
                >
                  {col.title}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3.5 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
        </table>
        <div className="py-14 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-muted)] text-2xl mb-3">
            📋
          </div>
          <p className="text-sm text-[var(--text-muted)]">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-default)]">
            <thead className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider"
                  >
                    {col.title}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-6 py-3.5 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {data.map((record, index) => (
                <tr
                  key={record.id ?? index}
                  className="hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]"
                    >
                      {col.render
                        ? col.render(record[col.key], record)
                        : String(record[col.key] ?? "")}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(record)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                            编辑
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(record)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--border-default)] bg-[var(--bg-muted)]/30">
            <div className="text-sm text-[var(--text-muted)]">
              共 {total} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${
                      pageNum === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      {confirmRecord && (
        <ConfirmDialog
          open={!!confirmRecord}
          title="确认删除"
          message={getConfirmMessage(confirmRecord)}
          variant="danger"
          confirmLabel="删除"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmRecord(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
