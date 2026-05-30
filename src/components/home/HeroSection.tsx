"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroSection() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/hospitals?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      router.push("/hospitals");
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* ── 背景图片（底层） ── */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-medical.jpg"
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
        {/* 多重渐变叠加：暗化 + 氛围光 */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/30" />
      </div>

      {/* ── 装饰光晕 ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 左侧暖色光晕 */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        {/* 右侧冷色光晕 */}
        <div className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-cyan-400/10 blur-[120px]" />
        {/* 中心环境光 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-400/5 blur-[150px]" />
      </div>

      {/* ── 底部渐变过渡到内容区 ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-[#0f172a] to-transparent" />

      {/* ── 前景内容 ── */}
      <div className="relative max-w-7xl mx-auto px-4 py-28 sm:py-36 lg:py-44">
        <div className="text-center max-w-3xl mx-auto">
          {/* 品牌标语 */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-5 py-2 text-sm text-white/90 mb-8 border border-white/10 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            在线预约挂号平台 · 便捷就医第一步
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight drop-shadow-lg">
            健康挂号
            <span className="block text-blue-200/90 mt-2 font-light tracking-wider">
              让看病更简单
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-lg sm:text-xl text-gray-300/90 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow">
            覆盖全市各大医院，在线预约挂号、实时查看医生排班，
            <br className="hidden sm:block" />
            告别排队等候，轻松就医。
          </p>

          {/* 搜索栏 - 毛玻璃效果 */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/40 to-cyan-400/40 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden group-hover:border-white/30 transition-colors">
                <svg
                  className="w-5 h-5 ml-5 text-blue-200/70 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索医院或医生..."
                  className="flex-1 bg-transparent px-4 py-4 text-white placeholder-blue-200/50 focus:outline-none text-base"
                />
                <button
                  type="submit"
                  className="mr-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-800 px-6 py-2.5 text-sm font-semibold hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  搜索
                </button>
              </div>
            </div>
          </form>

          {/* CTA 按钮 */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => router.push("/hospitals")}
              className="group relative rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-slate-800 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">立即挂号</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => {
                document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-xl border border-white/30 bg-white/10 backdrop-blur-md px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 hover:border-white/40 transition-all shadow-lg"
            >
              了解更多
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
