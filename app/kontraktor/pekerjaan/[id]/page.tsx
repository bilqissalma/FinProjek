'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function DetailPekerjaanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pekerjaan, setPekerjaan] = useState<any>(null);
  const [subPekerjaan, setSubPekerjaan] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/pekerjaan/${id}`)
      .then(res => {
        setPekerjaan(res.data.pekerjaan);
        setSubPekerjaan(res.data.sub_pekerjaan || []);
      })
      .catch(() => {
        alert('Pekerjaan tidak ditemukan');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <p>Loading...</p>;
  if (!pekerjaan) return null;

  return (
    <main className="main-content">
      {/* ================= HEADER ================= */}
      <div className="flex-between mb-4">
        <div>
          <h1>Detail Pekerjaan</h1>
          <p style={{ color: '#6b7280' }}>
            {pekerjaan.nama_pekerjaan}
          </p>
        </div>

        <button className="btn" onClick={() => router.back()}>
          ← Kembali
        </button>
      </div>

      {/* ================= INFO ================= */}
      <div className="card grid-2 gap-3 mb-4">
        <div>
          <label>Nama Pekerjaan</label>
          <p>{pekerjaan.nama_pekerjaan}</p>
        </div>

        <div>
          <label>ID Proyek</label>
          <p>{pekerjaan.id_proyek}</p>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label>Keterangan</label>
          <p>{pekerjaan.keterangan || '-'}</p>
        </div>
      </div>

      {/* ================= SUB PEKERJAAN ================= */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Daftar Sub Pekerjaan</h3>

        {subPekerjaan.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: 16 }}>
            Belum ada sub pekerjaan
          </p>
        ) : (
          <table>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ width: 80 }}>No</th>
                <th>Nama Sub Pekerjaan</th>
              </tr>
            </thead>
            <tbody>
              {subPekerjaan.map((s, i) => (
                <tr key={s.id_sub} className="table-row-hover">
                  <td>{i + 1}</td>
                  <td>{s.nama_sub}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
