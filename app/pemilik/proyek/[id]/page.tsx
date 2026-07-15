'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/url';

type Proyek = {
  id_proyek: number;
  nama_proyek: string;
  lokasi: string | null;
  biaya_kesepakatan: number | null;
  dokumen_mou: string | null;
  tgl_mulai: string | null;
  tgl_selesai: string | null;
  status: string | null;
};

type ProgressItem = {
  id_progress: number;
  judul_update: string | null;
  deskripsi: string | null;
  persentase: number;
  foto_progress: string | null;
  tgl_update: string;
};

export default function DetailProyek() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [proyek, setProyek] = useState<Proyek | null>(null);
  const [progressList, setProgressList] = useState<ProgressItem[]>([]);
  const [persentaseTerakhir, setPersentaseTerakhir] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Gunakan api.get
        const res = await api.get(`/pemilik/proyek/${id}/progress`);
        
        // Handle wrapper .data atau .data.data
        const data = res.data.data || res.data;

        setProyek(data.proyek ?? null);
        setProgressList(Array.isArray(data.progress_list) ? data.progress_list : []);
        setPersentaseTerakhir(data.persentase_terakhir ?? 0);
      } catch (err: any) {
        console.error(err);
        setError("Gagal memuat data proyek. Mungkin Anda tidak memiliki akses.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [id]);

  if (loading) return <p className="main-content">Loading detail proyek...</p>;

  if (error)
    return (
      <main className="main-content">
        <div style={{textAlign:'center', padding:40, color:'#d32f2f'}}>
            <h3>Error</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => router.back()}>Kembali</button>
        </div>
      </main>
    );

  return (
    <main className="main-content">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <h1 className="title-inline">
          <span>Detail Proyek</span>
          {proyek && <span style={{color:'#666', fontSize:'0.6em', marginLeft:10}}>#{proyek.nama_proyek}</span>}
        </h1>
      </div>

      {/* ===== DETAIL PROYEK ===== */}
      {proyek && (
        <section className="card section-spacing" style={{marginBottom:30}}>
          <h3 style={{borderBottom:'1px solid #eee', paddingBottom:10}}>Informasi Proyek</h3>
          <table className="project-detail-table" style={{width:'100%', borderCollapse:'collapse'}}>
            <tbody>
              <tr>
                <td style={{padding:10, fontWeight:'bold', width:'30%'}}>Nama Proyek</td>
                <td style={{padding:10}}>{proyek.nama_proyek}</td>
              </tr>
              <tr>
                <td style={{padding:10, fontWeight:'bold'}}>Lokasi</td>
                <td style={{padding:10}}>{proyek.lokasi || '-'}</td>
              </tr>
              <tr>
                <td style={{padding:10, fontWeight:'bold'}}>Biaya Kesepakatan</td>
                <td style={{padding:10, color:'#2563eb', fontWeight:'bold'}}>
                  {proyek.biaya_kesepakatan
                    ? `Rp ${Number(proyek.biaya_kesepakatan).toLocaleString('id-ID')}`
                    : '-'}
                </td>
              </tr>
              <tr>
                <td style={{padding:10, fontWeight:'bold'}}>Tanggal Mulai</td>
                <td style={{padding:10}}>{proyek.tgl_mulai ? new Date(proyek.tgl_mulai).toLocaleDateString('id-ID') : '-'}</td>
              </tr>
              <tr>
                <td style={{padding:10, fontWeight:'bold'}}>Tanggal Selesai</td>
                <td style={{padding:10}}>{proyek.tgl_selesai ? new Date(proyek.tgl_selesai).toLocaleDateString('id-ID') : '-'}</td>
              </tr>
              <tr>
                <td style={{padding:10, fontWeight:'bold'}}>Dokumen MOU</td>
                <td style={{padding:10}}>
                  {proyek.dokumen_mou ? (
                    <a
                      href={getStorageUrl(proyek.dokumen_mou)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline"
                      style={{textDecoration:'none', fontSize:'0.9rem', padding:'4px 10px'}}
                    >
                      📄 Lihat Dokumen
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
              <tr>
                <td style={{padding:10, fontWeight:'bold'}}>Status</td>
                <td style={{padding:10}}>
                    <span className="badge" style={{background:'#eee', padding:'4px 8px', borderRadius:4}}>{proyek.status || '-'}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* ===== PROGRES SAAT INI ===== */}
      <section className="card section-spacing" style={{marginBottom:30}}>
        <h3>Progres Pengerjaan</h3>

        <div className="progress-bar" style={{height:20, background:'#eee', borderRadius:10, overflow:'hidden', margin:'10px 0'}}>
          <div className="progress-fill" style={{ width: `${persentaseTerakhir}%`, height:'100%', background: persentaseTerakhir >= 100 ? '#10b981' : '#3b82f6', transition:'width 0.5s ease' }} />
        </div>

        <p style={{fontWeight:'bold', textAlign:'right'}}>{persentaseTerakhir}% Selesai</p>
      </section>

      {/* ===== RIWAYAT PROGRES ===== */}
      <section className="card section-spacing">
        <h3>Laporan Harian / Mingguan</h3>

        {progressList.length === 0 ? (
            <p style={{color:'#888', fontStyle:'italic', padding:20, textAlign:'center'}}>
                Belum ada update progres dari kontraktor.
            </p>
        ) : (
            <div className="timeline">
            {progressList.map((item, index) => {
                // Generate URL file
                const fileUrl = item.foto_progress
                ? getStorageUrl(item.foto_progress)
                : null;

                return (
                    <div key={item.id_progress} className="timeline-item horizontal" style={{display:'flex', gap:20, marginBottom:20, borderBottom:'1px solid #f0f0f0', paddingBottom:20}}>
                    {/* BADGE */}
                    <div className="timeline-badge styled" style={{minWidth:40, height:40, borderRadius:'50%', background:'#3b82f6', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                        <span>{progressList.length - index}</span>
                    </div>

                    {/* CARD */}
                    <div className="timeline-card" style={{flex:1, display:'flex', gap:20, flexWrap:'wrap'}}>
                        {/* MEDIA */}
                        <div className="timeline-media" style={{width:200, flexShrink:0}}>
                        {fileUrl ? (
                            item.foto_progress?.endsWith('.mp4') ? (
                            <video src={fileUrl} controls style={{width:'100%', borderRadius:8}} />
                            ) : (
                            <img src={fileUrl} alt="Dokumentasi" style={{width:'100%', borderRadius:8, border:'1px solid #ddd'}} />
                            )
                        ) : (
                            <div className="no-media" style={{width:'100%', height:120, background:'#f9f9f9', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', borderRadius:8}}>
                                Tidak ada foto
                            </div>
                        )}
                        </div>

                        {/* INFO */}
                        <div className="timeline-info" style={{flex:1}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <strong className="progress-title" style={{fontSize:'1.1rem'}}>{item.judul_update || 'Update Progres'}</strong>
                            <span className="badge" style={{background:'#e0f2fe', color:'#0369a1', padding:'2px 8px', borderRadius:4, fontSize:'0.8rem'}}>+{item.persentase}%</span>
                        </div>

                        <small className="progress-date" style={{color:'#999', display:'block', marginBottom:8}}>
                            {new Date(item.tgl_update).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
                        </small>

                        {item.deskripsi && <p className="progress-desc" style={{color:'#444', lineHeight:1.5}}>{item.deskripsi}</p>}
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