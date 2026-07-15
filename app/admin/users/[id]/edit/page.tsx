'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    role: 'kontraktor',
    status: 'aktif',
    is_premium: 0,
  });

  useEffect(() => {
    // FIX: Gunakan api.get & handle wrapper
    api.get(`/admin/users/${id}`)
      .then(res => {
        const data = res.data.data || res.data;
        setForm({
          nama_lengkap: data.nama_lengkap,
          email: data.email,
          role: data.role,
          status: data.status,
          is_premium: Number(data.is_premium),
        });
      })
      .catch((err) => {
        console.error(err);
        alert('Gagal memuat data pengguna');
        router.push('/admin/users');
      });
  }, [id, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIX: Gunakan api.put & Hapus /api
      await api.put(`/admin/users/${id}`, form);
      alert("Data berhasil diperbarui");
      router.push('/admin/users');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal update pengguna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="modal-content" style={{background:'white', padding:30, borderRadius:10, width:400}}>
        <div className="modal-header" style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
          <h2 style={{margin:0}}>Edit Pengguna</h2>
          <button
            className="modal-close"
            onClick={() => router.push('/admin/users')}
            style={{border:'none', background:'transparent', fontSize:24, cursor:'pointer'}}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', fontWeight:'bold', marginBottom:5}}>Nama Lengkap</label>
            <input
              className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
              value={form.nama_lengkap}
              onChange={e =>
                setForm({ ...form, nama_lengkap: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', fontWeight:'bold', marginBottom:5}}>Email</label>
            <input className="form-control" style={{width:'100%', padding:10, background:'#eee', border:'1px solid #ccc', borderRadius:5}} value={form.email} disabled />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', fontWeight:'bold', marginBottom:5}}>Role</label>
            <select
              className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
              value={form.role}
              onChange={e =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="kontraktor">Kontraktor</option>
              <option value="pemilik">Pemilik</option>
            </select>
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{display:'block', fontWeight:'bold', marginBottom:5}}>Status</label>
            <select
              className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
              value={form.status}
              onChange={e =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="aktif">Aktif</option>
              <option value="tidak aktif">Tidak Aktif</option>
            </select>
          </div>

          {form.role === 'kontraktor' && (
            <div className="form-group" style={{marginBottom:20}}>
              <label style={{display:'block', fontWeight:'bold', marginBottom:5}}>Keanggotaan</label>
              <select
                className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
                value={form.is_premium}
                onChange={e =>
                  setForm({
                    ...form,
                    is_premium: Number(e.target.value),
                  })
                }
              >
                <option value={0}>Gratis</option>
                <option value={1}>VIP</option>
              </select>
            </div>
          )}

          <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:10}}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admin/users')}
              style={{padding:'10px 20px', borderRadius:5, border:'none', background:'#eee', cursor:'pointer'}}
            >
              Batal
            </button>

            <button
              className="btn btn-primary"
              disabled={loading}
              style={{padding:'10px 20px', borderRadius:5, border:'none', background:'#2563eb', color:'white', cursor:'pointer'}}
            >
              {loading ? 'Menyimpan...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}