"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/shared/ui/index";

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

function validateName(value: string): string | undefined {
  if (!value.trim()) return "请输入姓名";
  if (value.trim().length < 2) return "姓名至少 2 个字符";
  return undefined;
}

function validateEmail(value: string): string | undefined {
  if (!value) return undefined; // optional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "邮箱格式不正确";
  return undefined;
}

function validatePhone(value: string): string | undefined {
  if (!value) return undefined; // optional
  if (!/^1\d{10}$/.test(value)) return "手机号格式不正确（11位数字）";
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return "请输入密码";
  if (value.length < 6) return "密码至少 6 位";
  return undefined;
}

function validateConfirm(value: string, password: string): string | undefined {
  if (!value) return "请再次输入密码";
  if (value !== password) return "两次密码输入不一致";
  return undefined;
}

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: getFieldError(field),
    }));
  };

  const handleChange = (field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      name: setName,
      email: setEmail,
      phone: setPhone,
      password: setPassword,
      confirmPassword: setConfirmPassword,
    };
    setters[field]?.(value);
    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: getFieldError(field, value) }));
      // Also re-check confirmPassword when password changes
      if (field === "password" && touched.confirmPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirm(confirmPassword, field === "password" ? value : password),
        }));
      }
    }
  };

  const getFieldError = (field: string, overrideValue?: string): string | undefined => {
    const v = (overrideValue ?? { name, email, phone, password, confirmPassword }[field]) as string;
    switch (field) {
      case "name":
        return validateName(v);
      case "email":
        return validateEmail(v);
      case "phone":
        return validatePhone(v);
      case "password":
        return validatePassword(v);
      case "confirmPassword":
        return validateConfirm(v, password);
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    // Check at least one of email/phone
    if (!email && !phone) {
      setSubmitError("邮箱和手机号至少填一项");
      setTouched((prev) => ({ ...prev, email: true, phone: true }));
      return;
    }

    // Validate all
    const errors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
      confirmPassword: validateConfirm(confirmPassword, password),
    };
    const filtered = Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined));
    if (Object.keys(filtered).length > 0) {
      setFieldErrors(errors);
      setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.code !== 0) {
        setSubmitError(data.message || "注册失败");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setSubmitError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition bg-gray-50 dark:bg-gray-800 ${
      hasError
        ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
    }`;

  return (
    <div className="rounded-xl bg-white dark:bg-[#1e293b] p-8 shadow-lg dark:shadow-none dark:border dark:border-gray-700">
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-gray-100">注册</h2>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
            姓名
          </label>
          <Input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="请输入姓名"
            required
            className={inputClass(!!fieldErrors.name)}
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
            邮箱
          </label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="请输入邮箱（与手机号至少填一项）"
            className={inputClass(!!fieldErrors.email)}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="reg-phone" className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
            手机号
          </label>
          <Input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            placeholder="请输入手机号（与邮箱至少填一项）"
            className={inputClass(!!fieldErrors.phone)}
          />
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
            密码
          </label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="至少 6 位"
              required
              minLength={6}
              className={`${inputClass(!!fieldErrors.password)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="reg-confirm" className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
            确认密码
          </label>
          <div className="relative">
            <Input
              id="reg-confirm"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              placeholder="请再次输入密码"
              required
              className={`${inputClass(!!fieldErrors.confirmPassword)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
        </div>

        {submitError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {submitError}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:from-blue-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm">
          {loading ? "注册中..." : "注册"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          去登录
        </Link>
      </p>
    </div>
  );
}
