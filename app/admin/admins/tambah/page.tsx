// 📂 File: src/app/admin/admins/tambah/page.tsx
'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function TambahAdminPage() { // Ganti nama komponen biar jelas
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
        nama_lengkap: formData.get('nama_lengkap'),
        email: formData.get('email'),
        password: formData.get('password'),
        status: formData.get('status'),
        role: 'admin',
        is_premium: 0
    };

    try {
      await api.post('/admin/users', payload);
      alert('Admin berhasil ditambahkan');
      router.push('/admin/admins'); // Kembali ke halaman tabel
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{width: 'calc(100vw - 260px)', marginLeft: '260px'}}>
      <h1>Tambah Admin Baru</h1>
      <div className="card" style={{maxWidth: 500}}>
        <form onSubmit={handleSubmit}>
          {/* ... Isi Form Input Nama, Email, Password, Status ... */}
          {/* Gunakan kode form yang sebelumnya saya berikan */}
          
          <div className="form-group" style={{marginBottom:15}}>
            <label>Nama Lengkap</label>
            <input name="nama_lengkap" className="form-control" required />
          </div>
          <div className="form-group" style={{marginBottom:15}}>
            <label>Email</label>
            <input name="email" type="email" className="form-control" required />
          </div>
          <div className="form-group" style={{marginBottom:15}}>
            <label>Password</label>
            <input name="password" type="password" className="form-control" required />
          </div>
          <div className="form-group" style={{marginBottom:15}}>
            <label>Status</label>
            <select name="status" className="form-control">
                <option value="aktif">Aktif</option>
                <option value="tidak aktif">Tidak Aktif</option>
            </select>
          </div>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()} style={{marginLeft:10}}>
            Batal
          </button>
        </form>
      </div>
    </div>
  );
}