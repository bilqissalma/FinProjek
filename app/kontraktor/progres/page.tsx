'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios'; // Gunakan axios instance yang sudah ada

type Proyek = {
  id_proyek: number;
  nama_proyek: string;
  progres: number | string | null; 
};

export default function ProgresPage() {
  const router = useRouter();
  const [data, setData] = useState<Proyek[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
 
    api.get('/progres') 
      .then(res => {
        // Ambil data dari wrapper .data.data (jika ada) atau .data langsung
        const rawData = res.data.data || res.data;

        const list = Array.isArray(rawData) ? rawData : [];
        setData(list);
      })
      .catch(err => {
        console.error("Gagal load progres:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="main-content">Loading data progres...</p>;

  return (
    <main className="main-content">
      <div style={{ marginBottom: 24 }}>
        <h1>Progres Proyek</h1>
        <p style={{ color: '#666' }}>Monitoring persentase penyelesaian proyek</p>
      </div>

      <div className="card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Nama Proyek</th>
              <th style={{ width: '40%' }}>Status Penyelesaian</th>
              <th className="center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty">
                  Belum ada proyek yang berjalan.
                </td>
              </tr>
            ) : (
              data.map(item => {
                const rawProgres = Number(item.progres) || 0;
                const value = Math.min(100, Math.max(0, rawProgres));

                let barColor = '#3b82f6';
                if (value >= 100) barColor = '#10b981';
                else if (value < 20) barColor = '#f59e0b';

                return (
                  <tr key={item.id_proyek}>
                    <td style={{ fontWeight: 500 }}>{item.nama_proyek}</td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ 
                          flex: 1, 
                          height: 8, 
                          background: '#e5e7eb', 
                          borderRadius: 4,
                          overflow: 'hidden' 
                        }}>
                          <div
                            style={{ 
                              width: `${value}%`, 
                              height: '100%', 
                              background: barColor,
                              transition: 'width 0.5s ease'
                            }}
                          />
                        </div>
                        <span style={{ minWidth: 40, textAlign: 'right', fontWeight: 'bold', color: '#444' }}>
                          {Math.round(value)}%
                        </span>
                      </div>
                    </td>

                    <td className="center">
                      <button
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                        onClick={() =>
                          router.push(`/kontraktor/progres/${item.id_proyek}`)
                        }
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}