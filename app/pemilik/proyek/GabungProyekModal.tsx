'use client';

import { useState } from 'react';
import api from '@/lib/axios'; // Gunakan Axios Helper

export default function GabungProyekModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (proyek: any) => void;
}) {
  const [kodeProyek, setKodeProyek] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!kodeProyek) return alert('Kode proyek wajib diisi');

    try {
      setLoading(true);

      // Gunakan api.post
      const res = await api.post('/pemilik/proyek/gabung', { kode_proyek: kodeProyek });

      // Handle response sukses
      const data = res.data.data || res.data; // Ambil object 'proyek' dari dalam wrapper
      
      alert('Berhasil bergabung ke proyek!');
      onSuccess(data.proyek || data); // Kirim data proyek baru ke parent
      
    } catch (err: any) {
      console.error(err);
      // Tampilkan pesan error dari backend (misal: "Kode salah" atau "Sudah gabung")
      const msg = err.response?.data?.message || 'Gagal gabung proyek';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" style={{display:'flex', alignItems:'center', justifyContent:'center', position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999}}>
      <div className="modal-content" style={{background:'white', width:400, padding:20, borderRadius:8}}>
        <div className="modal-header" style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
          <h2 style={{margin:0, fontSize:'1.2rem'}}>Gabung Proyek</h2>
          <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Kode Proyek</label>
            <input
              className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}}
              value={kodeProyek}
              onChange={e => setKodeProyek(e.target.value)}
              placeholder="Masukkan Kode Unik"
              required
            />
            <small style={{color:'#666', marginTop:5, display:'block'}}>*Dapatkan kode unik dari Kontraktor Anda</small>
          </div>

          <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:10}}>
            <button
              type="button"
              className="btn-secondary"
              style={{padding:'8px 15px', background:'#eee', border:'none', borderRadius:4, cursor:'pointer'}}
              onClick={onClose}
            >
              Batal
            </button>
            <button 
              type="submit"
              className="btn-primary" 
              disabled={loading}
              style={{padding:'8px 15px', background:'#007bff', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}
            >
              {loading ? 'Memproses...' : 'Gabung'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}