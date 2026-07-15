'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios'; // Gunakan Axios Helper
import GabungProyekModal from './GabungProyekModal';

interface Proyek {
  id_proyek: number;
  nama_proyek: string;
  tgl_mulai: string | null;
  status: string;
}

export default function ProyekPemilikPage() {
  const router = useRouter();
  const [proyek, setProyek] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Gunakan api.get, otomatis handle token & URL
    api.get('/pemilik/proyek')
      .then(res => {
        const raw = res.data.data || res.data;
        setProyek(Array.isArray(raw) ? raw : []);
      })
      .catch(err => console.error("Gagal load proyek:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="main-content">Loading...</p>;

  return (
    <>
      <main className="main-content">
        <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1>Proyek Saya</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Gabung Proyek
          </button>
        </div>

        <div className="card">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Nama Proyek</th>
                <th>Tanggal Mulai</th>
                <th>Status</th>
                <th style={{textAlign:'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {proyek.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                    Anda belum tergabung dalam proyek apapun. Silakan minta kode proyek ke kontraktor.
                  </td>
                </tr>
              ) : (
                proyek.map(p => (
                  <tr key={p.id_proyek}>
                    <td><strong>{p.nama_proyek}</strong></td>
                    <td>
                      {p.tgl_mulai
                        ? new Date(p.tgl_mulai).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})
                        : '-'}
                    </td>
                    <td>
                        <span className={`badge badge-${p.status === 'Selesai' ? 'green' : 'blue'}`}>
                            {p.status}
                        </span>
                    </td>
                    <td style={{textAlign:'center'}}>
                      <button
                        className="btn-outline"
                        style={{padding:'5px 10px', fontSize:'0.9rem'}}
                        onClick={() =>
                          router.push(`/pemilik/proyek/${p.id_proyek}`)
                        }
                      >
                        Lihat Progres
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <GabungProyekModal
          onClose={() => setShowModal(false)}
          onSuccess={(p: Proyek) => {
            // Tambahkan proyek baru ke list tanpa reload
            setProyek(prev => [...prev, p]);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}