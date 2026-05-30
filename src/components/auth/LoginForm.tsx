"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "登录失败");
        return;
      }

      router.push("/hospitals");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white dark:bg-[#1e293b] p-8 shadow-lg dark:shadow-none dark:border dark:border-gray-700">
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-gray-100">
        登录
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
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
            onChange={(e) => setAccount(e.target.value)}
            placeholder="请输入邮箱或手机号"
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-gray-50 dark:bg-gray-800"
          />
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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-gray-50 dark:bg-gray-800"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
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
