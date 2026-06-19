"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import heroPoster from "@/features/home/assets/hero-medical.jpg";

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
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {/* ── Background video ── */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroPoster.src}
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        {/* Multi-layer gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/75 to-slate-900/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40" />
      </div>

      {/* ── Ambient glow orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full bg-blue-500/15 blur-[140px] animate-float" />
        <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full bg-cyan-400/12 blur-[140px] animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/8 blur-[100px] animate-float" style={{ animationDelay: "0.8s" }} />
        {/* Small decorative dots */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-blue-400/30" />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-cyan-400/20" />
        <div className="absolute bottom-1/3 left-1/5 w-1 h-1 rounded-full bg-white/20" />
      </div>

      {/* ── Bottom gradient transition ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* ── Content ── */}
      <div className="relative w-full max-w-7xl mx-auto px-4 py-24 sm:py-32 lg:py-40">
        <div className="text-center max-w-3xl mx-auto">
          {/* Brand badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full glass px-5 py-2 text-sm text-white/90 mb-8 shadow-lg animate-fade-in">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative rounded-full bg-emerald-400 w-2 h-2 shadow-lg shadow-emerald-400/50" />
            </span>
            在线预约挂号平台 · 便捷就医第一步
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight drop-shadow-lg animate-slide-up">
            健康挂号
            <span className="block text-blue-200/85 mt-3 font-light tracking-wider">
              让看病更简单
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300/90 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow animate-slide-up" style={{ animationDelay: "0.1s" }}>
            覆盖全市各大医院，在线预约挂号、实时查看医生排班，
            <br className="hidden sm:block" />
            告别排队等候，轻松就医。
          </p>

          {/* Search bar - glass effect */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/30 via-indigo-400/20 to-cyan-400/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center glass rounded-2xl shadow-2xl overflow-hidden group-hover:border-white/30 transition-all duration-300">
                <Search className="w-5 h-5 ml-5 text-blue-200/60 shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索医院或医生..."
                  className="flex-1 bg-transparent px-4 py-4 text-white placeholder-blue-200/50 focus:outline-none text-base"
                />
                <button
                  type="submit"
                  className="mr-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-800 px-6 py-2.5 text-sm font-semibold hover:bg-white transition-all hover:scale-105 active:scale-[0.97] shadow-lg"
                >
                  搜索
                </button>
              </div>
            </div>
          </form>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => router.push("/hospitals")}
              className="group relative rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-slate-800 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-[0.97] overflow-hidden"
            >
              <span className="relative z-10">立即挂号</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button
              onClick={() => {
                document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-xl border border-white/30 glass px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 shadow-lg"
            >
              了解更多
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
