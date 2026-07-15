'use client';

import '../../styles/style.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/url';

type UserData = {
  id_user?: number;
  nama_lengkap?: string;
  email?: string;
  role?: string;
  foto_profil?: string | null;
};

export default function KontraktorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    alert('Anda berhasil logout');
    router.replace('/auth/login');
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        router.replace('/auth/login');
        return;
      }

      /*
       * Tampilkan dahulu data yang tersimpan di localStorage
       * agar halaman tidak menunggu terlalu lama.
       */
      const localData = localStorage.getItem('user');

      if (localData) {
        try {
          const parsedUser: UserData = JSON.parse(localData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Data user di localStorage tidak valid:', error);
          localStorage.removeItem('user');
        }
      }

      /*
       * Ambil data profil terbaru dari backend.
       */
      try {
        const response = await api.get('/profile');
        const newData: UserData =
          response.data?.data ?? response.data;

        /*
         * Pastikan akun yang masuk adalah kontraktor.
         */
        if (
          newData.role &&
          newData.role.toLowerCase() !== 'kontraktor'
        ) {
          localStorage.clear();
          router.replace('/auth/login');
          return;
        }

        setUser(newData);
        localStorage.setItem('user', JSON.stringify(newData));
      } catch (error: any) {
        console.error('Gagal mengambil profil kontraktor:', error);

        if (error.response?.status === 401) {
          localStorage.clear();
          router.replace('/auth/login');
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const getAvatarUrl = () => {
    if (!user?.foto_profil) {
      return '/images/default-avatar.png';
    }

    if (user.foto_profil.startsWith('http')) {
      return user.foto_profil;
    }

    return getStorageUrl(user.foto_profil);
  };

  if (isLoading && !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        Memuat data...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/kontraktor/dashboard',
    },
    {
      label: 'Proyek',
      href: '/kontraktor/proyek',
    },
    {
      label: 'Pekerjaan',
      href: '/kontraktor/pekerjaan',
    },
    {
      label: 'Pengeluaran',
      href: '/kontraktor/pengeluaran',
    },
    {
      label: 'Material',
      href: '/kontraktor/material',
    },
    {
      label: 'Laporan Keuangan',
      href: '/kontraktor/laporan-keuangan',
    },
    {
      label: 'Progres',
      href: '/kontraktor/progres',
    },
  ];

  return (
    <>
      <header>
        <div className="header-content">
          <div className="header-left">
            <img
              src="/images/logo.png"
              alt="Logo FinProjek"
              className="logo"
            />

            <span>FinProjek</span>
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
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                router.push('/kontraktor/profile');
              }
            }}
          >
            <img
              src={getAvatarUrl()}
              alt="Foto profil kontraktor"
              className="sidebar-avatar"
              style={{ objectFit: 'cover' }}
              onError={(event) => {
                event.currentTarget.src =
                  '/images/default-avatar.png';
              }}
            />

            <div className="sidebar-profile-info">
              <strong>
                {user.nama_lengkap || 'Kontraktor'}
              </strong>

              <span>Kontraktor</span>
            </div>
          </div>

          <hr className="sidebar-divider" />

          <ul className="sidebar-menu">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <li
                  key={item.href}
                  className={isActive ? 'active' : ''}
                >
                  <Link href={item.href}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {children}
      </div>
    </>
  );
}