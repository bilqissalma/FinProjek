'use client';

import { useState } from 'react';
import api from '@/lib/axios';

export default function TambahProyekModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData();

    // Mapping Data
    formData.append('nama_proyek', (form.elements.namedItem('nama') as HTMLInputElement).value);
    formData.append('lokasi', (form.elements.namedItem('lokasi') as HTMLInputElement).value);
    formData.append('biaya_kesepakatan', (form.elements.namedItem('biaya') as HTMLInputElement).value);
    formData.append('tgl_mulai', (form.elements.namedItem('tgl_mulai') as HTMLInputElement).value);
    formData.append('tgl_selesai', (form.elements.namedItem('tgl_selesai') as HTMLInputElement).value);

    // Dokumen MOU
    const mouInput = form.elements.namedItem('mou') as HTMLInputElement;
    if (mouInput.files && mouInput.files.length > 0) {
      formData.append('dokumen_mou', mouInput.files[0]);
    }

    try {
      const response = await api.post(
        '/proyek',
        formData
      );
      
      const result = response.data;
    
      alert('Proyek berhasil ditambahkan!');
      onClose();
      window.location.reload(); 
      
    } catch (err: any) {
      console.error("Error Upload:", err);
      
      if (err.message === "Sesi kadaluarsa. Silakan login ulang.") {
          alert(err.message);
          return;
      }
      if (err.message.includes("Trial")) {
        alert(err.message);
        return;
    }
      const errorData = err.response?.data;
      if (errorData?.errors) {
         const msg = Object.values(errorData.errors).flat().join('\n');
         alert(`Gagal Validasi:\n${msg}`);
      } else {
         alert(errorData?.message || 'Gagal menambahkan proyek');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999}}>
      <div className="modal-content" style={{background:'white', padding:30, borderRadius:8, width:500, maxWidth:'95%'}}>
        <div className="modal-header" style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
          <h2 style={{margin:0}}>Tambah Proyek Baru</h2>
          <button type="button" className="modal-close" onClick={onClose} style={{background:'transparent', border:'none', fontSize:24, cursor:'pointer'}}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Nama Proyek</label>
            <input name="nama" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Lokasi</label>
            <input name="lokasi" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Biaya Kesepakatan (Rp)</label>
            <input name="biaya" type="number" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Tanggal Mulai</label>
            <input name="tgl_mulai" type="date" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Tanggal Selesai</label>
            <input name="tgl_selesai" type="date" className="form-control" style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required />
          </div>

          <div className="form-group" style={{marginBottom:20}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Dokumen MOU (PDF/DOC) - Opsional</label>
            <input 
                name="mou" 
                type="file" 
                accept=".pdf,.doc,.docx"
                className="form-control"
            />
          </div>

          <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:10}}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{padding:'10px 20px', background:'#eee', border:'none', borderRadius:4, cursor:'pointer'}}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{padding:'10px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>
              {loading ? 'Menyimpan...' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}