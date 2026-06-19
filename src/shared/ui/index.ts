/* ───────────────────────────────────────────────
   shadcn/ui 组件重新导出（通过 barrel 供各模块调用）
   ─────────────────────────────────────────────── */
export { Button, buttonVariants } from "@/components/ui/button";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
export { Toaster } from "@/components/ui/sonner";
export { Skeleton } from "@/components/ui/skeleton";
export { Input } from "@/components/ui/input";
export { Label } from "@/components/ui/label";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select";
export { Badge } from "@/components/ui/badge";
export { Separator } from "@/components/ui/separator";
export { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";

/* ───────────────────────────────────────────────
   自定义组合组件（保留/改造）
   ─────────────────────────────────────────────── */
export { default as Header } from "./Header";
export { default as Footer } from "./Footer";
export { default as ThemeToggle } from "./ThemeToggle";
export { ThemeProvider, useTheme } from "./ThemeProvider";
export { Modal } from "./Modal";
export { ConfirmDialog } from "./ConfirmDialog";
export { showToast, useToast, Toaster as AppToaster } from "./Toast";
export { CardSkeleton, TableSkeleton, CalendarSkeleton } from "./Skeleton";
