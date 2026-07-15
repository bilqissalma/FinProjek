'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

type ProyekTerbaru = {
  id_proyek: number;
  kode_proyek: string | null;
  nama_proyek: string;
  lokasi: string | null;
  status: string;
  tgl_mulai: string | null;
  tgl_selesai: string | null;
  progres: number;
};

type DashboardData = {
  nama: string;
  role: string;
  total_proyek: number;
  proyek_berjalan: number;
  proyek_selesai: number;
  proyek_terbaru: ProyekTerbaru[];
};

export default function PemilikDashboard() {
  const router = useRouter();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =========================
     FETCH DASHBOARD
  ========================== */
  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          localStorage.getItem('auth_token');

        if (!token) {
          if (isMounted) {
            setError(
              'Sesi login tidak ditemukan.'
            );
          }

          router.replace('/auth/login');
          return;
        }

        /*
         * Periksa user yang tersimpan di frontend.
         */
        const savedUser =
          localStorage.getItem('user');

        if (savedUser) {
          try {
            const parsedUser =
              JSON.parse(savedUser);

            const role = String(
              parsedUser?.role ?? ''
            )
              .trim()
              .toLowerCase();

            if (
              role &&
              role !== 'pemilik'
            ) {
              if (isMounted) {
                setError(
                  `Akun yang aktif memiliki role "${role}", bukan pemilik. Silakan logout dan login menggunakan akun pemilik.`
                );
              }

              return;
            }
          } catch {
            console.warn(
              'Data user di localStorage tidak valid.'
            );
          }
        }

        const response = await api.get(
          '/pemilik/dashboard',
          {
            params: {
              timestamp: Date.now(),
            },

            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept: 'application/json',

              'Cache-Control':
                'no-cache',
            },
          }
        );

        const payload =
          response.data?.data ??
          response.data;

        console.log(
          'DASHBOARD PEMILIK RESPONSE:',
          payload
        );

        const normalizedData: DashboardData = {
          nama:
            payload?.nama ??
            'Pemilik',

          role:
            payload?.role ??
            'pemilik',

          total_proyek: Number(
            payload?.total_proyek ?? 0
          ),

          proyek_berjalan: Number(
            payload?.proyek_berjalan ?? 0
          ),

          proyek_selesai: Number(
            payload?.proyek_selesai ?? 0
          ),

          proyek_terbaru:
            Array.isArray(
              payload?.proyek_terbaru
            )
              ? payload.proyek_terbaru.map(
                  (item: any) => ({
                    id_proyek: Number(
                      item.id_proyek
                    ),

                    kode_proyek:
                      item.kode_proyek ??
                      null,

                    nama_proyek:
                      item.nama_proyek ??
                      'Proyek tanpa nama',

                    lokasi:
                      item.lokasi ?? null,

                    status:
                      item.status ??
                      'aktif',

                    tgl_mulai:
                      item.tgl_mulai ??
                      null,

                    tgl_selesai:
                      item.tgl_selesai ??
                      null,

                    progres: Number(
                      item.progres ?? 0
                    ),
                  })
                )
              : [],
        };

        if (isMounted) {
          setData(normalizedData);
        }
      } catch (err: any) {
        console.error(
          'GAGAL LOAD DASHBOARD PEMILIK:',
          err.response?.data ?? err
        );

        const status =
          err.response?.status;

        if (status === 401) {
          localStorage.removeItem(
            'auth_token'
          );

          localStorage.removeItem(
            'user'
          );

          if (isMounted) {
            setError(
              'Sesi login telah berakhir.'
            );
          }

          router.replace('/auth/login');
          return;
        }

        if (status === 403) {
          if (isMounted) {
            setError(
              err.response?.data?.message ??
                'Akun yang digunakan bukan akun pemilik. Silakan logout dan login menggunakan akun pemilik.'
            );
          }

          return;
        }

        if (isMounted) {
          setError(
            err.response?.data?.message ??
              'Gagal mengambil data dashboard pemilik.'
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
     LOGOUT DAN LOGIN PEMILIK
  ========================== */
  const loginSebagaiPemilik = () => {
    localStorage.removeItem(
      'auth_token'
    );

    localStorage.removeItem('user');

    router.replace('/auth/login');
  };

  /* =========================
     LOADING
  ========================== */
  if (loading) {
    return (
      <main className="main-content">
        <div style={stateContainer}>
          Memuat dashboard pemilik...
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
        <div style={errorBox}>
          <strong>
            Dashboard pemilik tidak dapat dibuka
          </strong>

          <p
            style={{
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            {error}
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={
              loginSebagaiPemilik
            }
          >
            Login sebagai Pemilik
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      {/* HEADER */}
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <h1 className="title">
          Dashboard Pemilik
        </h1>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            color: '#6b7280',
          }}
        >
          Selamat datang,{' '}
          <strong>
            {data?.nama ?? 'Pemilik'}
          </strong>
        </p>
      </div>

      {/* SUMMARY */}
      <div
        className="grid grid-3"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, minmax(0, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <SummaryCard
          title="Total Proyek"
          value={
            data?.total_proyek ?? 0
          }
          color="#3b82f6"
        />

        <SummaryCard
          title="Proyek Berjalan"
          value={
            data?.proyek_berjalan ?? 0
          }
          color="#f59e0b"
        />

        <SummaryCard
          title="Proyek Selesai"
          value={
            data?.proyek_selesai ?? 0
          }
          color="#10b981"
        />
      </div>

      {/* PROYEK TERBARU */}
      <div
        className="card"
        style={{
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
            }}
          >
            Proyek Saya
          </h2>

          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              router.push(
                '/pemilik/proyek'
              )
            }
          >
            Lihat Semua
          </button>
        </div>

        {data?.proyek_terbaru
          .length === 0 ? (
          <div
            style={{
              padding: 36,
              textAlign: 'center',
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: 8,
            }}
          >
            Belum ada proyek yang
            terhubung dengan akun Anda.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Proyek</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Progres</th>
                  <th className="center">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {data?.proyek_terbaru.map(
                  proyek => {
                    const progress =
                      Math.min(
                        Math.max(
                          Number(
                            proyek.progres ??
                              0
                          ),
                          0
                        ),
                        100
                      );

                    return (
                      <tr
                        key={
                          proyek.id_proyek
                        }
                      >
                        <td>
                          <strong>
                            {
                              proyek.nama_proyek
                            }
                          </strong>

                          {proyek.kode_proyek && (
                            <small
                              style={{
                                display:
                                  'block',
                                marginTop: 4,
                                color:
                                  '#6b7280',
                              }}
                            >
                              {
                                proyek.kode_proyek
                              }
                            </small>
                          )}
                        </td>

                        <td>
                          {proyek.lokasi ??
                            '-'}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              proyek.status
                            }
                          />
                        </td>

                        <td>
                          <div
                            style={{
                              minWidth: 150,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  'flex',
                                justifyContent:
                                  'space-between',
                                marginBottom: 6,
                                fontSize:
                                  '0.85rem',
                              }}
                            >
                              <span>
                                Progres
                              </span>

                              <strong>
                                {Math.round(
                                  progress
                                )}
                                %
                              </strong>
                            </div>

                            <div
                              style={{
                                height: 7,
                                background:
                                  '#e5e7eb',
                                borderRadius: 5,
                                overflow:
                                  'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width:
                                    `${progress}%`,

                                  height:
                                    '100%',

                                  background:
                                    progress >=
                                    100
                                      ? '#10b981'
                                      : '#3b82f6',
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="center">
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() =>
                              router.push(
                                `/pemilik/proyek/${proyek.id_proyek}`
                              )
                            }
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================
   SUMMARY CARD
========================== */
function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="card summary-card"
      style={{
        textAlign: 'center',
        padding: 20,
        borderTop:
          `4px solid ${color}`,
      }}
    >
      <div
        style={{
          color: '#666666',
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: '2rem',
          color,
        }}
      >
        {Number(value ?? 0)}
      </strong>
    </div>
  );
}

/* =========================
   STATUS BADGE
========================== */
function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus = String(
    status ?? ''
  )
    .trim()
    .toLowerCase();

  let background = '#dbeafe';
  let color = '#1d4ed8';
  let label = status || 'Aktif';

  if (
    normalizedStatus === 'selesai'
  ) {
    background = '#d1fae5';
    color = '#047857';
    label = 'Selesai';
  } else if (
    normalizedStatus === 'berjalan'
  ) {
    background = '#fef3c7';
    color = '#b45309';
    label = 'Berjalan';
  } else if (
    normalizedStatus === 'aktif'
  ) {
    background = '#dbeafe';
    color = '#1d4ed8';
    label = 'Aktif';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '5px 10px',
        borderRadius: 999,
        background,
        color,
        fontSize: '0.8rem',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

/* =========================
   STYLE
========================== */
const stateContainer = {
  minHeight: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
};

const errorBox = {
  padding: 20,
  color: '#991b1b',
  background: '#fee2e2',
  border: '1px solid #fecaca',
  borderRadius: 10,
};