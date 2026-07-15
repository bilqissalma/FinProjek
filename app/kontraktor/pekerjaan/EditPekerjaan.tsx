'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function EditPekerjaanModal({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Debugging: Cek ID yang diterima
        console.log("Fetching Edit Data for ID:", id);

        // 2️⃣ Ambil List Proyek & Detail Pekerjaan secara parallel
        const [proyekRes, pekerjaanRes] = await Promise.all([
            api.get('/proyek'),
            api.get(`/pekerjaan/${id}`)
        ]);

        // ---------------------------------------------
        // ANALISIS DATA PROYEK (Mencegah Crash di .map)
        // ---------------------------------------------
        console.log("Raw Response Proyek:", proyekRes.data);
        
        let listProyek = [];
        // Cek apakah dibungkus .data (Laravel Resource) atau array langsung
        if (Array.isArray(proyekRes.data)) {
            listProyek = proyekRes.data;
        } else if (proyekRes.data?.data && Array.isArray(proyekRes.data.data)) {
            listProyek = proyekRes.data.data;
        } else {
            console.warn("Struktur data proyek tidak dikenali, set ke array kosong.");
            listProyek = [];
        }
        setProjects(listProyek);


        // ---------------------------------------------
        // ANALISIS DATA PEKERJAAN
        // ---------------------------------------------
        console.log("Raw Response Pekerjaan:", pekerjaanRes.data);

        // Cek pembungkus data
        const resData = pekerjaanRes.data.data || pekerjaanRes.data;
        
        // Cek apakah data ada di properti 'pekerjaan' atau langsung di root
        const item = resData.pekerjaan || resData;

        if (!item) {
            throw new Error("Data pekerjaan kosong/tidak ditemukan");
        }

        // Set Form
        setForm({
          id_proyek: item.id_proyek || '', // Fallback string kosong biar ga uncontrolled input
          nama_pekerjaan: item.nama_pekerjaan || '',
          keterangan: item.keterangan || '',
        });

      } catch (err) {
        console.error("ERROR FETCH DATA:", err);
        alert('Gagal mengambil data proyek');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, onClose]);

  // Jika masih loading atau form belum ke-set, jangan render apapun
  if (loading || !form) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      await api.put(`/pekerjaan/${id}`, form);
      alert('Berhasil update pekerjaan!');
      onClose();
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal mengupdate pekerjaan');
    }
  };

  return (
    <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
        
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Edit Pekerjaan</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* INPUT PROYEK */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Proyek</label>
            <select
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.id_proyek}
              onChange={e => setForm({ ...form, id_proyek: e.target.value })}
              required
            >
              <option value="">-- Pilih Proyek --</option>
              {/* Gunakan Optional Chaining (?.) untuk mencegah crash jika projects undefined */}
              {projects?.length > 0 ? (
                projects.map((p) => (
                  <option key={p.id_proyek} value={p.id_proyek}>
                    {p.nama_proyek}
                  </option>
                ))
              ) : (
                <option disabled>Tidak ada data proyek</option>
              )}
            </select>
          </div>

          {/* INPUT NAMA PEKERJAAN */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nama Pekerjaan</label>
            <input
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.nama_pekerjaan}
              onChange={e => setForm({ ...form, nama_pekerjaan: e.target.value })}
              required
            />
          </div>

          {/* INPUT KETERANGAN */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Keterangan (Opsional)</label>
            <textarea
              rows={3}
              className="form-control"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })}
            />
          </div>

          {/* BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button 
              type="submit" 
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}