'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function DetailPengeluaranPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pengeluaran, setPengeluaran] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/pengeluaran/${id}`)
      .then(res => {
        setPengeluaran(res.data.pengeluaran);
        setDetails(res.data.details);
      })
      .catch(() => {
        alert('Data pengeluaran tidak ditemukan');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <p>Loading...</p>;
  if (!pengeluaran) return null;

  return (
    <main className="main-content">
      {/* ================= HEADER ================= */}
      <div className="flex-between mb-4">
        <div>
          <h1>Detail Pengeluaran</h1>
          <p style={{ color: '#6b7280' }}>
            No Nota: {pengeluaran.no_nota || '-'}
          </p>
        </div>

        <button className="btn" onClick={() => router.back()}>
          ← Kembali
        </button>
      </div>

      {/* ================= INFO ================= */}
      <div className="card grid-3 gap-3 mb-4">
        <div>
          <label>Proyek</label>
          <p>{pengeluaran.nama_proyek || pengeluaran.id_proyek}</p>
        </div>

        <div>
          <label>Tanggal</label>
          <p>
            {pengeluaran.tgl_transaksi
              ? new Date(pengeluaran.tgl_transaksi).toLocaleDateString('id-ID')
              : '-'}
          </p>
        </div>

        <div>
          <label>Spesifikasi</label>
          <p>{pengeluaran.spesifikasi || '-'}</p>
        </div>
      </div>

      {/* ================= ITEM ================= */}
      <div className="card">
        <table>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th>Nama Item</th>
              <th>Banyak</th>
              <th>Harga Satuan</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d, i) => (
              <tr key={i} className="table-row-hover">
                <td>{d.nama_item}</td>
                <td>{d.banyak}</td>
                <td>Rp {Number(d.harga_satuan).toLocaleString('id-ID')}</td>
                <td>
                  Rp {(d.banyak * d.harga_satuan).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= DISTRIBUSI ================= */}
      {details.some(d => d.distribusi?.length > 0) && (
        <div className="card mt-4">
          <h3>Distribusi Material</h3>

          {details.map((d, i) =>
            d.distribusi?.length > 0 && (
              <div key={i} style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 8 }}>
                  {i + 1}. {d.nama_item}
                </h4>

                {d.distribusi.map((dist: any, j: number) => (
                  <div
                    key={j}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 8,
                      borderRadius: 8,
                      background: '#f9fafb',
                      borderLeft: '4px solid #cbd5e1'
                    }}
                  >
                    <div><strong>Pekerjaan:</strong> {dist.nama_pekerjaan}</div>
                    <div><strong>Sub:</strong> {dist.nama_sub}</div>
                    <div><strong>Rasio:</strong> {dist.rasio_penggunaan}%</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}
