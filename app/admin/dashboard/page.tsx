'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

type User = {
  role: 'admin' | 'kontraktor' | 'pemilik';
  status: 'aktif' | 'tidak aktif';
  is_premium: number;
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => alert('Gagal mengambil data dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  /* =======================
     HITUNG DATA
  ======================= */
  const totalUser = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const kontraktor = users.filter(u => u.role === 'kontraktor');
  const pemilikCount = users.filter(u => u.role === 'pemilik').length;
  const vipCount = kontraktor.filter(u => u.is_premium === 1).length;
  const freeCount = kontraktor.filter(u => u.is_premium === 0).length;
  const aktifCount = users.filter(u => u.status === 'aktif').length;
  const nonAktifCount = users.filter(u => u.status === 'tidak aktif').length;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const roleChart = {
    labels: ['Admin', 'Kontraktor', 'Pemilik'],
    datasets: [
      {
        label: 'Jumlah User',
        data: [adminCount, kontraktor.length, pemilikCount],
        backgroundColor: ['#2563eb', '#16a34a', '#f59e0b'],
        borderRadius: 6,
      },
    ],
  };

  const vipChart = {
    labels: ['VIP', 'Gratis'],
    datasets: [
      {
        label: 'Kontraktor',
        data: [vipCount, freeCount],
        backgroundColor: ['#7c3aed', '#cbd5e1'],
        borderRadius: 6,
      },
    ],
  };

  const statusChart = {
    labels: ['Aktif', 'Tidak Aktif'],
    datasets: [
      {
        label: 'Status User',
        data: [aktifCount, nonAktifCount],
        backgroundColor: ['#16a34a', '#dc2626'],
        borderRadius: 6,
      },
    ],
  };

  return (
    <main
      className="admin-main"
      style={{
        width: 'calc(100vw - 260px)', // ⬅️ FULL WIDTH FIX
        marginLeft: '260px',          // ⬅️ SEJAJAR SIDEBAR
        paddingRight: 24,
      }}
    >
      <h1 className="admin-title">Dashboard Admin</h1>
      <p className="admin-subtitle">
        Monitoring pengguna & sistem aplikasi
      </p>

      {/* ===== SUMMARY ===== */}
      <div className="admin-grid admin-grid-4">
        <div className="admin-summary-card">
          <span>Total User</span>
          <strong>{totalUser}</strong>
        </div>

        <div className="admin-summary-card">
          <span>Kontraktor VIP</span>
          <strong>{vipCount}</strong>
        </div>

        <div className="admin-summary-card">
          <span>Kontraktor Gratis</span>
          <strong>{freeCount}</strong>
        </div>

        <div className="admin-summary-card">
          <span>User Aktif</span>
          <strong>{aktifCount}</strong>
        </div>
      </div>

      {/* ===== CHARTS ===== */}
      <div className="admin-grid admin-grid-3">
        <div className="admin-card" style={{ height: 360 }}>
          <h3>Distribusi Role User</h3>
          <Bar data={roleChart} options={chartOptions} />
        </div>

        <div className="admin-card" style={{ height: 360 }}>
          <h3>VIP vs Gratis</h3>
          <Bar data={vipChart} options={chartOptions} />
        </div>

        <div className="admin-card" style={{ height: 360 }}>
          <h3>Status User</h3>
          <Bar data={statusChart} options={chartOptions} />
        </div>
      </div>
    </main>
  );
}
