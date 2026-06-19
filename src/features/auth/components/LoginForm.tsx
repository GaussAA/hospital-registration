"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle, ArrowRight, XCircle } from "lucide-react";
import { Button, Input } from "@/shared/ui/index";
import { useUser } from "./UserProvider";

interface FieldErrors {
  account?: string;
  password?: string;
}

function validateAccount(value: string): string | undefined {
  if (!value.trim()) return "请输入邮箱或手机号";
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return "请输入密码";
  if (value.length < 6) return "密码至少 6 位";
  return undefined;
}

export default function LoginForm() {
  const router = useRouter();
  const { setUser } = useUser();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors: FieldErrors = {};
    if (field === "account" || !touched.account) {
      const err = validateAccount(account);
      if (err) errors.account = err;
    }
    if (field === "password" || !touched.password) {
      const err = validatePassword(password);
      if (err) errors.password = err;
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
  };

  const handleChange = (field: string, value: string) => {
    if (field === "account") setAccount(value);
    if (field === "password") setPassword(value);
    if (touched[field]) {
      const validator = field === "account" ? validateAccount : validatePassword;
      const err = validator(value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const errors: FieldErrors = {
      account: validateAccount(account),
      password: validatePassword(password),
    };
    const filtered = Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined));
    if (Object.keys(filtered).length > 0) {
      setFieldErrors(errors);
      setTouched({ account: true, password: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });

      const data = await res.json();

      if (!res.ok || data.code !== 0) {
        setSubmitError(data.message || "登录失败");
        return;
      }

      setUser(data.data.user);
      router.push("/hospitals");
    } catch {
      setSubmitError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 bg-muted text-foreground placeholder:text-muted-foreground ${
      hasError
        ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        : "border-transparent focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-card"
    }`;

  return (
    <div className="glass-strong rounded-2xl p-8 shadow-xl card-hover">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">欢迎回来</h2>
        <p className="text-sm text-muted-foreground mt-1">请登录您的账号</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Account field */}
        <div>
          <label htmlFor="account" className="mb-1.5 block text-sm font-medium text-muted-foreground">
            邮箱 / 手机号
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="account"
              type="text"
              value={account}
              onChange={(e) => handleChange("account", e.target.value)}
              onBlur={() => handleBlur("account")}
              placeholder="请输入邮箱或手机号"
              required
              className={`${inputClass(!!fieldErrors.account)} pl-10`}
            />
          </div>
          {fieldErrors.account && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {fieldErrors.account}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-muted-foreground">
            密码
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="请输入密码"
              required
              className={`${inputClass(!!fieldErrors.password)} pl-10`}
            />
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/30 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <Button type="submit" disabled={loading} className="w-full group">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              登录中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              登录
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
