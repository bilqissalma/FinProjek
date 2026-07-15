'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios'; // Gunakan Axios helper

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function TambahProgresPage() {
  const { id } = useParams();
  const router = useRouter();

  const [persentaseTerakhir, setPersentaseTerakhir] = useState(0);
  const [tambahPersen, setTambahPersen] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/progres/${id}`)
      .then(res => {
        const data = res.data.data || res.data;
        setPersentaseTerakhir(data.persentase_terakhir ?? 0);
      })
      .catch(err => {
        console.error("Gagal load data:", err);
      });
  }, [id]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `File "${file.name}" terlalu besar. Maksimal 20MB per file.`
        );
        return;
      }
    }

    setFiles(selectedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId) {
        alert("ID Proyek tidak valid");
        setLoading(false);
        return;
    }

    try {
      const fd = new FormData();

      fd.append('id_proyek', projectId as string); 

      fd.append('judul_update', judul);
      fd.append('deskripsi', deskripsi);
      fd.append('tambah_persentase', tambahPersen);

      if (files.length > 0) {
        fd.append('dokumen', files[0]);
      }

      await api.post(`/progres/${projectId}`, fd, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
      });

      alert('Progres berhasil ditambahkan');
      router.push(`/kontraktor/progres/${projectId}`);

    } catch (err: any) {
      console.error(err);

      const errorData = err.response?.data;
      if (errorData?.errors) {
         const errorMessages = Object.values(errorData.errors).flat().join('\n');
         alert(`Validasi Gagal:\n${errorMessages}`);
      } else {
         alert(errorData?.message || 'Gagal menambahkan progres');
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-content">
      <h1 className="title">Upload Progres</h1>

      <section className="card">
        <form onSubmit={handleSubmit} className="form">
          <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold'}}>Persentase Saat Ini</label>
          <input 
            className="form-control" style={{width: '100%', padding: 8, marginBottom: 16, background: '#f0f0f0'}}
            value={`${persentaseTerakhir}%`} 
            disabled 
          />

          <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold'}}>Tambah Persentase (%)</label>
          <input
            type="number"
            className="form-control" style={{width: '100%', padding: 8, marginBottom: 16}}
            value={tambahPersen}
            onChange={e => setTambahPersen(e.target.value)}
            required
            min="0"
            max={100 - persentaseTerakhir}
          />

          <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold'}}>Judul Update</label>
          <input
            className="form-control" style={{width: '100%', padding: 8, marginBottom: 16}}
            value={judul}
            onChange={e => setJudul(e.target.value)}
            placeholder="Contoh: Pekerjaan Struktur"
            required
          />

          <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold'}}>Deskripsi</label>
          <textarea
            className="form-control" style={{width: '100%', padding: 8, marginBottom: 16}}
            value={deskripsi}
            onChange={e => setDeskripsi(e.target.value)}
            rows={4}
          />

          <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold'}}>Upload Foto/Video</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{marginBottom: 16}}
          />

          {files.length > 0 && (
            <ul className="file-list" style={{marginBottom: 20, paddingLeft: 20, color: '#666'}}>
              {files.map((file, i) => (
                <li key={i}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          )}

          <button className="btn btn-primary" disabled={loading} style={{width: '100%', padding: 12}}>
            {loading ? 'Menyimpan...' : 'Simpan Progres'}
          </button>
        </form>
      </section>
    </main>
  );
}