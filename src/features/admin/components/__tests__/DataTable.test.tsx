// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DataTable from "../DataTable";

vi.mock("@/shared/ui/ConfirmDialog", () => ({
  default: ({ open, onConfirm, onCancel, title, message, confirmLabel, loading }: Record<string, unknown>) =>
    open ? (
      <div data-testid="confirm-dialog">
        <div>{title as string}</div>
        <div>{message as string}</div>
        <button data-testid="confirm-btn" onClick={() => (onConfirm as () => void)()} disabled={!!loading}>
          {loading ? "删除中..." : confirmLabel}
        </button>
        <button data-testid="cancel-btn" onClick={() => (onCancel as () => void)()}>
          取消
        </button>
      </div>
    ) : null,
}));

vi.mock("@/shared/ui/Skeleton", () => ({
  TableSkeleton: ({ rows }: { rows?: number }) => <div data-testid="table-skeleton">Skeleton {rows} rows</div>,
}));

const columns = [
  { key: "name", title: "名称" },
  { key: "phone", title: "电话" },
  { key: "city", title: "城市" },
];

const mockData = [
  { id: "1", name: "医院A", phone: "010-1234", city: "北京" },
  { id: "2", name: "医院B", phone: "021-5678", city: "上海" },
];

describe("DataTable", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render TableSkeleton when loading", () => {
    render(<DataTable columns={columns} data={[]} loading={true} />);
    expect(screen.getByTestId("table-skeleton")).toBeDefined();
  });

  it("should render empty state when data is empty", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("暂无数据")).toBeDefined();
  });

  it("should render data rows", () => {
    render(<DataTable columns={columns} data={mockData} />);
    expect(screen.getByText("医院A")).toBeDefined();
    expect(screen.getByText("医院B")).toBeDefined();
    expect(screen.getByText("010-1234")).toBeDefined();
  });

  it("should render column headers", () => {
    render(<DataTable columns={columns} data={mockData} />);
    expect(screen.getByText("名称")).toBeDefined();
    expect(screen.getByText("电话")).toBeDefined();
    expect(screen.getByText("城市")).toBeDefined();
  });

  it("should render edit button when onEdit is provided", () => {
    const onEdit = vi.fn();
    render(<DataTable columns={columns} data={mockData} onEdit={onEdit} />);
    const editButtons = screen.getAllByText("编辑");
    expect(editButtons.length).toBe(2);
  });

  it("should call onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<DataTable columns={columns} data={mockData} onEdit={onEdit} />);
    const editButtons = screen.getAllByText("编辑");
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it("should render delete button when onDelete is provided", () => {
    const onDelete = vi.fn();
    render(<DataTable columns={columns} data={mockData} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByText("删除");
    expect(deleteButtons.length).toBe(2);
  });

  it("should show confirm dialog when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<DataTable columns={columns} data={mockData} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByText("删除");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByTestId("confirm-dialog")).toBeDefined();
    expect(screen.getByText('确定要删除"医院A"吗？此操作不可撤销。')).toBeDefined();
  });

  it("should call onDelete when confirm is clicked in dialog", async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    render(<DataTable columns={columns} data={mockData} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByText("删除")[0]);
    fireEvent.click(screen.getByTestId("confirm-btn"));
    expect(onDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it("should close confirm dialog on cancel", () => {
    const onDelete = vi.fn();
    render(<DataTable columns={columns} data={mockData} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByText("删除")[0]);
    expect(screen.getByTestId("confirm-dialog")).toBeDefined();
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(screen.queryByTestId("confirm-dialog")).toBeNull();
  });

  it("should render pagination when totalPages > 1 and onPageChange provided", () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        page={1}
        pageSize={1}
        total={3}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getByText("共 3 条，第 1/3 页")).toBeDefined();
  });

  it("should call onPageChange when pagination button is clicked", () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        page={1}
        pageSize={1}
        total={3}
        onPageChange={onPageChange}
      />
    );
    const nextBtn = screen.getAllByRole("button").find((b) =>
      b.innerHTML.includes("M8.25 4.5l7.5 7.5-7.5 7.5")
    );
    if (nextBtn) fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should use custom delete confirm message", () => {
    const onDelete = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        onDelete={onDelete}
        deleteConfirmMessage="自定义删除确认信息"
      />
    );
    fireEvent.click(screen.getAllByText("删除")[0]);
    expect(screen.getByText("自定义删除确认信息")).toBeDefined();
  });

  it("should use custom delete confirm message function", () => {
    const onDelete = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        onDelete={onDelete}
        deleteConfirmMessage={(record: Record<string, unknown>) => `删除: ${record.id}`}
      />
    );
    fireEvent.click(screen.getAllByText("删除")[0]);
    expect(screen.getByText("删除: 1")).toBeDefined();
  });

  it("should render custom cell renderers", () => {
    const colsWithRender = [
      { key: "name", title: "名称", render: (value: unknown) => `★ ${value}` },
    ];
    render(<DataTable columns={colsWithRender} data={mockData} />);
    expect(screen.getByText("★ 医院A")).toBeDefined();
  });
});
