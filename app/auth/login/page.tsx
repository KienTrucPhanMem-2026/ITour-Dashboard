"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, ArrowRight } from "lucide-react";
import bgImage from "../../../assets/background/ocean.jpg";
import logoImage from "../../../assets/3-1.png";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setUser } from "@/store/user-store";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const account = String(formData.get("account") || "").trim();
    const password = String(formData.get("password") || "");

    if (!account || !password) {
      setError("Vui lòng nhập đầy đủ thông tin đăng nhập.");
      setIsLoading(false);
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const isProduction = apiUrl.startsWith("https");

    console.log("api ", apiUrl, "isProduction", isProduction);
    

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: account,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.code !== 200) {
        setError(data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        setIsLoading(false);
        return;
      }
      const userData = data?.data as {
        id?: string;
        userName?: string;
        fullName?: string;
        email?: string;
        role?: string;
      } | null;
      const userRole = userData?.role;
      if (userRole) {
        // Cần Secure + SameSite=None trên production (HTTPS cross-site)
        const cookieFlags = isProduction
          ? "; path=/; max-age=3600; Secure; SameSite=None"
          : "; path=/; max-age=3600; SameSite=Lax";
        document.cookie = `itour_role=${userRole}${cookieFlags}`;
      }
      if (userData) {
        setUser({
          id: userData.id,
          userName: userData.userName,
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
        });
      }

      // Đợi một tick để đảm bảo cookie đã được ghi trước khi navigate
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (userRole === "TOURGUIDE") {
        router.push("/tourguide/dashboard");
      } else if (userRole === "CONSULTANT") {
        router.push("/consultant/dashboard");
      } else if (userRole === "TOURPLANNER") {
        router.push("/tourplanner/tours");
      } else {
        router.push("/");
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Không thể kết nối máy chủ. Vui lòng thử lại.";
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-blue-900/50" />
      <div className="relative z-10 w-full max-w-[960px]">
        <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="hidden md:flex flex-col justify-between p-10 text-white">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/90">
                ITour Travel
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Hành trình chuyên nghiệp,
                <br />
                vận hành tối ưu
              </h2>
              <p className="mt-4 text-sm text-white/70">
                Quản trị tour, hướng dẫn viên và tư vấn viên trên một nền tảng
                hiện đại, an toàn.
              </p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Hệ thống nội bộ ITour
              </div>
              <p className="text-xs text-white/60">
                Vui lòng đăng nhập để tiếp tục quản trị dịch vụ du lịch.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10 lg:p-12">
            <div className="flex flex-col items-center mb-8 text-white">
              <Image
                src={logoImage}
                alt="ITour Logo"
                width={160}
                height={60}
                style={{ objectFit: "contain" }}
                className="mb-6"
                priority
              />
              <h1 className="text-2xl font-semibold tracking-tight">
                Đăng nhập hệ thống
              </h1>
              <p className="mt-2 text-sm text-white/70 text-center">
                Đăng nhập dành cho nhân viên quản trị tour du lịch
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label
                    htmlFor="account"
                    className="text-sm font-medium text-white/90"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <Input
                      id="account"
                      name="account"
                      type="text"
                      autoCapitalize="none"
                      autoComplete="username"
                      autoCorrect="off"
                      className="pl-12 h-12 rounded-2xl bg-white/80 text-slate-900 placeholder:text-slate-500 border border-white/30 focus-visible:border-cyan-300 focus-visible:ring-cyan-300"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-white/90"
                    >
                      Mật khẩu
                    </Label>
                    <a
                      href="#"
                      className="text-xs font-medium text-cyan-200 hover:text-cyan-100 transition-colors"
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="pl-12 h-12 rounded-2xl bg-white/80 text-slate-900 placeholder:text-slate-500 border border-white/30 focus-visible:border-cyan-300 focus-visible:ring-cyan-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                className="h-12 rounded-2xl text-base font-semibold bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-white shadow-[0_14px_35px_rgba(34,211,238,0.35)] hover:opacity-95 transition-all"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Đăng nhập <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
              {error ? (
                <div className="rounded-2xl border border-rose-200/40 bg-rose-500/20 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
