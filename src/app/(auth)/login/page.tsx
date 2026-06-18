import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "登录 - 健康挂号",
  description: "登录健康挂号平台，管理您的预约挂号记录",
};

export default function LoginPage() {
  return <LoginForm />;
}
