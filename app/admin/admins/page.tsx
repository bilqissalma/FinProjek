// 📂 File: src/app/admin/admins/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

type Admin = {
  id_user: number;
  nama_lengkap: string;
  email: string;
  role: string;
  status: 'aktif' | 'tidak aktif';
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null); // State untuk kontrol menu
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadAdmins = async () => {
    try {
      const res = await api.get('/admin/users');
      const rawData = res.data.data || res.data;
      const list = Array.isArray(rawData) ? rawData : [];
      setAdmins(list.filter((u: any) => u.role === 'admin'));
    } catch (err) {
      console.error("Gagal load admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const deleteAdmin = async (id: number) => {
    if (!confirm('Yakin ingin menghapus admin ini?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      alert('Admin berhasil dihapus');
      setOpenMenuId(null);
      loadAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus admin');
    }
  };

  if (loading) return <p className="main-content" style={{marginLeft: '260px'}}>Loading...</p>;

  return (
    <main className="main-content" style={{width: 'calc(100vw - 260px)', marginLeft: '260px', paddingRight: 24}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
            <h1 className="title">Kelola Admin</h1>
            <p style={{color: '#666'}}>Manajemen akun administrator</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/admin/admins/tambah')}>
          + Tambah Admin
        </button>
      </div>

      <div className="card">
        <table className="modern-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Status</th>
              <th style={{ textAlign: 'center', width: 100 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Tidak ada admin lain.</td></tr>
            ) : (
              admins.map(a => (
                <tr key={a.id_user}>
                  <td style={{fontWeight: 500}}>{a.nama_lengkap}</td>
                  <td>{a.email}</td>
                  <td>
                    <span style={{
                        color: a.status === 'aktif' ? '#16a34a' : '#dc2626',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                    }}>
                        {a.status}
                    </span>
                  </td>
                  
                  {/* ===== BAGIAN AKSI (DROPDOWN MENU) ===== */}
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <button 
                        onClick={() => setOpenMenuId(openMenuId === a.id_user ? null : a.id_user)}
                        style={{
                            background: 'transparent', 
                            border: 'none', 
                            fontSize: '1.2rem', 
                            cursor: 'pointer',
                            padding: '0 10px'
                        }}
                    >
                        ⋮
                    </button>

                    {/* Popup Menu */}
                    {openMenuId === a.id_user && (
                        <>
                            {/* Overlay transparan untuk menutup menu saat klik di luar */}
                            <div 
                                style={{position: 'fixed', inset: 0, zIndex: 99}} 
                                onClick={() => setOpenMenuId(null)}
                            />
                            
                            <div style={{
                                position: 'absolute',
                                right: 10,
                                top: 35,
                                background: 'white',
                                border: '1px solid #eee',
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 100,
                                minWidth: 120,
                                overflow: 'hidden',
                                textAlign: 'left'
                            }}>
                                <button
                                    onClick={() => router.push(`/admin/admins/${a.id_user}/edit`)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '10px 15px',
                                        background: 'white',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: '#333'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    ✏️ Edit
                                </button>
                                
                                <button
                                    onClick={() => deleteAdmin(a.id_user)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '10px 15px',
                                        background: 'white',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: '#dc2626',
                                        borderTop: '1px solid #f0f0f0'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#fff1f2'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    🗑️ Hapus
                                </button>
                            </div>
                        </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}