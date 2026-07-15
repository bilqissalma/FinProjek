'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios'; // Gunakan Axios Helper
import { getStorageUrl } from '@/lib/url';

type UserProfile = {
  nama_lengkap: string;
  email: string | null;
  no_telepon: string | null;
  foto_profil: string | null;
};

export default function ProfilePemilikPage() {
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

  /* ================= FETCH PROFILE ================= */
  const fetchProfile = async () => {
    try {
      const res = await api.get('/pemilik/profile');
      
      const data: UserProfile = res.data.data || res.data;

      setForm(prev => ({
        ...prev,
        nama_lengkap: data.nama_lengkap,
        email: data.email ?? '',
        no_telepon: data.no_telepon ?? '',
        password: '',
        foto_profil: null,
      }));

      if (data.foto_profil) {
        const timestamp = new Date().getTime();
        const url = getStorageUrl(data?.foto_profil);
        
        setPreview(`${url}?t=${timestamp}`);
      } else {
        setPreview(null);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /* ================= HANDLER ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

    setForm(prev => ({ ...prev, foto_profil: file }));
    setPreview(URL.createObjectURL(file));
  };

  /* ================= UPDATE ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('nama_lengkap', form.nama_lengkap);
    fd.append('email', form.email);
    fd.append('no_telepon', form.no_telepon);
    if (form.password) fd.append('password', form.password);
    if (form.foto_profil) fd.append('foto_profil', form.foto_profil);

    try {
      const res = await api.post('/pemilik/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newData = res.data.data || res.data;
      localStorage.setItem('user', JSON.stringify(newData));
      window.dispatchEvent(new Event('storage'));

      alert('Profil berhasil diperbarui');
      fetchProfile(); 

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal update profil');
    }
  };

  /* ================= ACTIONS ================= */
  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus akun? Data tidak bisa dikembalikan.')) return;
    try {
        await api.delete('/pemilik/profile');
        localStorage.clear();
        router.push('/auth/login');
    } catch (err) {
        alert("Gagal menghapus akun");
    }
  };

  if (loading) return <p className="main-content">Loading...</p>;

  return (
    <main className="main-content">
      <div className="profile-wrapper" style={{maxWidth: 600, margin: '0 auto'}}>
        <h1 className="title">Profil Pemilik</h1>

        <form onSubmit={handleSubmit} className="card profile-card" style={{padding: 24}}>
          
          <div className="avatar-wrapper" style={{textAlign: 'center', marginBottom: 20}}>
            <img 
                src={preview || '/avatar-placeholder.png'} 
                alt="Foto Profil" 
                style={{width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #eee'}}
            />
            <br/>
            <label style={{color: '#007bff', cursor: 'pointer', marginTop: 10, display: 'inline-block'}}>
                Ubah Foto
                <input type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} />
            </label>
          </div>

          <div className="form-group" style={{marginBottom: 15}}>
             <label style={{fontWeight:'bold'}}>Nama Lengkap</label>
             <input
                name="nama_lengkap"
                className="form-control" style={{width:'100%', padding: 8}}
                value={form.nama_lengkap}
                onChange={handleChange}
                required
              />
          </div>

          <div className="form-group" style={{marginBottom: 15}}>
             <label style={{fontWeight:'bold'}}>Email</label>
             <input
                name="email"
                className="form-control" style={{width:'100%', padding: 8, background: '#f5f5f5'}}
                value={form.email}
                onChange={handleChange}
                readOnly
              />
          </div>

          <div className="form-group" style={{marginBottom: 15}}>
             <label style={{fontWeight:'bold'}}>No Telepon</label>
             <input
                name="no_telepon"
                className="form-control" style={{width:'100%', padding: 8}}
                value={form.no_telepon}
                onChange={handleChange}
              />
          </div>

          <div className="form-group" style={{marginBottom: 20}}>
             <label style={{fontWeight:'bold'}}>Password Baru (Opsional)</label>
             <input
                type="password"
                name="password"
                className="form-control" style={{width:'100%', padding: 8}}
                value={form.password}
                onChange={handleChange}
                placeholder="Isi jika ingin ganti password"
              />
          </div>

          <button className="btn-primary" style={{width:'100%', padding: 12}}>Simpan Perubahan</button>
        </form>

        <div className="profile-actions" style={{marginTop: 30, display: 'flex', justifyContent: 'space-between'}}>
          <button type="button" onClick={handleLogout} className="btn-outline">Logout</button>
          
          {/* ✅ PERBAIKAN TOMBOL HAPUS (Merah Background, Putih Teks) */}
          <button 
            type="button" 
            onClick={handleDelete} 
            className="btn-danger" 
            style={{
                backgroundColor: '#dc2626', // Merah
                color: '#ffffff',           // Putih (Kontras)
                border: 'none',
                padding: '10px 20px',
                borderRadius: 6,
                cursor: 'pointer'
            }}
          >
            Hapus Akun
          </button>

        </div>
      </div>
    </main>
  );
}