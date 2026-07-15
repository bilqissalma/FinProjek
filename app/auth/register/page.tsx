"use client";

import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import React, { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;

    const passwordInput = form.elements.namedItem("password") as HTMLInputElement;
    const confirmPasswordInput = form.elements.namedItem("confirm_password") as HTMLInputElement;

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
      alert("Password dan Konfirmasi Password tidak sama!");
      setLoading(false);
      return;
    }

    // Persiapkan data sesuai format Backend Laravel
    const data = {
      nama_lengkap: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      no_telepon: (form.elements.namedItem("phone") as HTMLInputElement).value,
      role: (form.elements.namedItem("role") as HTMLSelectElement).value,
      password: password,
      // PENTING: Laravel biasanya butuh field ini untuk validasi 'confirmed'
      password_confirmation: confirmPassword, 
    };

    try {
      // PERBAIKAN URL: Cukup '/register' 
      // (Axios @/lib/axios biasanya sudah otomatis tambah prefix /api)
      await api.post("/register", data);

      alert("Registrasi berhasil! Silakan login.");
      router.push("/auth/login");
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);

      // Handle Error Validation dari Laravel (422)
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let message = "Validasi Gagal:\n";
        // Gabungkan semua pesan error
        for (const key in errors) {
           message += `- ${errors[key][0]}\n`;
        }
        alert(message);
      } 
      // Handle Error 405 (Salah URL / Method)
      else if (err.response?.status === 405) {
        alert("Terjadi kesalahan sistem (Route URL Salah). Hubungi admin.");
      }
      else {
        alert(err.response?.data?.message || "Gagal terhubung ke server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-title">
          <h1>Daftar Akun</h1>
          <p>Bergabunglah dengan kami</p>
        </div>

        {/* Dummy input anti autofill */}
        <input type="text" name="fakeuser" style={{ display: "none" }} />
        <input type="password" name="fakepass" style={{ display: "none" }} />

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input name="name" required autoComplete="off" placeholder="Nama Lengkap Anda" />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="email@contoh.com"
            />
          </div>

          <div className="form-group">
            <label>Nomor HP</label>
            <input name="phone" required autoComplete="off" placeholder="0812..." />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select name="role" required autoComplete="off">
              <option value="">Pilih Role</option>
              {/* Pastikan value ini ('kontraktor'/'pemilik') sesuai database enum/role Anda */}
              <option value="kontraktor">Kontraktor</option>
              <option value="pemilik">Pemilik Properti</option>
            </select>
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Mendaftar..." : "Daftar"}
          </button>

          <div className="auth-link">
            Sudah punya akun? <a href="/auth/login">Masuk</a>
          </div>
        </form>
      </div>
    </div>
  );
}