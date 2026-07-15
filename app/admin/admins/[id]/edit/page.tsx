'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function EditAdminPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    status: 'aktif',
  });

  useEffect(() => {
    api.get(`/admin/users/${id}`)
      .then(res => {
        const data = res.data.data || res.data;
        setForm({
          nama_lengkap: data.nama_lengkap,
          email: data.email,
          status: data.status,
        });
      })
      .catch((err) => {
        console.error(err);
        alert('Gagal memuat data admin');
        router.push('/admin/admins');
      });
  }, [id, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ FIX: Kirim 'role' agar validasi backend lolos
      const payload = {
        ...form,
        role: 'admin', // Wajib dikirim ulang untuk validasi Laravel
        is_premium: 0  // Kirim default 0 agar aman
      };

      await api.put(`/admin/users/${id}`, payload);
      
      alert('Admin berhasil diperbarui');
      router.push('/admin/admins');

    } catch (err: any) {
      console.error(err);
      
      // ✅ FIX: Tampilkan pesan error detail dari Laravel
      const errorData = err.response?.data;
      if (errorData?.errors) {
         // Jika error validasi (misal: nama kosong, email duplikat)
         const msg = Object.values(errorData.errors).flat().join('\n');
         alert(`Gagal Update:\n${msg}`);
      } else {
         alert(errorData?.message || 'Gagal update admin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999}}>
      <div className="modal-content" style={{background:'white', padding:30, borderRadius:8, width:400}}>
        <div className="modal-header" style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
          <h2 style={{margin:0}}>Edit Admin</h2>
          <button
            className="modal-close"
            onClick={() => router.push('/admin/admins')}
            style={{background:'transparent', border:'none', fontSize:24, cursor:'pointer'}}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold'}}>Nama Lengkap</label>
            <input
              className="form-control" style={{width:'100%', padding:10, marginTop:5, border:'1px solid #ccc', borderRadius:4}}
              value={form.nama_lengkap}
              onChange={e =>
                setForm({ ...form, nama_lengkap: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold'}}>Email</label>
            <input 
                className="form-control" style={{width:'100%', padding:10, marginTop:5, background:'#eee', border:'1px solid #ccc', borderRadius:4}}
                value={form.email} 
                disabled // Email biasanya tidak boleh diganti sembarangan
            />
          </div>

          <div className="form-group" style={{marginBottom:20}}>
            <label style={{fontWeight:'bold'}}>Status</label>
            <select
              className="form-control" style={{width:'100%', padding:10, marginTop:5, border:'1px solid #ccc', borderRadius:4}}
              value={form.status}
              onChange={e =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="aktif">Aktif</option>
              <option value="tidak aktif">Tidak Aktif</option>
            </select>
          </div>

          <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:10}}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admin/admins')}
              style={{padding:'10px 20px', background:'#eee', border:'none', borderRadius:4, cursor:'pointer'}}
            >
              Batal
            </button>

            <button
              className="btn btn-primary"
              disabled={loading}
              style={{padding:'10px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}
            >
              {loading ? 'Menyimpan...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}