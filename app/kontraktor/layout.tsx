'use client';

import '../../styles/style.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/url';

export default function KontraktorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sisaHari, setSisaHari] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const localData = localStorage.getItem('user');
    if (localData) {
      const parsed = JSON.parse(localData);
      setUser(parsed);
      hitungSisaHari(parsed);
    }

    // 2. FETCH DATA TERBARU DARI SERVER (Agar foto/nama selalu update)
    // Ubah endpoint sesuai endpoint profile kontraktor Anda
    api.get('/profile') 
      .then(res => {
        const newData = res.data.data || res.data;
        
        // Update State & LocalStorage
        setUser(newData);
        localStorage.setItem('user', JSON.stringify(newData));
        hitungSisaHari(newData);
      })
      .catch(err => {
        console.error("Gagal sync user:", err);
        if (err.response?.status === 401) logout();
      });

  }, []); // Run sekali saat mount

  const hitungSisaHari = (userData: any) => {
    if (userData.vip_expired_at) {
      const expired = new Date(userData.vip_expired_at);
      const now = new Date();
      const diffTime = expired.getTime() - now.getTime();
      const diffDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setSisaHari(diffDay);
    }
  };

  const logout = () => {
    localStorage.clear();
    alert('Anda berhasil logout');
    router.push('/auth/login');
  };

  // Helper untuk URL Foto Profil yang Aman
  const getAvatarUrl = () => {
    if (!user?.foto_profil) return '/images/default-avatar.png'; // Pastikan file ini ada di public/images
    
    // Jika di database tersimpan sebagai URL lengkap (misal dari Google Auth atau full path)
    if (user.foto_profil.startsWith('http')) return user.foto_profil;
    
    // Jika hanya filename (misal: avatars/foto.jpg)
    return getStorageUrl(user?.foto_profil);
  };

  // Cegah render jika user null (loading state sederhana)
  if (!user) return null; 

  return (
    <>
      <header>
        <div className="header-content">
          <div className="header-left">
            <img src="/images/logo.png" alt="Logo" className="logo" />
            <span>FinProjek</span>
          </div>

          <div className="header-right">
          {Number(user.is_premium) === 1 ? (
              <>
                {/* <div className="vip-badge">👑 VIP</div> */}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <button
                  className="upgrade-btn"
                  onClick={() => router.push('/kontraktor/upgrade')}
                >
                  Upgrade ke Premium
                </button>

                {sisaHari !== null && (
                  <small style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                    {sisaHari > 0
                      ? `Trial: sisa ${sisaHari} hari`
                      : 'Trial sudah habis'}
                  </small>
                )}
              </div>
            )}

        <button
          className="logout-btn"
          onClick={logout}
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
          </div>
        </div>
      </header>

      <div className="dashboard-wrapper">
        <aside className="sidebar">
          <div
            className="sidebar-profile"
            onClick={() => router.push('/kontraktor/profile')}
            style={{ cursor: 'pointer' }}
          >
            {/* GUNAKAN HELPER URL */}
            <img
              src={getAvatarUrl()}
              alt="Foto Profil"
              className="sidebar-avatar"
              style={{ objectFit: 'cover' }}
            />

            <div className="sidebar-profile-info">
              <strong>{user.nama_lengkap}</strong>
              <span>Kontraktor</span>
            </div>
          </div>

          <hr className="sidebar-divider" />

          <ul className="sidebar-menu">
            {[
              ['Dashboard', '/kontraktor/dashboard'],
              ['Proyek', '/kontraktor/proyek'],
              ['Pekerjaan', '/kontraktor/pekerjaan'],
              ['Pengeluaran', '/kontraktor/pengeluaran'],
              ['Material', '/kontraktor/material'],
              ['Laporan Keuangan', '/kontraktor/laporan-keuangan'],
              ['Progres', '/kontraktor/progres'],
            ].map(([label, href]) => (
              <li key={href} className={pathname === href ? 'active' : ''}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </aside>

        {children}
      </div>
    </>
  );
}