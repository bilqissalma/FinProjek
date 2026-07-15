"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const passwordInput = form.elements.namedItem(
      "password"
    ) as HTMLInputElement;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      setIsLoading(true);

      const res = await api.post("/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        throw new Error("Respons login dari server tidak valid.");
      }

      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Normalisasi role agar tidak terganggu spasi/huruf kapital
      const role = String(
        user.role ??
          user.level ??
          user.jenis_user ??
          user.tipe_user ??
          ""
      )
        .trim()
        .toLowerCase();

      console.log("DATA USER:", user);
      console.log("ROLE USER:", role);

      let tujuanDashboard = "";

      switch (role) {
        case "admin":
          tujuanDashboard = "/admin/dashboard";
          break;

        case "kontraktor":
          tujuanDashboard = "/kontraktor/dashboard";
          break;

        case "pemilik":
          tujuanDashboard = "/pemilik/dashboard";
          break;

        default:
          alert(
            `Login berhasil, tetapi role pengguna "${role}" tidak dikenali.`
          );
          return;
      }

      router.replace(tujuanDashboard);
      router.refresh();
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);

      const pesanError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Login gagal.";

      alert(pesanError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-title">
          <h1>Masuk</h1>
          <p>Selamat datang kembali</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>

          <div className="auth-link">
            <Link href="/auth/forgot-password">
              Lupa password?
            </Link>
          </div>

          <div className="auth-link">
            Belum punya akun?{" "}
            <Link href="/auth/register">Daftar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}