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

type FilterState = {
  id_proyek: string;
  id_pekerjaan: string;
  id_sub: string;
  start: string;
  end: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const emptyFilter: FilterState = {
  id_proyek: '',
  id_pekerjaan: '',
  id_sub: '',
  start: '',
  end: '',
};

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

  if (Array.isArray(payload?.pengeluaran)) {
    return payload.pengeluaran;
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

  const tanggal = String(value).slice(0, 10);
  const [tahun, bulan, hari] = tanggal.split('-');

  if (!tahun || !bulan || !hari) {
    return value;
  }

  return `${hari}/${bulan}/${tahun}`;
};

const createOptionValue = (
  id: number | string | null | undefined,
  name: string | null | undefined,
) => {
  if (id !== undefined && id !== null && String(id) !== '') {
    return String(id);
  }

  return `name:${normalizeText(name)}`;
};

const matchesOption = (
  rowId: number | string | null | undefined,
  rowName: string | null | undefined,
  selectedValue: string,
) => {
  if (!selectedValue) {
    return true;
  }

  if (selectedValue.startsWith('name:')) {
    return (
      `name:${normalizeText(rowName)}` === selectedValue
    );
  }

  return String(rowId ?? '') === selectedValue;
};

const uniqueOptions = (
  rows: MaterialRow[],
  idGetter: (row: MaterialRow) => number | string | undefined,
  nameGetter: (row: MaterialRow) => string | undefined,
): SelectOption[] => {
  const map = new Map<string, string>();

  rows.forEach(row => {
    const name = nameGetter(row);

    if (!name) {
      return;
    }

    const value = createOptionValue(idGetter(row), name);

    if (!map.has(value)) {
      map.set(value, name);
    }
  });

  return Array.from(map.entries())
    .map(([value, label]) => ({
      value,
      label,
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, 'id-ID'),
    );
};

export default function MaterialPage() {
  const [allRows, setAllRows] = useState<MaterialRow[]>([]);
  const [filter, setFilter] =
    useState<FilterState>(emptyFilter);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(emptyFilter);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Hanya mengambil data dari endpoint /material.
   * Dropdown proyek, pekerjaan, dan subpekerjaan dibentuk
   * langsung dari data material agar tidak bergantung pada
   * endpoint /dropdown yang sebelumnya menghasilkan error 500.
   */
  useEffect(() => {
    let active = true;

    const loadMaterial = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/material');
        const materialRows =
          normalizeList<MaterialRow>(response.data);

        if (!active) {
          return;
        }

        setAllRows(materialRows);
      } catch (err: any) {
        console.error('Gagal mengambil data material:', err);

        if (!active) {
          return;
        }

        setAllRows([]);
        setError(
          err?.response?.data?.message ||
            'Data material gagal dimuat.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMaterial();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Pilihan proyek dibentuk dari seluruh data material.
   */
  const projectOptions = useMemo(
    () =>
      uniqueOptions(
        allRows,
        row => row.id_proyek,
        row => row.nama_proyek,
      ),
    [allRows],
  );

  /*
   * Pilihan pekerjaan hanya menampilkan pekerjaan
   * dari proyek yang sedang dipilih.
   */
  const projectScopedRows = useMemo(() => {
    if (!filter.id_proyek) {
      return [];
    }

    return allRows.filter(row =>
      matchesOption(
        row.id_proyek,
        row.nama_proyek,
        filter.id_proyek,
      ),
    );
  }, [allRows, filter.id_proyek]);

  const pekerjaanOptions = useMemo(
    () =>
      uniqueOptions(
        projectScopedRows,
        row => row.id_pekerjaan,
        row => row.nama_pekerjaan,
      ),
    [projectScopedRows],
  );

  /*
   * Pilihan subpekerjaan hanya menampilkan subpekerjaan
   * dari proyek dan pekerjaan yang sedang dipilih.
   */
  const pekerjaanScopedRows = useMemo(() => {
    if (!filter.id_pekerjaan) {
      return [];
    }

    return projectScopedRows.filter(row =>
      matchesOption(
        row.id_pekerjaan,
        row.nama_pekerjaan,
        filter.id_pekerjaan,
      ),
    );
  }, [projectScopedRows, filter.id_pekerjaan]);

  const subOptions = useMemo(
    () =>
      uniqueOptions(
        pekerjaanScopedRows,
        row => row.id_sub,
        row => row.nama_sub,
      ),
    [pekerjaanScopedRows],
  );

  const handleProjectChange = (idProyek: string) => {
    setFilter(previous => ({
      ...previous,
      id_proyek: idProyek,
      id_pekerjaan: '',
      id_sub: '',
    }));
  };

  const handlePekerjaanChange = (
    idPekerjaan: string,
  ) => {
    setFilter(previous => ({
      ...previous,
      id_pekerjaan: idPekerjaan,
      id_sub: '',
    }));
  };

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      const cocokProyek = matchesOption(
        row.id_proyek,
        row.nama_proyek,
        appliedFilter.id_proyek,
      );

      const cocokPekerjaan = matchesOption(
        row.id_pekerjaan,
        row.nama_pekerjaan,
        appliedFilter.id_pekerjaan,
      );

      const cocokSub = matchesOption(
        row.id_sub,
        row.nama_sub,
        appliedFilter.id_sub,
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
  }, [allRows, appliedFilter]);

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

      if (!current) {
        return;
      }

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

  const totalMaterial = useMemo(
    () =>
      filteredRows.reduce((total, row) => {
        if (
          normalizeText(row.spesifikasi) !== 'material'
        ) {
          return total;
        }

        return total + Number(row.biaya_pakai ?? 0);
      }, 0),
    [filteredRows],
  );

  const totalTenaga = useMemo(
    () =>
      filteredRows.reduce((total, row) => {
        if (
          normalizeText(row.spesifikasi) !== 'tenaga'
        ) {
          return total;
        }

        return total + Number(row.biaya_pakai ?? 0);
      }, 0),
    [filteredRows],
  );

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
    setFilter({ ...emptyFilter });
    setAppliedFilter({ ...emptyFilter });
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

      <div className="card" style={filterCardStyle}>
        <select
          value={filter.id_proyek}
          onChange={event =>
            handleProjectChange(event.target.value)
          }
          style={{
            ...selectStyle,
            width: 190,
          }}
        >
          <option value="">Semua Proyek</option>

          {projectOptions.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={filter.id_pekerjaan}
          onChange={event =>
            handlePekerjaanChange(event.target.value)
          }
          disabled={!filter.id_proyek}
          style={{
            ...selectStyle,
            width: 190,
            opacity: filter.id_proyek ? 1 : 0.6,
          }}
        >
          <option value="">Semua Pekerjaan</option>

          {pekerjaanOptions.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
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
          disabled={!filter.id_pekerjaan}
          style={{
            ...selectStyle,
            width: 200,
            opacity: filter.id_pekerjaan ? 1 : 0.6,
          }}
        >
          <option value="">Semua Subpekerjaan</option>

          {subOptions.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
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
          style={buttonStyle}
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

      {error && <div style={errorStyle}>{error}</div>}

      <div style={summaryGridStyle}>
        <div className="card" style={summaryCardStyle}>
          <span style={summaryLabelStyle}>
            Data ditampilkan
          </span>
          <strong style={summaryValueStyle}>
            {filteredRows.length}
          </strong>
          <small style={summaryNoteStyle}>
            dari {allRows.length} data
          </small>
        </div>

        <div className="card" style={summaryCardStyle}>
          <span style={summaryLabelStyle}>
            Total material
          </span>
          <strong style={summaryValueStyle}>
            {formatRupiah(totalMaterial)}
          </strong>
        </div>

        <div className="card" style={summaryCardStyle}>
          <span style={summaryLabelStyle}>
            Total tenaga
          </span>
          <strong style={summaryValueStyle}>
            {formatRupiah(totalTenaga)}
          </strong>
        </div>
      </div>

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
          <div style={{ height: 340 }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 30,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="tanggal"
                  tickFormatter={formatTanggal}
                  minTickGap={24}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />

                <YAxis
                  width={95}
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
                        {formatRupiah(row.biaya_pakai)}
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
  minWidth: 170,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
};

const dateStyle: React.CSSProperties = {
  width: 150,
  minWidth: 150,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

const filterCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  padding: 14,
  borderRadius: 12,
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const resetButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  padding: '10px 18px',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const errorStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
};

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginTop: 16,
};

const summaryCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 16,
};

const summaryLabelStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
};

const summaryValueStyle: React.CSSProperties = {
  color: '#1f3f66',
  fontSize: 20,
};

const summaryNoteStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 12,
};
