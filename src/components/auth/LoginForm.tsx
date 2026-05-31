"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/auth/UserProvider";

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
    // Clear error on change if field was touched
    if (touched[field]) {
      const validator = field === "account" ? validateAccount : validatePassword;
      const err = validator(value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    // Validate all fields
    const errors: FieldErrors = {
      account: validateAccount(account),
      password: validatePassword(password),
    };
    const filtered = Object.fromEntries(
      Object.entries(errors).filter(([, v]) => v !== undefined),
    );
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
    `w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition bg-gray-50 dark:bg-gray-800 ${
      hasError
        ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
    }`;

  return (
    <div className="rounded-xl bg-white dark:bg-[#1e293b] p-8 shadow-lg dark:shadow-none dark:border dark:border-gray-700">
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-gray-100">
        登录
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="account"
            className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            邮箱 / 手机号
          </label>
          <input
            id="account"
            type="text"
            value={account}
            onChange={(e) => handleChange("account", e.target.value)}
            onBlur={() => handleBlur("account")}
            placeholder="请输入邮箱或手机号"
            required
            className={inputClass(!!fieldErrors.account)}
          />
          {fieldErrors.account && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {fieldErrors.account}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            placeholder="请输入密码"
            required
            className={inputClass(!!fieldErrors.password)}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {submitError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        还没有账号？{" "}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
