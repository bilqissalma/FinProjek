"use client";
import api from "@/lib/axios";

export default function ForgotPasswordPage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.email as HTMLInputElement).value;
  
    try {
      const res = await api.post("/api/forgot-password", { email });
      alert(res.data.message);
    } catch {
      alert("Gagal mengirim link reset");
    }
  };
  

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-title">
          <h1>Lupa Password?</h1>
          <p>Kami akan membantu Anda</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Terdaftar</label>
            <input type="email" required />
          </div>

          <button className="btn btn-primary" style={{ width: "100%" }}>
            Kirim Link Reset
          </button>

          <div className="auth-link">
            <a href="/auth/login">Kembali ke Login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
