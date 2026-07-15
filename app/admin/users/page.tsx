'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios'; // Gunakan Axios helper
import TambahUser from './tambah/page'; // Pastikan path benar

type User = {
  id_user: number;
  nama_lengkap: string;
  email: string;
  role: 'kontraktor' | 'pemilik' | 'admin';
  status: 'aktif' | 'tidak aktif';
  is_premium: number;
};

export default function UserAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<'all' | string>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showModalTambah, setShowModalTambah] = useState(false);

  const router = useRouter();

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      // Fix Wrapper
      const rawData = res.data.data || res.data;
      const list = Array.isArray(rawData) ? rawData : [];
      
      // Filter out admin (opsional, jika ingin sembunyikan sesama admin)
      setUsers(list.filter((u: any) => u.role !== 'admin'));
    } catch (err) {
      console.error("Gagal load users:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (id: number) => {
    if (!confirm('Yakin ingin menghapus user ini? Data tidak bisa dikembalikan.')) return;

    try {
      await api.delete(`/admin/users/${id}`);
      alert("User berhasil dihapus");
      setOpenMenuId(null);
      loadUsers(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus user");
    }
  };

  const filteredUsers = selectedRole === 'all'
    ? users
    : users.filter(u => u.role === selectedRole);

  return (
    <main className="main-content">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="title">Manajemen Pengguna</h1>
          <p style={{ color: '#777' }}>Kelola data kontraktor & pemilik properti</p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <select
            className="input form-control"
            style={{ width: 150, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">Semua Role</option>
            <option value="kontraktor">Kontraktor</option>
            <option value="pemilik">Pemilik</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={() => setShowModalTambah(true)}
            // Atau jika pakai halaman terpisah:
            // onClick={() => router.push('/admin/users/tambah')}
          >
            + Tambah User
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="modern-table" style={{ width: '100%', minWidth: 800 }}>
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>VIP</th>
              <th style={{ textAlign: 'center', width: 80 }}>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#888' }}>
                  Tidak ada data user.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id_user}>
                  <td style={{ fontWeight: 500 }}>{u.nama_lengkap}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'kontraktor' ? 'badge-blue' : 'badge-orange'}`} 
                          style={{ textTransform: 'capitalize', padding: '4px 8px', borderRadius: 4, background: u.role === 'kontraktor' ? '#eff6ff' : '#fff7ed', color: u.role === 'kontraktor' ? '#1d4ed8' : '#c2410c' }}>
                        {u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                        color: u.status === 'aktif' ? '#16a34a' : '#dc2626', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem' 
                    }}>
                        {u.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td>
                    {u.role === 'kontraktor' ? (
                        Number(u.is_premium) === 1 
                        ? <span style={{color:'#7c3aed', fontWeight:'bold'}}>👑 VIP</span> 
                        : <span style={{color:'#64748b'}}>Gratis</span>
                    ) : '-'}
                  </td>

                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === u.id_user ? null : u.id_user)}
                      style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#555' }}
                    >
                      ⋮
                    </button>

                    {openMenuId === u.id_user && (
                      <>
                        {/* Overlay transparan untuk tutup menu saat klik luar */}
                        <div style={{position:'fixed', inset:0, zIndex:99}} onClick={() => setOpenMenuId(null)}></div>
                        
                        <div style={{
                            position: 'absolute', right: 0, top: 30, background: '#fff', 
                            border: '1px solid #eee', borderRadius: 8, boxShadow: '0 5px 15px rgba(0,0,0,0.1)', 
                            zIndex: 100, minWidth: 140, overflow: 'hidden', textAlign: 'left'
                        }}>
                          <button
                            style={{ display:'block', width:'100%', padding: '10px 15px', border:'none', background:'white', textAlign:'left', cursor: 'pointer', fontSize:'0.9rem' }}
                            onClick={() => router.push(`/admin/users/${u.id_user}/edit`)}
                          >
                            ✏️ Edit Data
                          </button>

                          <button
                            style={{ display:'block', width:'100%', padding: '10px 15px', border:'none', background:'white', textAlign:'left', cursor: 'pointer', color: '#dc2626', fontSize:'0.9rem', borderTop:'1px solid #f0f0f0' }}
                            onClick={() => deleteUser(u.id_user)}
                          >
                            🗑️ Hapus User
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
      
      {/* Modal Tambah User (Jika pakai modal satu halaman) */}
      {showModalTambah && (
        <TambahUser onClose={() => { setShowModalTambah(false); loadUsers(); }} />
      )}
    </main>
  );
}