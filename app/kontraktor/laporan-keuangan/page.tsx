'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import api from '@/lib/axios';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Proyek {
  id_proyek: number;
  nama_proyek: string;
  biaya_kesepakatan?: number;
}

interface ChartItem {
  tgl_transaksi: string;
  total: number | string;
}

interface LaporanData {
  proyek?: {
    id_proyek?: number;
    nama_proyek?: string;
    biaya_kesepakatan?: number | string;
  };

  total_pengeluaran: number | string;
  sisa_anggaran: number | string;
  total_material: number | string;
  total_tenaga: number | string;
  chart?: ChartItem[];
}

interface FilterData {
  id_proyek: string;
  start: string;
  end: string;
}

interface SummaryProps {
  title: string;
  value: number | string;
  color: string;
}

interface BreakdownProps {
  title: string;
  value: number | string;
  percent: string;
  color: string;
}

export default function LaporanKeuanganPage() {
  const [proyek, setProyek] = useState<Proyek[]>([]);
  const [data, setData] = useState<LaporanData | null>(null);

  const [loadingLaporan, setLoadingLaporan] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const exportRef = useRef<HTMLDivElement | null>(null);

  const [filter, setFilter] = useState<FilterData>({
    id_proyek: '',
    start: '',
    end: '',
  });

  /* =========================
     OLAH DATA GRAFIK
  ========================== */
  const chartData = useMemo(() => {
    const rawChart = Array.isArray(data?.chart)
      ? data.chart
      : [];

    /*
     * Menggabungkan seluruh pengeluaran
     * yang memiliki tanggal transaksi sama.
     */
    const grouped = rawChart.reduce(
      (
        result: Record<string, number>,
        item: ChartItem
      ) => {
        if (!item?.tgl_transaksi) {
          return result;
        }

        const tanggal = String(
          item.tgl_transaksi
        ).substring(0, 10);

        const total = Number(item.total ?? 0);

        result[tanggal] =
          (result[tanggal] ?? 0) + total;

        return result;
      },
      {}
    );

    /*
     * Mengubah data kembali menjadi array
     * dan mengurutkan berdasarkan tanggal.
     */
    return Object.entries(grouped)
      .map(([tgl_transaksi, total]) => ({
        tgl_transaksi,
        total,
      }))
      .sort((a, b) => {
        const tanggalA = new Date(
          `${a.tgl_transaksi}T00:00:00`
        ).getTime();

        const tanggalB = new Date(
          `${b.tgl_transaksi}T00:00:00`
        ).getTime();

        return tanggalA - tanggalB;
      });
  }, [data]);

  /* =========================
     FETCH LAPORAN
  ========================== */
  const fetchData = async () => {
    if (!filter.id_proyek) {
      alert('Silakan pilih proyek terlebih dahulu.');
      return;
    }

    if (
      filter.start &&
      filter.end &&
      filter.start > filter.end
    ) {
      alert(
        'Tanggal awal tidak boleh lebih besar dari tanggal akhir.'
      );
      return;
    }

    try {
      setLoadingLaporan(true);

      const response = await api.get(
        '/laporan-keuangan',
        {
          params: {
            id_proyek: filter.id_proyek,
            start: filter.start || undefined,
            end: filter.end || undefined,
          },
        }
      );

      const laporan =
        response.data?.data ?? response.data;

      setData(laporan);
    } catch (error: any) {
      console.error(
        'Gagal memuat laporan:',
        error.response?.data ?? error
      );

      alert(
        error.response?.data?.message ??
          'Gagal memuat data laporan keuangan.'
      );
    } finally {
      setLoadingLaporan(false);
    }
  };

  /* =========================
     FETCH PROYEK
  ========================== */
  useEffect(() => {
    const fetchProyek = async () => {
      try {
        const response = await api.get('/proyek');

        const rawData =
          response.data?.data ?? response.data;

        setProyek(
          Array.isArray(rawData) ? rawData : []
        );
      } catch (error: any) {
        console.error(
          'Gagal memuat proyek:',
          error.response?.data ?? error
        );

        setProyek([]);
      }
    };

    fetchProyek();
  }, []);

  /* =========================
     TUTUP DROPDOWN EXPORT
  ========================== */
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        exportRef.current &&
        !exportRef.current.contains(
          event.target as Node
        )
      ) {
        setShowExport(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /* =========================
     UTILITAS
  ========================== */
  const breakdownPercent = (
    value: number | string
  ) => {
    const totalPengeluaran = Number(
      data?.total_pengeluaran ?? 0
    );

    if (totalPengeluaran <= 0) {
      return '0.00';
    }

    const persentase =
      (Number(value ?? 0) /
        totalPengeluaran) *
      100;

    return persentase.toFixed(2);
  };

  const getNamaProyek = () => {
    const selectedProject = proyek.find(
      item =>
        String(item.id_proyek) ===
        String(filter.id_proyek)
    );

    return selectedProject
      ? selectedProject.nama_proyek
      : 'Proyek';
  };

  const formatRupiah = (
    value: number | string
  ) => {
    return Number(value ?? 0).toLocaleString(
      'id-ID',
      {
        maximumFractionDigits: 2,
      }
    );
  };

  const formatNominalRingkas = (
    value: number
  ) => {
    const nominal = Number(value ?? 0);

    if (nominal >= 1_000_000_000) {
      return `${(
        nominal / 1_000_000_000
      ).toLocaleString('id-ID', {
        maximumFractionDigits: 1,
      })} M`;
    }

    if (nominal >= 1_000_000) {
      return `${(
        nominal / 1_000_000
      ).toLocaleString('id-ID', {
        maximumFractionDigits: 1,
      })} jt`;
    }

    if (nominal >= 1_000) {
      return `${(
        nominal / 1_000
      ).toLocaleString('id-ID', {
        maximumFractionDigits: 0,
      })} rb`;
    }

    return nominal.toLocaleString('id-ID');
  };

  const formatTanggalGrafik = (
    value: string
  ) => {
    if (!value) {
      return '';
    }

    const tanggal = String(value).substring(
      0,
      10
    );

    const bagianTanggal = tanggal.split('-');

    if (bagianTanggal.length !== 3) {
      return tanggal;
    }

    const bulan = Number(bagianTanggal[1]);
    const hari = Number(bagianTanggal[2]);

    return `${hari}/${bulan}`;
  };

  const formatLabelTooltip = (
    value: string
  ) => {
    if (!value) {
      return '';
    }

    const tanggal = String(value).substring(
      0,
      10
    );

    const dateObject = new Date(
      `${tanggal}T00:00:00`
    );

    if (
      Number.isNaN(dateObject.getTime())
    ) {
      return tanggal;
    }

    return dateObject.toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    );
  };

  const downloadFile = (
    blobData: Blob,
    filename: string,
    type: string
  ) => {
    const blob = new Blob([blobData], {
      type,
    });

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /* =========================
     EXPORT EXCEL
  ========================== */
  const exportExcel = async () => {
    if (!filter.id_proyek) {
      alert('Silakan pilih proyek terlebih dahulu.');
      return;
    }

    try {
      const response = await api.get(
        '/laporan-keuangan/export/excel',
        {
          params: {
            id_proyek: filter.id_proyek,
            start: filter.start || undefined,
            end: filter.end || undefined,
          },

          responseType: 'blob',
        }
      );

      downloadFile(
        response.data,
        `Laporan Keuangan - ${getNamaProyek()}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    } catch (error: any) {
      console.error(
        'Gagal mengekspor Excel:',
        error.response?.data ?? error
      );

      alert('Gagal mengunduh file Excel.');
    }
  };

  /* =========================
     EXPORT PDF
  ========================== */
  const exportPdf = async () => {
    if (!filter.id_proyek) {
      alert('Silakan pilih proyek terlebih dahulu.');
      return;
    }

    try {
      const response = await api.get(
        '/laporan-keuangan/export/pdf',
        {
          params: {
            id_proyek: filter.id_proyek,
            start: filter.start || undefined,
            end: filter.end || undefined,
          },

          responseType: 'blob',
        }
      );

      downloadFile(
        response.data,
        `Laporan Keuangan - ${getNamaProyek()}.pdf`,
        'application/pdf'
      );
    } catch (error: any) {
      console.error(
        'Gagal mengekspor PDF:',
        error.response?.data ?? error
      );

      alert('Gagal mengunduh file PDF.');
    }
  };

  return (
    <main className="main-content">
      {/* ================= HEADER ================= */}
      <div
        className="flex-between mb-4"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            Laporan Keuangan
          </h1>

          <p
            style={{
              color: '#6b7280',
              marginTop: 6,
            }}
          >
            Ringkasan pengeluaran proyek secara
            realtime
          </p>
        </div>
      </div>

      {/* ================= FILTER CARD ================= */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <select
          style={selectStyle}
          value={filter.id_proyek}
          onChange={event => {
            setFilter({
              id_proyek: event.target.value,
              start: '',
              end: '',
            });

            setData(null);
          }}
        >
          <option value="">
            -- Pilih Proyek --
          </option>

          {proyek.map(item => (
            <option
              key={item.id_proyek}
              value={item.id_proyek}
            >
              {item.nama_proyek}
            </option>
          ))}
        </select>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: '0.9rem',
            }}
          >
            Dari:
          </span>

          <input
            type="date"
            style={dateStyle}
            value={filter.start}
            onChange={event =>
              setFilter(previous => ({
                ...previous,
                start: event.target.value,
              }))
            }
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: '0.9rem',
            }}
          >
            Sampai:
          </span>

          <input
            type="date"
            style={dateStyle}
            value={filter.end}
            min={filter.start || undefined}
            onChange={event =>
              setFilter(previous => ({
                ...previous,
                end: event.target.value,
              }))
            }
          />
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={fetchData}
          disabled={
            !filter.id_proyek ||
            loadingLaporan
          }
          style={{
            height: 40,
            minWidth: 160,
          }}
        >
          {loadingLaporan
            ? 'Memuat...'
            : 'Tampilkan Laporan'}
        </button>

        {filter.id_proyek && (
          <div
            ref={exportRef}
            style={{
              position: 'relative',
              marginLeft: 'auto',
            }}
          >
            <button
              type="button"
              className="btn"
              style={{
                height: 40,
                background: '#ffffff',
                border: '1px solid #dddddd',
              }}
              onClick={() =>
                setShowExport(previous => !previous)
              }
            >
              Export ▾
            </button>

            {showExport && (
              <div style={exportPopup}>
                <button
                  type="button"
                  style={exportItem}
                  onClick={() => {
                    exportExcel();
                    setShowExport(false);
                  }}
                >
                  📊 Export Excel
                </button>

                <button
                  type="button"
                  style={exportItem}
                  onClick={() => {
                    exportPdf();
                    setShowExport(false);
                  }}
                >
                  📄 Export PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= CONTENT REPORT ================= */}
      {data ? (
        <>
          {/* SUMMARY CARDS */}
          <div
            className="grid grid-3 gap-3 mt-4"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <Summary
              title="Total Anggaran"
              value={
                data.proyek
                  ?.biaya_kesepakatan ?? 0
              }
              color="#2563eb"
            />

            <Summary
              title="Total Pengeluaran"
              value={
                data.total_pengeluaran ?? 0
              }
              color="#ef4444"
            />

            <Summary
              title="Sisa Anggaran"
              value={data.sisa_anggaran ?? 0}
              color="#10b981"
            />
          </div>

          {/* CHART DAN RINCIAN */}
          <div
            className="grid grid-4 gap-3 mt-4"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 3fr) minmax(250px, 1fr)',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
            {/* GRAFIK */}
            <div
              className="card"
              style={{
                padding: 20,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                Tren Pengeluaran
              </h3>

              <div
                style={{
                  width: '100%',
                  height: 360,
                  minWidth: 0,
                }}
              >
                {chartData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 25,
                        right: 25,
                        left: 15,
                        bottom: 15,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#d1d5db"
                      />

                      <XAxis
                        dataKey="tgl_transaksi"
                        tickFormatter={
                          formatTanggalGrafik
                        }
                        allowDuplicatedCategory={
                          false
                        }
                        minTickGap={35}
                        tickMargin={10}
                        height={45}
                        tick={{
                          fontSize: 12,
                          fill: '#6b7280',
                        }}
                        axisLine={{
                          stroke: '#9ca3af',
                        }}
                        tickLine={false}
                      />

                      <YAxis
                        width={80}
                        tickFormatter={
                          formatNominalRingkas
                        }
                        domain={[
                          0,
                          (dataMax: number) => {
                            const maximum = Number(
                              dataMax ?? 0
                            );

                            if (maximum <= 0) {
                              return 100;
                            }

                            /*
                             * Tambahkan ruang 20%
                             * agar garis grafik tidak
                             * menempel pada bagian atas.
                             */
                            return Math.ceil(
                              maximum * 1.2
                            );
                          },
                        ]}
                        tick={{
                          fontSize: 12,
                          fill: '#6b7280',
                        }}
                        axisLine={{
                          stroke: '#9ca3af',
                        }}
                        tickLine={false}
                      />

                      <Tooltip
                        formatter={(value: any) => [
                          `Rp ${formatRupiah(
                            Number(value ?? 0)
                          )}`,
                          'Total Pengeluaran',
                        ]}
                        labelFormatter={(
                          label: any
                        ) =>
                          formatLabelTooltip(
                            String(label)
                          )
                        }
                        contentStyle={{
                          borderRadius: 8,
                          border:
                            '1px solid #e5e7eb',
                          boxShadow:
                            '0 8px 20px rgba(0, 0, 0, 0.08)',
                        }}
                        labelStyle={{
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Pengeluaran"
                        stroke="#395A7F"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2,
                          fill: '#ffffff',
                          stroke: '#395A7F',
                        }}
                        isAnimationActive={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#6b7280',
                      textAlign: 'center',
                    }}
                  >
                    Belum ada data pengeluaran untuk
                    periode ini.
                  </div>
                )}
              </div>
            </div>

            {/* RINCIAN MATERIAL DAN TENAGA */}
            <div
              className="card"
              style={{
                padding: 20,
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                Rincian
              </h3>

              <Breakdown
                title="Material"
                value={
                  data.total_material ?? 0
                }
                percent={breakdownPercent(
                  data.total_material ?? 0
                )}
                color="#3b82f6"
              />

              <hr
                style={{
                  margin: '15px 0',
                  border: 0,
                  borderTop:
                    '1px solid #eeeeee',
                }}
              />

              <Breakdown
                title="Tenaga Kerja"
                value={data.total_tenaga ?? 0}
                percent={breakdownPercent(
                  data.total_tenaga ?? 0
                )}
                color="#f59e0b"
              />
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: 50,
            color: '#888888',
            background: '#f9fafb',
            borderRadius: 8,
          }}
        >
          <p>
            Silakan pilih proyek untuk melihat
            laporan keuangan.
          </p>
        </div>
      )}
    </main>
  );
}

/* =========================
   SUMMARY COMPONENT
========================== */
const Summary = ({
  title,
  value,
  color,
}: SummaryProps) => (
  <div
    className="card"
    style={{
      padding: 20,
      borderLeft: `4px solid ${color}`,
      textAlign: 'center',
    }}
  >
    <h4
      style={{
        margin: '0 0 10px 0',
        color: '#666666',
        fontSize: '0.9rem',
      }}
    >
      {title}
    </h4>

    <strong
      style={{
        fontSize: '1.5rem',
        color: '#333333',
        wordBreak: 'break-word',
      }}
    >
      Rp{' '}
      {Number(value ?? 0).toLocaleString(
        'id-ID',
        {
          maximumFractionDigits: 2,
        }
      )}
    </strong>
  </div>
);

/* =========================
   BREAKDOWN COMPONENT
========================== */
const Breakdown = ({
  title,
  value,
  percent,
  color,
}: BreakdownProps) => {
  const safePercent = Math.min(
    Math.max(Number(percent ?? 0), 0),
    100
  );

  return (
    <div
      style={{
        marginBottom: 16,
        textAlign: 'center',
      }}
    >
      <h4
        style={{
          margin: '0 0 5px 0',
          fontSize: '0.95rem',
          color: '#395A7F',
        }}
      >
        {title}
      </h4>

      <strong
        style={{
          fontSize: '1.2rem',
          display: 'block',
          wordBreak: 'break-word',
        }}
      >
        Rp{' '}
        {Number(value ?? 0).toLocaleString(
          'id-ID',
          {
            maximumFractionDigits: 2,
          }
        )}
      </strong>

      <div
        style={{
          background: '#eeeeee',
          height: 7,
          borderRadius: 4,
          marginTop: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${safePercent}%`,
            background: color,
            height: '100%',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <p
        style={{
          color: '#6b7280',
          marginTop: 6,
          marginBottom: 0,
          fontSize: '0.85rem',
        }}
      >
        {percent}% dari total
      </p>
    </div>
  );
};

/* =========================
   STYLE
========================== */
const selectStyle = {
  flex: '1 1 280px',
  minWidth: 200,
  height: 40,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid #dddddd',
  background: '#ffffff',
};

const dateStyle = {
  width: 140,
  height: 40,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #dddddd',
  background: '#ffffff',
};

const exportPopup = {
  position: 'absolute' as const,
  right: 0,
  top: '110%',
  background: '#ffffff',
  borderRadius: 10,
  boxShadow:
    '0 10px 25px rgba(0, 0, 0, 0.12)',
  width: 170,
  padding: 6,
  zIndex: 1000,
  border: '1px solid #eeeeee',
};

const exportItem = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  textAlign: 'left' as const,
  cursor: 'pointer',
  background: '#ffffff',
  border: 'none',
  fontSize: '0.9rem',
  color: '#333333',
};