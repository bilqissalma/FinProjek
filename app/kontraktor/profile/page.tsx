'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/url';

type UserProfile = {
  nama_lengkap: string;
  email: string | null;
  no_telepon: string | null;
  foto_profil: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    no_telepon: '',
    password: '',
    foto_profil: null as File | null,
  });

  const fetchProfile = async () => {
    try {
      // Endpoint yang benar adalah /profile (bukan /kontraktor/profile)
      const res = await api.get('/profile');
      const data: UserProfile = res.data.data || res.data;

      setForm(prev => ({
        ...prev,
        nama_lengkap: data.nama_lengkap,
        email: data.email ?? '',
        no_telepon: data.no_telepon ?? '',
        password: '',
        foto_profil: null,
      }));

      // Update LocalStorage agar Layout sinkron
      localStorage.setItem('user', JSON.stringify(data));
      window.dispatchEvent(new Event('storage')); // Trigger update layout

      if (data.foto_profil) {
        const timestamp = new Date().getTime();
        const url = getStorageUrl(data?.foto_profil);
        setPreview(`${url}?t=${timestamp}`);
      } else {
        setPreview(null);
      }

    } catch (err) {
      console.error(err);
      // router.push('/auth/login'); // Uncomment jika ingin strict auth
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB');
      return;
    }

    setForm({ ...form, foto_profil: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('nama_lengkap', form.nama_lengkap);
    fd.append('email', form.email);
    if (form.no_telepon) fd.append('no_telepon', form.no_telepon);
    if (form.password) fd.append('password', form.password);
    if (form.foto_profil) fd.append('foto_profil', form.foto_profil);

    try {
      await api.post('/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Profil berhasil diperbarui');
      // Fetch ulang untuk update data di semua tempat
      fetchProfile();
      
      setForm(prev => ({ ...prev, password: '' }));

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal memperbarui profil');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus akun?')) return;
    try {
      await api.delete('/profile');
      localStorage.clear();
      router.push('/auth/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal hapus akun');
    }
  };

  if (loading) return <p className="main-content">Loading...</p>;

  return (
    <main className="main-content">
      <div className="profile-wrapper" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 className="title">Profil Pengguna</h1>

        <form onSubmit={handleSubmit} className="card profile-card" style={{ padding: 24 }}>
          <div className="avatar-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '3px solid #eee', marginBottom: 10 }}>
                <img 
                    src={preview || '/images/default-avatar.png'} 
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
            <label style={{ cursor: 'pointer', color: '#007bff', fontWeight: 'bold' }}>
                Ganti Foto
                <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold'}}>Nama Lengkap</label>
            <input name="nama_lengkap" className="form-control" style={{width:'100%', padding:10}} value={form.nama_lengkap} onChange={handleChange} required />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold'}}>Email</label>
            <input name="email" className="form-control" style={{width:'100%', padding:10, background:'#f5f5f5'}} value={form.email} readOnly />
          </div>

          <div className="form-group" style={{marginBottom:15}}>
            <label style={{fontWeight:'bold'}}>No Telepon</label>
            <input name="no_telepon" className="form-control" style={{width:'100%', padding:10}} value={form.no_telepon} onChange={handleChange} />
          </div>

          <div className="form-group" style={{marginBottom:20}}>
            <label style={{fontWeight:'bold'}}>Password Baru (Opsional)</label>
            <input type="password" name="password" className="form-control" style={{width:'100%', padding:10}} value={form.password} onChange={handleChange} placeholder="Isi jika ingin ganti password" />
          </div>

          <button className="btn-primary" style={{ width: '100%', padding: 12 }}>Simpan Perubahan</button>
        </form>

        <div className="profile-actions" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={handleLogout} className="btn-outline">Logout</button>
          <button type="button" onClick={handleDelete} className="btn-danger" style={{ color: 'red', border: 'none', background: '#ffebee', padding: '10px 20px', borderRadius: 6 }}>Hapus Akun</button>
        </div>
      </div>
    </main>
  );
}