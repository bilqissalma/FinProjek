'use client';

import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

type MaterialRow = {
  id_distribusi?: number | string;
  id_detail?: number | string;
  id_pengeluaran?: number | string;

  id_proyek?: number | string;
  id_pekerjaan?: number | string;
  id_sub?: number | string;

  tgl_transaksi?: string;
  nama_item?: string;
  spesifikasi?: string;

  nama_proyek?: string;
  nama_pekerjaan?: string;
  nama_sub?: string;

  biaya_pakai?: number | string;
};

type ProyekOption = {
  id_proyek: number | string;
  nama_proyek: string;
};

type PekerjaanOption = {
  id_pekerjaan: number | string;
  nama_pekerjaan: string;
};

type SubOption = {
  id_sub: number | string;
  nama_sub: string;
};

type FilterState = {
  id_proyek: string;
  id_pekerjaan: string;
  id_sub: string;
  start: string;
  end: string;
};

const emptyFilter: FilterState = {
  id_proyek: '',
  id_pekerjaan: '',
  id_sub: '',
  start: '',
  end: '',
};

/**
 * Menangani beberapa kemungkinan format respons API:
 * 1. [...]
 * 2. { data: [...] }
 * 3. { material: [...] }
 */
const normalizeList = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.material)) {
    return payload.material;
  }

  return [];
};

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const formatRupiah = (value: unknown) =>
  `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`;

const formatTanggal = (value?: string) => {
  if (!value) return '-';

  const tanggal = value.slice(0, 10);
  const [tahun, bulan, hari] = tanggal.split('-');

  if (!tahun || !bulan || !hari) {
    return value;
  }

  return `${hari}/${bulan}/${tahun}`;
};

