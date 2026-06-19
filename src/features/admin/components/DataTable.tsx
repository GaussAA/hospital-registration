"use client";

import { useState } from "react";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { TableSkeleton } from "@/shared/ui/Skeleton";
import { Button } from "@/shared/ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/shared/ui";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

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
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {col.title}
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell className="px-6 py-3.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
        </Table>
        <div className="py-14 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted text-2xl mb-3">
            📋
          </div>
          <p className="text-sm text-muted-foreground">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {col.title}
                  </TableCell>
                ))}
                {(onEdit || onDelete) && (
                  <TableCell className="px-6 py-3.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    操作
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record, index) => (
                <TableRow
                  key={record.id ?? index}
                  className="hover:bg-accent transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"
                    >
                      {col.render
                        ? col.render(record[col.key], record)
                        : String(record[col.key] ?? "")}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(record)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            编辑
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(record)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            删除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-muted/30">
            <div className="text-sm text-muted-foreground">
              共 {total} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
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
                  <Button
                    key={pageNum}
                    type="button"
                    variant={pageNum === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg ${
                      pageNum === page ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
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
