'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function TambahPekerjaan({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Inisialisasi state sebagai array kosong
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch data proyek saat modal dibuka
    api.get('/proyek')
      .then(res => {
        // PERBAIKAN 1: Cek apakah data dibungkus wrapper .data atau tidak
        const responseData = res.data.data || res.data;
        
        // PERBAIKAN 2: Pastikan yang disimpan adalah Array
        if (Array.isArray(responseData)) {
          setProjects(responseData);
        } else {
          setProjects([]); // Fallback ke array kosong biar tidak crash
        }
      })
      .catch(err => {
        console.error("Gagal load proyek:", err);
        setProjects([]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Casting target ke 'any' untuk menghindari error TypeScript pada akses properti form
    const form = e.currentTarget as any;
    
    const formData = new FormData();
    formData.append('nama_pekerjaan', form.nama_pekerjaan.value);
    formData.append('id_proyek', form.id_proyek.value);

    // Keterangan opsional
    if (form.keterangan.value) {
      formData.append('keterangan', form.keterangan.value);
    }

    try {
      await api.post('/pekerjaan', formData);
      onSuccess(); // Refresh data parent & tutup modal
    } catch (err: any) {
      console.error('Error submit:', err);
      const msg = err.response?.data?.message || 'Gagal menyimpan pekerjaan';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Tambah Pekerjaan</h2>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* NAMA PEKERJAAN */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nama Pekerjaan</label>
            <input 
              name="nama_pekerjaan" 
              required 
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          {/* PILIH PROYEK */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Proyek</label>
            <select 
              name="id_proyek" 
              required
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">-- Pilih Proyek --</option>
              
              {/* PERBAIKAN 3: Safety Check sebelum mapping */}
              {Array.isArray(projects) && projects.map(p => (
                <option key={p.id_proyek} value={p.id_proyek}>
                  {p.nama_proyek}
                </option>
              ))}
            </select>
          </div>

          {/* KETERANGAN */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Keterangan (Opsional)</label>
            <textarea 
              name="keterangan" 
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              rows={3}
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Batal
            </button>

            <button 
              type="submit"
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}