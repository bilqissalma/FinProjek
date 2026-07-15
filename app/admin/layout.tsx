'use client';

import '../../styles/style.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.replace('/auth/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);

      // 🔒 validasi role admin
      if (userData.role !== 'admin') {
        localStorage.clear();
        router.replace('/auth/login');
        return;
      }

      setUser(userData);
    } catch (error) {
      localStorage.clear();
      router.replace('/auth/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.replace('/auth/login');
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Memuat...</div>;
  }

  return (
    <>
      {/* ===== HEADER ===== */}
      <header>
        <div className="header-content">
          <div className="header-left">
            <img src="/images/logo.png" alt="Logo" className="logo" />
            <span>FinProjek</span>
          </div>

          <div className="header-right">
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ===== WRAPPER ===== */}
      <div className="dashboard-wrapper">
        <aside className="sidebar">
          {/* ===== PROFIL SIDEBAR TETAP STATIC ===== */}
          <div className="sidebar-profile" style={{ cursor: 'default' }}>
            <img
              src="/images/profile.png" // foto default untuk semua admin
              alt="Foto Profil"
              className="sidebar-avatar"
            />

            <div className="sidebar-profile-info">
              <strong>{user?.nama_lengkap}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <hr className="sidebar-divider" />

          {/* ===== MENU ===== */}
          <ul className="sidebar-menu">
            {[
              ['Dashboard', '/admin/dashboard'],
              ['Manajemen User', '/admin/users'],
              ['Kelola Admin', '/admin/admins'],
            ].map(([label, href]) => (
              <li key={href} className={pathname === href ? 'active' : ''}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="dashboard-content">{children}</main>
      </div>
    </>
  );
}
