'use client';

import { useState } from 'react';
import api from '@/lib/axios';

export default function TambahUser({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target;

    const payload: any = {
      nama_lengkap: form.nama_lengkap.value,
      email: form.email.value,
      password: form.password.value,
      role: form.role.value,
      status: form.status.value,
      // Handle checkbox is_premium
      is_premium: form.is_premium?.checked ? 1 : 0,
    };

    try {
      // FIX URL: Hapus '/api' di depan
      await api.post('/admin/users', payload);
      
      alert("User berhasil ditambahkan");
      onClose(); // Parent akan refresh data
    } catch (err: any) {
      console.error(err);
      // Handle error validation Laravel
      const msg = err.response?.data?.message || err.response?.data?.errors 
        ? JSON.stringify(err.response?.data?.errors) 
        : 'Gagal menambahkan user';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" style={{position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)'}}>
      <div className="modal-content" style={{background:'white', padding:25, borderRadius:10, width:400, maxWidth:'95%'}}>
        <div className="modal-header" style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
          <h2 style={{margin:0, fontSize:'1.3rem'}}>Tambah User</h2>
          <button className="modal-close" onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Nama Lengkap</label>
            <input name="nama_lengkap" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}} required />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Email</label>
            <input type="email" name="email" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}} autoComplete="new-email" required />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Password</label>
            <input type="password" name="password" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}} autoComplete="new-password" required minLength={6} />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Role</label>
            <select name="role" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}} required>
              <option value="">-- Pilih Role --</option>
              <option value="kontraktor">Kontraktor</option>
              <option value="pemilik">Pemilik</option>
            </select>
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Status</label>
            <select name="status" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}} required>
              <option value="aktif">Aktif</option>
              <option value="tidak aktif">Tidak Aktif</option>
            </select>
          </div>

          {/* Opsi VIP hanya muncul jika role kontraktor (bisa pakai state utk lebih dinamis, tapi ini basic) */}
          <div className="form-group" style={{marginBottom:20}}>
            <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer'}}>
              <input type="checkbox" name="is_premium" style={{width:18, height:18}} />
              <span>Set sebagai <strong>VIP</strong> (Khusus Kontraktor)</span>
            </label>
          </div>

          <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:10}}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{padding:'10px 20px', background:'#eee', border:'none', borderRadius:5, cursor:'pointer'}}>
              Batal
            </button>
            <button className="btn btn-primary" disabled={loading} style={{padding:'10px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}