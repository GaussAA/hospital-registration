import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "注册 - 健康挂号",
  description: "注册健康挂号平台账号，在线预约挂号省时省心",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
