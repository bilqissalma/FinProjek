'use client';

import '../../styles/style.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/axios'; // Gunakan Axios Helper
import { getStorageUrl } from '@/lib/url';


export default function PemilikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Cek LocalStorage dulu (biar cepat)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }

    // 2. Fetch data terbaru dari API (background update)
    api.get('/pemilik/profile')
      .then(res => {
        const data = res.data.data || res.data;
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      })
      .catch((err) => {
        // Jika 401 Unauthorized, baru logout
        if (err.response?.status === 401) {
            localStorage.clear();
            router.push('/auth/login');
        }
      });
      
    // 3. Listener jika ada update profil dari halaman lain
    const handleStorageChange = () => {
        const updatedUser = localStorage.getItem('user');
        if (updatedUser) setUser(JSON.parse(updatedUser));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, []);

  const logout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  // Helper URL Foto
  const getAvatarUrl = () => {
    return getStorageUrl(user?.foto_profil);
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <header>
        <div className="header-content">
          <div className="header-left">
            {/* Pastikan path logo benar, misal /logo.png */}
            <span style={{fontWeight:'bold', fontSize:'1.2rem'}}>FinProjek Pemilik</span>
          </div>

          <div className="header-right">
          <button
          type="button"
          className="logout-btn"
          onClick={logout}
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
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

      {/* ===== WRAPPER ===== */}
      <div className="dashboard-wrapper">
        <aside className="sidebar">
          {/* ===== PROFIL SIDEBAR ===== */}
          <div
            className="sidebar-profile"
            onClick={() => router.push('/pemilik/profile')}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={getAvatarUrl()}
              alt="Foto Profil"
              className="sidebar-avatar"
              style={{objectFit: 'cover'}}
            />

            <div className="sidebar-profile-info">
              <strong>{user?.nama_lengkap || 'Loading...'}</strong>
              <span>Pemilik Properti</span>
            </div>
          </div>

          <hr className="sidebar-divider" />

          {/* ===== MENU ===== */}
          <ul className="sidebar-menu">
            {[
              ['Dashboard', '/pemilik/dashboard'], // Tambahkan Dashboard
              ['Proyek Saya', '/pemilik/proyek'],
              ['Kelola Profil', '/pemilik/profile'],
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