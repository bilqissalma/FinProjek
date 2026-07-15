'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/url';

// Ganti localhost dengan domain API Anda agar gambar muncul di production

type Proyek = {
  id_proyek: number;
  nama_proyek: string;
};

type ProgressItem = {
  id_progress: number;
  judul_update: string | null;
  deskripsi: string | null;
  persentase: number;
  foto_progress: string | null;
  tgl_update: string;
};

export default function DetailProgresPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [proyek, setProyek] = useState<Proyek | null>(null);
  const [progressList, setProgressList] = useState<ProgressItem[]>([]);
  const [persentaseTerakhir, setPersentaseTerakhir] = useState(0);

  const fetchDetail = async () => {
    try {
      // Gunakan api.get
      const res = await api.get(`/progres/${id}`);
      
      // Handle Wrapper (Laravel API Resource)
      const data = res.data.data || res.data;

      setProyek(data.proyek);
      
      // Safety check array
      setProgressList(Array.isArray(data.progress_list) ? data.progress_list : []);
      
      setPersentaseTerakhir(data.persentase_terakhir || 0);
    } catch (err) {
      console.error("Gagal load detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <p className="main-content">Loading...</p>;

  return (
    <main className="main-content">
      {/* ===== HEADER ===== */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h1 className="title-inline" style={{margin: 0}}>Detail Progres</h1>
          {proyek && (
            <p className="project-title" style={{color: '#666', marginTop: 4}}>
                Proyek: <strong>{proyek.nama_proyek}</strong>
            </p>
          )}
        </div>

        <button
            className="btn-primary"
            onClick={() => router.push(`/kontraktor/progres/${id}/tambah`)}
        >
            + Upload Progres
        </button>
      </div>

      {/* ===== PROGRESS SAAT INI ===== */}
      <section className="card section-spacing" style={{marginBottom: 32}}>
        <h3>Status Saat Ini</h3>

        <div className="progress-bar" style={{height: 20, background: '#eee', borderRadius: 10, overflow: 'hidden', marginTop: 10, marginBottom: 10}}>
          <div
            className="progress-fill"
            style={{ 
                width: `${persentaseTerakhir}%`, 
                height: '100%', 
                background: persentaseTerakhir >= 100 ? '#10b981' : '#3b82f6',
                transition: 'width 0.5s ease'
            }}
          />
        </div>

        <p style={{fontWeight: 'bold', textAlign: 'right'}}>{persentaseTerakhir}% Selesai</p>
      </section>

      {/* ===== RIWAYAT PROGRES ===== */}
      <section className="card section-spacing">
        <h3>Riwayat Pengerjaan</h3>

        {progressList.length === 0 ? (
          <p style={{color: '#888', fontStyle: 'italic'}}>Belum ada update progres.</p>
        ) : (
          <div className="timeline">
            {progressList.map((item, index) => {
              // Bersihkan path file (kadang backend simpan full path, kadang relative)
              // Kita asumsikan backend kirim relative path (misal: "progress/foto.jpg")
              const fileUrl = item.foto_progress
                ? getStorageUrl(item.foto_progress)
                : null;
              return (
                <div key={item.id_progress} className="timeline-item horizontal" style={{display: 'flex', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #eee'}}>

                  {/* BADGE NOMOR */}
                  <div className="timeline-badge styled" style={{
                      minWidth: 40, height: 40, borderRadius: '50%', background: '#3b82f6', color: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    <span>{progressList.length - index}</span>
                  </div>

                  {/* CARD */}
                  <div className="timeline-card" style={{flex: 1, display: 'flex', gap: 20, flexWrap: 'wrap'}}>
                    
                    {/* MEDIA */}
                    <div className="timeline-media" style={{width: 200, flexShrink: 0}}>
                      {fileUrl ? (
                        item.foto_progress?.endsWith('.mp4') ? (
                          <video
                            src={fileUrl}
                            controls
                            style={{width: '100%', borderRadius: 8}}
                          />
                        ) : (
                          <img
                            src={fileUrl}
                            alt="Dokumentasi"
                            style={{width: '100%', borderRadius: 8, objectFit: 'cover', border: '1px solid #ddd'}}
                          />
                        )
                      ) : (
                        <div className="no-media" style={{
                            width: '100%', height: 120, background: '#f9f9f9', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', color: '#ccc', borderRadius: 8, fontSize: '0.8rem'
                        }}>
                          Tidak ada foto
                        </div>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="timeline-info" style={{flex: 1}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <strong className="progress-title" style={{fontSize: '1.1rem'}}>
                            {item.judul_update || `Update Mingguan`}
                        </strong>
                        <span className="badge" style={{background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem'}}>
                            +{item.persentase}%
                        </span>
                      </div>

                      <small className="progress-date" style={{color: '#999', display: 'block', marginBottom: 8}}>
                        {new Date(item.tgl_update).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                      </small>

                      {item.deskripsi && (
                        <p className="progress-desc" style={{color: '#444', lineHeight: 1.5}}>
                          {item.deskripsi}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}