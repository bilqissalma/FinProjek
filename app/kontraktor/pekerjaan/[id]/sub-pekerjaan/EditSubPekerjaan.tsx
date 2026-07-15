'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

/* =========================
   TYPE PROPS
========================== */
type Props = {
  idSub: number;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  id_pekerjaan: number | string;
  nama_sub: string;
  tgl_mulai: string;
  // field 'keterangan' sudah dihapus
};

export default function EditSubPekerjaanModal({
  idSub,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH DATA
  ========================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sub-pekerjaan/${idSub}`);
        
        // Safety check wrapper data
        const responseData = res.data.data || res.data;
        const sub = responseData.sub_pekerjaan || responseData;

        if (!sub) throw new Error("Data tidak ditemukan");

        setForm({
          id_pekerjaan: sub.id_pekerjaan || '',
          nama_sub: sub.nama_sub || '',
          tgl_mulai: sub.tgl_mulai || '',
          // keterangan tidak diambil lagi
        });

      } catch (err) {
        console.error("Error Fetching:", err);
        alert('Gagal memuat data sub pekerjaan');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (idSub) fetchData();
  }, [idSub, onClose]);

  if (loading || !form) return null;

  /* =========================
     SUBMIT
  ========================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Payload bersih tanpa keterangan
      const payload = {
        _method: 'PUT', // Spoofing PUT untuk hosting
        id_pekerjaan: form.id_pekerjaan,
        nama_sub: form.nama_sub,
        tgl_mulai: form.tgl_mulai ? form.tgl_mulai : null, 
      };

      // Gunakan POST dengan _method: PUT
      await api.post(`/sub-pekerjaan/${idSub}`, payload);

      alert('Sub Pekerjaan berhasil diupdate!');
      onSuccess(); 
      onClose();   
    } catch (err: any) {
      console.error("Error Updating:", err);
      const msg = err.response?.data?.message || 'Gagal mengupdate sub pekerjaan';
      alert(msg);
    }
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Sub Pekerjaan</h2>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* NAMA SUB */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nama Sub Pekerjaan</label>
            <input
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.nama_sub}
              onChange={e =>
                setForm({ ...form, nama_sub: e.target.value })
              }
              required
            />
          </div>

          {/* TANGGAL MULAI */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tanggal Mulai</label>
            <input
              type="date"
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.tgl_mulai}
              onChange={e =>
                setForm({ ...form, tgl_mulai: e.target.value })
              }
            />
          </div>

          {/* Input Keterangan sudah dihapus total dari sini */}

          {/* TOMBOL AKSI */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
                type="button" 
                onClick={onClose}
                style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button 
                className="btn btn-primary" 
                type="submit"
                style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}