export default function MaterialPage() {
  /*
   * allRows menyimpan seluruh data dari API.
   * rows yang ditampilkan diperoleh melalui proses filter di useMemo.
   */
  const [allRows, setAllRows] = useState<MaterialRow[]>([]);

  const [proyek, setProyek] = useState<ProyekOption[]>([]);
  const [pekerjaan, setPekerjaan] = useState<PekerjaanOption[]>([]);
  const [sub, setSub] = useState<SubOption[]>([]);

  /*
   * filter = nilai yang sedang dipilih pada form.
   * appliedFilter = nilai yang sudah diterapkan melalui tombol Terapkan.
   */
  const [filter, setFilter] = useState<FilterState>(emptyFilter);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(emptyFilter);

  const [loading, setLoading] = useState(true);
  const [loadingPekerjaan, setLoadingPekerjaan] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [error, setError] = useState('');

  /*
   * Mengambil seluruh data material dan daftar proyek.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        const [materialResponse, proyekResponse] = await Promise.all([
          api.get('/material'),
          api.get('/dropdown/proyek'),
        ]);

        setAllRows(
          normalizeList<MaterialRow>(materialResponse.data),
        );

        setProyek(
          normalizeList<ProyekOption>(proyekResponse.data),
        );
      } catch (err) {
        console.error('Gagal mengambil data material:', err);
        setError('Data material gagal dimuat.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  /*
   * Ketika proyek berubah:
   * - reset pekerjaan
   * - reset subpekerjaan
   * - ambil pekerjaan berdasarkan proyek
   */
  const handleProjectChange = async (idProyek: string) => {
    setFilter(previous => ({
      ...previous,
      id_proyek: idProyek,
      id_pekerjaan: '',
      id_sub: '',
    }));

    setPekerjaan([]);
    setSub([]);

    if (!idProyek) {
      return;
    }

    setLoadingPekerjaan(true);

    try {
      const response = await api.get(
        `/dropdown/pekerjaan/${idProyek}`,
      );

      setPekerjaan(
        normalizeList<PekerjaanOption>(response.data),
      );
    } catch (err) {
      console.error('Gagal mengambil pekerjaan:', err);
      setPekerjaan([]);
    } finally {
      setLoadingPekerjaan(false);
    }
  };

  /*
   * Ketika pekerjaan berubah:
   * - reset subpekerjaan
   * - ambil subpekerjaan berdasarkan pekerjaan
   */
  const handlePekerjaanChange = async (
    idPekerjaan: string,
  ) => {
    setFilter(previous => ({
      ...previous,
      id_pekerjaan: idPekerjaan,
      id_sub: '',
    }));

    setSub([]);

    if (!idPekerjaan) {
      return;
    }

    setLoadingSub(true);

    try {
      const response = await api.get(
        `/dropdown/sub/${idPekerjaan}`,
      );

      setSub(normalizeList<SubOption>(response.data));
    } catch (err) {
      console.error('Gagal mengambil subpekerjaan:', err);
      setSub([]);
    } finally {
      setLoadingSub(false);
    }
  };

  /*
   * Nama item terpilih digunakan sebagai alternatif pencocokan.
   * Hal ini berguna apabila respons /material tidak menyertakan ID,
   * tetapi menyertakan nama proyek, pekerjaan, dan subpekerjaan.
   */
  const selectedProjectName = useMemo(() => {
    return proyek.find(
      item =>
        String(item.id_proyek) === appliedFilter.id_proyek,
    )?.nama_proyek;
  }, [proyek, appliedFilter.id_proyek]);

  const selectedPekerjaanName = useMemo(() => {
    return pekerjaan.find(
      item =>
        String(item.id_pekerjaan) ===
        appliedFilter.id_pekerjaan,
    )?.nama_pekerjaan;
  }, [pekerjaan, appliedFilter.id_pekerjaan]);

  const selectedSubName = useMemo(() => {
    return sub.find(
      item => String(item.id_sub) === appliedFilter.id_sub,
    )?.nama_sub;
  }, [sub, appliedFilter.id_sub]);

  /*
   * Fungsi pencocokan berdasarkan ID.
   * Jika ID tidak tersedia pada respons, pencocokan memakai nama.
   */
  const matchFilter = (
    rowId: unknown,
    rowName: unknown,
    selectedId: string,
    selectedName?: string,
  ) => {
    if (!selectedId) {
      return true;
    }

    if (
      rowId !== undefined &&
      rowId !== null &&
      String(rowId) === selectedId
    ) {
      return true;
    }

    if (selectedName) {
      return (
        normalizeText(rowName) === normalizeText(selectedName)
      );
    }

    return false;
  };

  /*
   * Filter data material.
   */
  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      const cocokProyek = matchFilter(
        row.id_proyek,
        row.nama_proyek,
        appliedFilter.id_proyek,
        selectedProjectName,
      );

      const cocokPekerjaan = matchFilter(
        row.id_pekerjaan,
        row.nama_pekerjaan,
        appliedFilter.id_pekerjaan,
        selectedPekerjaanName,
      );

      const cocokSub = matchFilter(
        row.id_sub,
        row.nama_sub,
        appliedFilter.id_sub,
        selectedSubName,
      );

      const tanggal = String(
        row.tgl_transaksi ?? '',
      ).slice(0, 10);

      const cocokTanggalMulai =
        !appliedFilter.start ||
        tanggal >= appliedFilter.start;

      const cocokTanggalSelesai =
        !appliedFilter.end ||
        tanggal <= appliedFilter.end;

      return (
        cocokProyek &&
        cocokPekerjaan &&
        cocokSub &&
        cocokTanggalMulai &&
        cocokTanggalSelesai
      );
    });
  }, [
    allRows,
    appliedFilter,
    selectedProjectName,
    selectedPekerjaanName,
    selectedSubName,
  ]);

  /*
   * Data grafik berdasarkan hasil filter.
   */
  const chartData = useMemo(() => {
    const map = new Map<
      string,
      {
        tanggal: string;
        material: number;
        tenaga: number;
      }
    >();

    filteredRows.forEach(row => {
      const tanggal =
        String(row.tgl_transaksi ?? '').slice(0, 10) ||
        'Tidak diketahui';

      if (!map.has(tanggal)) {
        map.set(tanggal, {
          tanggal,
          material: 0,
          tenaga: 0,
        });
      }

      const current = map.get(tanggal);

      if (!current) return;

      const biaya = Number(row.biaya_pakai ?? 0);
      const spesifikasi = normalizeText(row.spesifikasi);

      if (spesifikasi === 'material') {
        current.material += biaya;
      }

      if (spesifikasi === 'tenaga') {
        current.tenaga += biaya;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.tanggal.localeCompare(b.tanggal),
    );
  }, [filteredRows]);

  const handleApplyFilter = () => {
    if (
      filter.start &&
      filter.end &&
      filter.start > filter.end
    ) {
      alert(
        'Tanggal mulai tidak boleh lebih besar dari tanggal selesai.',
      );
      return;
    }

    setAppliedFilter({ ...filter });
  };

  const handleResetFilter = () => {
    setFilter(emptyFilter);
    setAppliedFilter(emptyFilter);
    setPekerjaan([]);
    setSub([]);
  };

  return (
    <main className="main-content">
      <h1>Material / Tenaga</h1>

      <p
        style={{
          color: '#6b7280',
          marginBottom: 16,
        }}
      >
        Rekap penggunaan material dan tenaga kerja
      </p>

      {/* FILTER */}
      <div className="card" style={filterCardStyle}>
        <select
          value={filter.id_proyek}
          onChange={event =>
            handleProjectChange(event.target.value)
          }
          style={{
            ...selectStyle,
            width: 170,
            minWidth: 170,
          }}
        >
          <option value="">Semua Proyek</option>

          {proyek.map(item => (
            <option
              key={item.id_proyek}
              value={item.id_proyek}
            >
              {item.nama_proyek}
            </option>
          ))}
        </select>

        <select
          value={filter.id_pekerjaan}
          onChange={event =>
            handlePekerjaanChange(event.target.value)
          }
          disabled={
            !filter.id_proyek || loadingPekerjaan
          }
          style={{
            ...selectStyle,
            width: 180,
            minWidth: 180,
            opacity:
              !filter.id_proyek || loadingPekerjaan
                ? 0.6
                : 1,
          }}
        >
          <option value="">
            {loadingPekerjaan
              ? 'Memuat pekerjaan...'
              : 'Semua Pekerjaan'}
          </option>

          {pekerjaan.map(item => (
            <option
              key={item.id_pekerjaan}
              value={item.id_pekerjaan}
            >
              {item.nama_pekerjaan}
            </option>
          ))}
        </select>

        <select
          value={filter.id_sub}
          onChange={event =>
            setFilter(previous => ({
              ...previous,
              id_sub: event.target.value,
            }))
          }
          disabled={
            !filter.id_pekerjaan || loadingSub
          }
          style={{
            ...selectStyle,
            width: 180,
            minWidth: 180,
            opacity:
              !filter.id_pekerjaan || loadingSub
                ? 0.6
                : 1,
          }}
        >
          <option value="">
            {loadingSub
              ? 'Memuat sub...'
              : 'Semua Subpekerjaan'}
          </option>

          {sub.map(item => (
            <option key={item.id_sub} value={item.id_sub}>
              {item.nama_sub}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filter.start}
          onChange={event =>
            setFilter(previous => ({
              ...previous,
              start: event.target.value,
            }))
          }
          aria-label="Tanggal mulai"
          style={dateStyle}
        />

        <input
          type="date"
          value={filter.end}
          min={filter.start || undefined}
          onChange={event =>
            setFilter(previous => ({
              ...previous,
              end: event.target.value,
            }))
          }
          aria-label="Tanggal selesai"
          style={dateStyle}
        />

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApplyFilter}
          disabled={loading}
        >
          Terapkan
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleResetFilter}
          disabled={loading}
          style={resetButtonStyle}
        >
          Reset
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <p
        style={{
          color: '#6b7280',
          fontSize: 13,
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        Menampilkan {filteredRows.length} dari{' '}
        {allRows.length} data
      </p>

      {/* GRAFIK */}
      <div
        className="card"
        style={{
          marginTop: 24,
        }}
      >
        <h3>Grafik Biaya Material vs Tenaga</h3>

        {loading ? (
          <p style={{ color: '#9ca3af' }}>
            Memuat data grafik...
          </p>
        ) : chartData.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>
            Tidak ada data grafik berdasarkan filter
          </p>
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="tanggal"
                  tickFormatter={formatTanggal}
                />

                <YAxis
                  tickFormatter={value =>
                    Number(value).toLocaleString('id-ID')
                  }
                />

                <Tooltip
                  labelFormatter={label =>
                    `Tanggal: ${formatTanggal(
                      String(label),
                    )}`
                  }
                  formatter={value =>
                    formatRupiah(value)
                  }
                />

                <Legend />

                <Bar
                  dataKey="material"
                  name="Material"
                  fill="#3b82f6"
                />

                <Bar
                  dataKey="tenaga"
                  name="Tenaga"
                  fill="#f97316"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TABEL */}
      <div
        className="card"
        style={{
          marginTop: 24,
          padding: 0,
        }}
      >
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
                ].map(header => (
                  <th key={header} style={thStyle}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyStyle}>
                    Tidak ada data berdasarkan filter
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const spesifikasi =
                    normalizeText(row.spesifikasi);

                  return (
                    <tr
                      key={
                        row.id_distribusi ??
                        row.id_detail ??
                        row.id_pengeluaran ??
                        `${row.id_proyek}-${index}`
                      }
                    >
                      <td style={tdStyle}>
                        {formatTanggal(
                          row.tgl_transaksi,
                        )}
                      </td>

                      <td style={tdStyle}>
                        {row.nama_item || '-'}
                      </td>

                      <td style={tdStyle}>
                        <strong
                          style={{
                            color:
                              spesifikasi === 'material'
                                ? '#2563eb'
                                : '#ea580c',
                          }}
                        >
                          {row.spesifikasi || '-'}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {row.nama_proyek || '-'}
                      </td>

                      <td style={tdStyle}>
                        {row.nama_pekerjaan || '-'}
                      </td>

                      <td style={tdStyle}>
                        {row.nama_sub || '-'}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatRupiah(
                          row.biaya_pakai,
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

/* ================= STYLE ================= */

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
  textAlign: 'left',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: '1px solid #e5e7eb',
  verticalAlign: 'top',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 24,
  color: '#9ca3af',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
};

const dateStyle: React.CSSProperties = {
  width: 140,
  minWidth: 140,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

const filterCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'nowrap',
  overflowX: 'auto',
  padding: 14,
  borderRadius: 12,
};

const resetButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  padding: '8px 16px',
  borderRadius: 8,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
};