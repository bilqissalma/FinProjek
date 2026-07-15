'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  ChartOptions,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';
import api from '@/lib/axios';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

type StatusProyek = {
  berjalan: number;
  selesai: number;
};

type PekerjaanPerProyek = {
  id_proyek?: number;
  nama_proyek: string;
  total_pekerjaan: number;
};

type DashboardData = {
  nama: string;
  total_proyek: number;
  total_pekerjaan: number;
  status_proyek: StatusProyek;
  pekerjaan_per_proyek: PekerjaanPerProyek[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     FETCH DASHBOARD
  ========================== */
  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token');

        if (!token) {
          localStorage.removeItem('user');

          if (isMounted) {
            setError(
              'Token tidak ditemukan. Silakan login kembali.'
            );
          }

          router.replace('/auth/login');
          return;
        }

        const response = await api.get(
          '/kontraktor/dashboard',
          {
            params: {
              timestamp: Date.now(),
            },

            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          }
        );

        const payload =
          response.data?.data ?? response.data;

        console.log('DASHBOARD RESPONSE:', response.data);
        console.log('DASHBOARD PAYLOAD:', payload);

        const normalizedData: DashboardData = {
          nama:
            payload?.nama ??
            payload?.nama_lengkap ??
            'Kontraktor',

          total_proyek: Number(
            payload?.total_proyek ?? 0
          ),

          total_pekerjaan: Number(
            payload?.total_pekerjaan ?? 0
          ),

          status_proyek: {
            berjalan: Number(
              payload?.status_proyek?.berjalan ?? 0
            ),

            selesai: Number(
              payload?.status_proyek?.selesai ?? 0
            ),
          },

          pekerjaan_per_proyek: Array.isArray(
            payload?.pekerjaan_per_proyek
          )
            ? payload.pekerjaan_per_proyek.map(
                (item: any) => ({
                  id_proyek: Number(
                    item?.id_proyek ?? 0
                  ),

                  nama_proyek:
                    item?.nama_proyek ??
                    'Proyek tanpa nama',

                  total_pekerjaan: Number(
                    item?.total_pekerjaan ?? 0
                  ),
                })
              )
            : [],
        };

        console.log(
          'DASHBOARD NORMALIZED:',
          normalizedData
        );

        if (isMounted) {
          setData(normalizedData);
        }
      } catch (err: any) {
        console.error(
          'GAGAL MENGAMBIL DASHBOARD:',
          err.response?.data ?? err
        );

        const status = err.response?.status;

        if (status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');

          if (isMounted) {
            setError(
              'Sesi login telah berakhir. Silakan login kembali.'
            );
          }

          router.replace('/auth/login');
          return;
        }

        if (status === 403) {
          if (isMounted) {
            setError(
              err.response?.data?.message ??
                'Anda tidak memiliki akses ke dashboard kontraktor.'
            );
          }

          return;
        }

        if (isMounted) {
          setError(
            err.response?.data?.message ??
              'Gagal mengambil data dashboard.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  /* =========================
     DATA AMAN
  ========================== */
  const statusProyek: StatusProyek =
    data?.status_proyek ?? {
      berjalan: 0,
      selesai: 0,
    };

  const pekerjaanPerProyek =
    data?.pekerjaan_per_proyek ?? [];

  /* =========================
     CHART STATUS PROYEK
  ========================== */
  const statusChart = useMemo(
    () => ({
      labels: ['Berjalan', 'Selesai'],

      datasets: [
        {
          label: 'Jumlah Proyek',

          data: [
            statusProyek.berjalan,
            statusProyek.selesai,
          ],

          backgroundColor: [
            '#1a73e8',
            '#34a853',
          ],

          borderColor: [
            '#1a73e8',
            '#34a853',
          ],

          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 90,
        },
      ],
    }),
    [
      statusProyek.berjalan,
      statusProyek.selesai,
    ]
  );

  /* =========================
     CHART PEKERJAAN PER PROYEK
  ========================== */
  const pekerjaanChart = useMemo(
    () => ({
      labels: pekerjaanPerProyek.map(
        item => item.nama_proyek
      ),

      datasets: [
        {
          label: 'Jumlah Pekerjaan',

          data: pekerjaanPerProyek.map(
            item => Number(item.total_pekerjaan ?? 0)
          ),

          backgroundColor: '#fbbc04',
          borderColor: '#e5a800',
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 70,
        },
      ],
    }),
    [pekerjaanPerProyek]
  );

  /* =========================
     OPTIONS CHART STATUS
  ========================== */
  const statusChartOptions =
    useMemo<ChartOptions<'bar'>>(
      () => ({
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: true,
            position: 'top',
          },

          tooltip: {
            callbacks: {
              label(context) {
                return `Jumlah Proyek: ${Number(
                  context.raw ?? 0
                )}`;
              },
            },
          },
        },

        scales: {
          y: {
            beginAtZero: true,

            suggestedMax: Math.max(
              statusProyek.berjalan,
              statusProyek.selesai,
              1
            ) + 1,

            ticks: {
              precision: 0,
              stepSize: 1,
            },

            grid: {
              color: '#e5e7eb',
            },
          },

          x: {
            grid: {
              display: false,
            },
          },
        },
      }),
      [
        statusProyek.berjalan,
        statusProyek.selesai,
      ]
    );

  /* =========================
     OPTIONS CHART PEKERJAAN
  ========================== */
  const pekerjaanChartOptions =
    useMemo<ChartOptions<'bar'>>(
      () => ({
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: true,
            position: 'top',
          },

          tooltip: {
            callbacks: {
              label(context) {
                return `Jumlah Pekerjaan: ${Number(
                  context.raw ?? 0
                )}`;
              },
            },
          },
        },

        scales: {
          y: {
            beginAtZero: true,

            ticks: {
              precision: 0,
              stepSize: 1,
            },

            grid: {
              color: '#e5e7eb',
            },
          },

          x: {
            grid: {
              display: false,
            },

            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: false,
            },
          },
        },
      }),
      []
    );

  /* =========================
     LOADING
  ========================== */
  if (loading) {
    return (
      <main className="main-content">
        <div
          style={{
            minHeight: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
          }}
        >
          Memuat data dashboard...
        </div>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================== */
  if (error) {
    return (
      <main className="main-content">
        <div
          style={{
            padding: 20,
            color: '#b91c1c',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 10,
          }}
        >
          <strong>Dashboard gagal dimuat</strong>

          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      {/* HEADER */}
      <div
        style={{
          marginBottom: '2rem',
        }}
      >
        <h1
          style={{
            marginBottom: 8,
          }}
        >
          Dashboard
        </h1>

        <p
          style={{
            color: '#ACACAC',
            margin: 0,
          }}
        >
          Selamat datang kembali,{' '}
          {data?.nama ?? 'Kontraktor'}
        </p>
      </div>

      {/* SUMMARY */}
      <div
        className="grid grid-4"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: '2rem',
        }}
      >
        <SummaryCard
          label="Total Proyek"
          value={data?.total_proyek ?? 0}
        />

        <SummaryCard
          label="Proyek Berjalan"
          value={statusProyek.berjalan}
        />

        <SummaryCard
          label="Proyek Selesai"
          value={statusProyek.selesai}
        />

        <SummaryCard
          label="Total Pekerjaan"
          value={data?.total_pekerjaan ?? 0}
        />
      </div>

      {/* CHARTS */}
      <div
        className="grid grid-2"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {/* STATUS PROYEK */}
        <div
          className="card"
          style={{
            padding: 20,
            minWidth: 0,
          }}
        >
          <div className="card-header">
            <div className="card-title">
              Status Proyek
            </div>
          </div>

          <div
            style={{
              height: 320,
              marginTop: 16,
            }}
          >
            {(data?.total_proyek ?? 0) === 0 ? (
              <EmptyChart message="Belum ada data proyek" />
            ) : (
              <Bar
                data={statusChart}
                options={statusChartOptions}
              />
            )}
          </div>
        </div>

        {/* PEKERJAAN PER PROYEK */}
        <div
          className="card"
          style={{
            padding: 20,
            minWidth: 0,
          }}
        >
          <div className="card-header">
            <div className="card-title">
              Jumlah Pekerjaan per Proyek
            </div>
          </div>

          <div
            style={{
              height: 320,
              marginTop: 16,
            }}
          >
            {pekerjaanPerProyek.length === 0 ? (
              <EmptyChart message="Belum ada data pekerjaan" />
            ) : (
              <Bar
                data={pekerjaanChart}
                options={pekerjaanChartOptions}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================
   SUMMARY CARD
========================== */
function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="summary-card"
      style={{
        minWidth: 0,
      }}
    >
      <div className="summary-card-label">
        {label}
      </div>

      <div className="summary-card-value">
        {Number(value ?? 0)}
      </div>
    </div>
  );
}

/* =========================
   EMPTY CHART
========================== */
function EmptyChart({
  message,
}: {
  message: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ACACAC',
        backgroundColor: '#EBECEE',
        borderRadius: 8,
        textAlign: 'center',
        padding: 20,
      }}
    >
      {message}
    </div>
  );
}