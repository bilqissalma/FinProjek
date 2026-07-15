'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';

declare global {
  interface Window {
    snap: any;
  }
}

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (!userData || !token) {
      router.replace('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);

      // Jika sudah premium, langsung ke dashboard
      if (parsedUser.is_premium > 0) {
        router.replace('/kontraktor/dashboard');
        return;
      }

      setUser(parsedUser);
    } catch {
      localStorage.clear();
      router.replace('/auth/login');
    }
  }, [router]);

  const handleUpgrade = async () => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      alert('Token tidak ditemukan, silakan login ulang');
      router.replace('/auth/login');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        '/api/payments/create',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const snapToken = response.data.snap_token;

      if (!snapToken) throw new Error('Snap token tidak diterima');

      if (!window.snap) throw new Error('Midtrans Snap belum ter-load');

      window.snap.pay(snapToken, {
        onSuccess: async () => {
          alert('Pembayaran berhasil 🎉');

          // Update di backend agar is_premium = 1
          try {
            await axios.post(
              '/api/payment/mark-vip',
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update localStorage
            const updatedUser = { ...user, is_premium: 1 };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (err) {
            console.error('Gagal update status VIP di backend', err);
          }

          router.replace('/kontraktor/dashboard');
        },
        onPending: () => {
          alert('Menunggu pembayaran');
        },
        onError: (err: any) => {
          console.error('❌ Midtrans error:', err);
          alert('Pembayaran gagal');
        },
        onClose: () => {
          alert('Popup pembayaran ditutup');
        },
      });
    } catch (error: any) {
      console.error('❌ UPGRADE ERROR:', error?.response || error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Terjadi kesalahan saat upgrade'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>
        Upgrade ke Premium
      </h1>

      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Dapatkan akses penuh untuk fitur administratif dan pelaporan proyek Anda.
      </p>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '25px',
          background: '#fff',
        }}
      >
        <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>
          Paket Premium
        </h2>

        <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          Rp 99.000 <span style={{ fontSize: '14px' }}>/ bulan</span>
        </p>

        <ul style={{ marginBottom: '25px', lineHeight: '1.8' }}>
          <li>✅ Proyek tanpa batas</li>
          <li>✅ Ekspor laporan keuangan (PDF / Excel)</li>
          <li>✅ Statistik & rekapitulasi proyek</li>
          <li>✅ Akses penuh fitur premium</li>
        </ul>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Memproses...' : 'Bayar Sekarang'}
        </button>

        <p
          style={{
            marginTop: '15px',
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          *Pembayaran diproses melalui Midtrans
        </p>
      </div>
    </div>
  );
}
