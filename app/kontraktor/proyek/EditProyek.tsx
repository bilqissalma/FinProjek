'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface EditProyekModalProps {
  id: number;
  onClose: () => void;
}

export default function EditProyekModal({ id, onClose }: EditProyekModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // PERBAIKAN 1: Hapus "/api" manual (biarkan axios yang handle)
    api.get(`/proyek/${id}`)
      .then(res => {
        // PERBAIKAN 2: Masuk ke dalam properti .data
        // Cek apakah response punya wrapper .data atau tidak
        const responseData = res.data.data || res.data;
        setForm(responseData);
      })
      .catch(err => {
        console.error("Gagal load data:", err);
        alert('Gagal mengambil data proyek');
        onClose();
      });
  }, [id, onClose]);

  if (!form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();

      // Spoofing PUT method untuk Laravel
      fd.append('_method', 'PUT');

      fd.append('nama_proyek', form.nama_proyek);
      fd.append('lokasi', form.lokasi || '');
      fd.append('biaya_kesepakatan', String(form.biaya_kesepakatan));
      fd.append('tgl_mulai', form.tgl_mulai ?? '');
      fd.append('tgl_selesai', form.tgl_selesai ?? '');
      fd.append('status', form.status);

      // Hanya kirim file jika user mengupload file baru
      if (form.mou_baru) {
        fd.append('dokumen_mou', form.mou_baru);
      }

      // PERBAIKAN 3: URL Post tanpa "/api"
      await api.post(`/proyek/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Proyek berhasil diperbarui!');
      onClose();
      window.location.reload(); 
      
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 403) {
        alert('Akses ditolak atau trial habis.');
        router.push('/kontraktor/upgrade');
      } else {
        alert(err.response?.data?.message || 'Gagal update proyek.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Edit Proyek</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* NAMA PROYEK */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nama Proyek</label>
            <input
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.nama_proyek || ''}
              onChange={e => setForm({ ...form, nama_proyek: e.target.value })}
              required
            />
          </div>

          {/* LOKASI */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Lokasi Proyek</label>
            <input
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.lokasi || ''}
              onChange={e => setForm({ ...form, lokasi: e.target.value })}
              required
            />
          </div>

          {/* BIAYA */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Biaya Kesepakatan</label>
            <input
              type="number"
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.biaya_kesepakatan || ''}
              onChange={e => setForm({ ...form, biaya_kesepakatan: e.target.value })}
              required
            />
          </div>

          {/* TANGGAL (GRID) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tanggal Mulai</label>
              <input
                type="date"
                className="form-control"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                value={form.tgl_mulai || ''}
                onChange={e => setForm({ ...form, tgl_mulai: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tanggal Selesai</label>
              <input
                type="date"
                className="form-control"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                value={form.tgl_selesai || ''}
                onChange={e => setForm({ ...form, tgl_selesai: e.target.value })}
              />
            </div>
          </div>

          {/* STATUS */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Status Proyek</label>
            <select
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.status || 'Berjalan'}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="Berjalan">Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditunda">Ditunda</option>
            </select>
          </div>

          {/* FILE UPLOAD */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Dokumen MOU (Opsional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={e => setForm({ ...form, mou_baru: e.target.files?.[0] })}
            />
            {form.dokumen_mou && !form.mou_baru && (
              <small style={{ color: '#2ecc71', display: 'block', marginTop: '4px', fontSize: '0.9em' }}>
                ✓ Dokumen saat ini sudah ada.
              </small>
            )}
          </div>

          {/* BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '10px 20px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Menyimpan...' : 'Update Proyek'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}