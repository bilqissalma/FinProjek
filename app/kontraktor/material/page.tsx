'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import React from 'react';

export default function MaterialPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [proyek, setProyek] = useState<any[]>([]);
  const [pekerjaan, setPekerjaan] = useState<any[]>([]);
  const [sub, setSub] = useState<any[]>([]);

  const [filter, setFilter] = useState({
    id_proyek: '',
    id_pekerjaan: '',
    id_sub: '',
    start: '',
    end: '',
  });

  const fetchMaterial = () => {
    api
      .get('/material', { params: filter })
      .then(res => setRows(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    api.get('/dropdown/proyek').then(res => setProyek(res.data));
    fetchMaterial();
  }, []);

  useEffect(() => {
    if (!filter.id_proyek) return setPekerjaan([]);
    api
      .get(`/dropdown/pekerjaan/${filter.id_proyek}`)
      .then(res => setPekerjaan(res.data));
  }, [filter.id_proyek]);

  useEffect(() => {
    if (!filter.id_pekerjaan) return setSub([]);
    api
      .get(`/dropdown/sub/${filter.id_pekerjaan}`)
      .then(res => setSub(res.data));
  }, [filter.id_pekerjaan]);

  /* ======================
     DATA GRAFIK
  ====================== */
  const chartData = useMemo(() => {
    const map: Record<string, any> = {};

    rows.forEach(r => {
      const tanggal = r.tgl_transaksi || 'Unknown';

      if (!map[tanggal]) {
        map[tanggal] = {
          tanggal,
          material: 0,
          tenaga: 0,
        };
      }

      if (r.spesifikasi === 'Material') {
        map[tanggal].material += Number(r.biaya_pakai || 0);
      }

      if (r.spesifikasi === 'Tenaga') {
        map[tanggal].tenaga += Number(r.biaya_pakai || 0);
      }
    });

    return Object.values(map);
  }, [rows]);

  return (
    <main className="main-content">
      <h1>Material / Tenaga</h1>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>
        Rekap penggunaan material & tenaga kerja
      </p>

      {/* FILTER */}
      <div className="card" style={filterCardStyle}>
        {[
          {
            value: filter.id_proyek,
            label: 'Proyek',
            list: proyek,
            key: 'id_proyek',
            name: 'nama_proyek',
            width: 150,
          },
          {
            value: filter.id_pekerjaan,
            label: 'Pekerjaan',
            list: pekerjaan,
            key: 'id_pekerjaan',
            name: 'nama_pekerjaan',
            width: 160,
          },
          {
            value: filter.id_sub,
            label: 'Sub',
            list: sub,
            key: 'id_sub',
            name: 'nama_sub',
            width: 140,
          },
        ].map((f, i) => (
          <select
            key={i}
            value={f.value}
            onChange={e =>
              setFilter({ ...filter, [f.key]: e.target.value })
            }
            style={{
              width: f.width,
              minWidth: f.width,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          >
            <option value="">{f.label}</option>
            {f.list.map((x: any) => (
              <option key={x[f.key]} value={x[f.key]}>
                {x[f.name]}
              </option>
            ))}
          </select>
        ))}

        <input
          type="date"
          value={filter.start}
          onChange={e =>
            setFilter({ ...filter, start: e.target.value })
          }
          style={dateStyle}
        />
        <input
          type="date"
          value={filter.end}
          onChange={e =>
            setFilter({ ...filter, end: e.target.value })
          }
          style={dateStyle}
        />

        <button className="btn btn-primary" onClick={fetchMaterial}>
          Terapkan
        </button>
      </div>

      {/* GRAFIK */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Grafik Biaya Material vs Tenaga</h3>

        {chartData.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>Tidak ada data grafik</p>
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="tanggal" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="material" fill="#3b82f6" />
                <Bar dataKey="tenaga" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="card" style={{ marginTop: 24, padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {[
                  'Tanggal',
                  'Item',
                  'Spesifikasi',
                  'Proyek',
                  'Pekerjaan',
                  'Sub',
                  'Biaya',
                ].map(h => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.tgl_transaksi}</td>
                    <td>{r.nama_item}</td>
                    <td>
                      <strong
                        style={{
                          color:
                            r.spesifikasi === 'Material'
                              ? '#2563eb'
                              : '#ea580c',
                        }}
                      >
                        {r.spesifikasi}
                      </strong>
                    </td>
                    <td>{r.nama_proyek}</td>
                    <td>{r.nama_pekerjaan}</td>
                    <td>{r.nama_sub}</td>
                    <td style={{ fontWeight: 600 }}>
                      Rp {Number(r.biaya_pakai).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

/* ================= STYLE (FIXED) ================= */

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  background: '#f3f4f6',
  padding: 12,
  fontSize: 12,
  textTransform: 'uppercase',
  color: '#6b7280',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 24,
  color: '#9ca3af',
};

const dateStyle: React.CSSProperties = {
  width: 130,
  minWidth: 130,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

const filterCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'nowrap',
  overflowX: 'auto',
  padding: 14,
  borderRadius: 12,
};
