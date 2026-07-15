'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

/* =========================
   CONSTANT SATUAN
========================== */
const SATUAN_OPTIONS = [
  'sak', 'kg', 'ton', 'liter', 'm', 'm2', 'm3',
  'pcs', 'unit', 'lembar', 'batang', 'roll', 'set', 'hari', 'jam',
];

type Distribusi = {
  id_pekerjaan: number | '';
  id_sub: number | '';
  rasio_penggunaan: number;
};

type Detail = {
  nama_item: string;
  satuan: string;
  banyak: number;
  harga_satuan: number;
  distribusi: Distribusi[];
  allow_partial: boolean;
};

export default function TambahPengeluaranModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void; // Opsional
}) {
  // Inisialisasi state dengan Array Kosong []
  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    no_nota: '',
    tgl_transaksi: '',
    spesifikasi: 'Material',
    id_proyek: '',
  });

  const [details, setDetails] = useState<Detail[]>([
    {
      nama_item: '',
      satuan: '',
      banyak: 1,
      harga_satuan: 0,
      allow_partial: false,
      distribusi: [{ id_pekerjaan: '', id_sub: '', rasio_penggunaan: 100 }],
    },
  ]);

  /* =========================
     FETCH INITIAL DATA
  ========================== */
  useEffect(() => {
    // 1. Proyek
    api.get('/proyek').then(res => {
      const raw = res.data.data || res.data;
      setProjects(Array.isArray(raw) ? raw : []);
    }).catch(err => console.error(err));

    // 2. Pekerjaan
    api.get('/pekerjaan').then(res => {
      const raw = res.data.data || res.data;
      setJobs(Array.isArray(raw) ? raw : []);
    }).catch(err => console.error(err));
  }, []);

  // Filter Jobs Aman
  const filteredJobs = jobs.filter(
    j => String(j.id_proyek) === String(form.id_proyek)
  );

  // Filter Subs Aman
  const getFilteredSubs = (id_pekerjaan: number | '') => {
    if (!Array.isArray(subs)) return [];
    return subs.filter(s => String(s.id_pekerjaan) === String(id_pekerjaan));
  };

  /* =========================
     HANDLERS
  ========================== */
  const updateDetail = <K extends keyof Detail>(
    i: number,
    key: K,
    value: Detail[K]
  ) => {
    setDetails(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [key]: value };
      return copy;
    });
  };

  const addDetail = () => {
    setDetails(prev => [
      ...prev,
      {
        nama_item: '',
        satuan: '',
        banyak: 1,
        harga_satuan: 0,
        allow_partial: false,
        distribusi: [{ id_pekerjaan: '', id_sub: '', rasio_penggunaan: 100 }],
      },
    ]);
  };

  /* =========================
     DISTRIBUSI (PERBAIKAN UTAMA DI SINI)
  ========================== */
  const updateDistribusi = <K extends keyof Distribusi>(
    i: number,
    d: number,
    key: K,
    value: Distribusi[K]
  ) => {
    setDetails(prev => {
      const copy = [...prev];
      // Clone distribusi object agar aman
      const dist = { ...copy[i].distribusi[d], [key]: value };

      // Jika ganti pekerjaan, reset sub & fetch sub baru
      if (key === 'id_pekerjaan') {
        dist.id_sub = ''; // Reset sub
        
        if (value) {
            // FETCH SUB PEKERJAAN
            api.get(`/pekerjaan/${value}/sub-pekerjaan`)
            .then(res => {
                // !!! BAGIAN PENTING: UNWRAP & CEK ARRAY !!!
                const rawData = res.data.data || res.data;
                const newSubs = Array.isArray(rawData) ? rawData : [];

                setSubs(prevSubs => {
                    // Gabungkan sub baru dengan yang lama (hindari duplikat)
                    const existingIds = new Set(prevSubs.map(s => s.id_sub));
                    const uniqueSubs = newSubs.filter((s: any) => !existingIds.has(s.id_sub));
                    return [...prevSubs, ...uniqueSubs];
                });
            })
            .catch(err => console.error("Gagal load sub:", err));
        }
      }

      copy[i].distribusi[d] = dist;
      return copy;
    });
  };

  const addDistribusiIfNeeded = (i: number) => {
    const total = details[i].distribusi.reduce(
      (sum, d) => sum + Number(d.rasio_penggunaan || 0),
      0
    );

    if (total < 100 && !details[i].allow_partial) {
      setDetails(prev => {
        const copy = [...prev];
        copy[i].distribusi.push({
          id_pekerjaan: '',
          id_sub: '',
          rasio_penggunaan: 100 - total,
        });
        return copy;
      });
    }
  };

  /* =========================
     SUBMIT
  ========================== */
  const handleSubmit = async () => {
    // Validasi
    if (!form.id_proyek) return alert("Pilih proyek dulu");
    
    // Validasi Loop
    for (const d of details) {
      if (!d.nama_item) return alert("Nama item wajib diisi");
      
      const totalRasio = d.distribusi.reduce((acc, curr) => acc + Number(curr.rasio_penggunaan), 0);
      if (!d.allow_partial && totalRasio !== 100) {
        return alert(`Total rasio untuk ${d.nama_item} harus 100%`);
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        id_proyek: Number(form.id_proyek),
        details: details.map(d => ({
          ...d,
          distribusi: d.distribusi.map(r => ({
            ...r,
            id_pekerjaan: Number(r.id_pekerjaan),
            id_sub: Number(r.id_sub),
          })),
        })),
      };

      await api.post('/pengeluaran', payload);

      alert('Pengeluaran berhasil disimpan');
      onClose();
      if (onSuccess) onSuccess();
      else window.location.reload();

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="modal-content" style={{ width: 900, background: 'white', padding: 24, borderRadius: 8, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Tambah Pengeluaran</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* --- FORM HEADER --- */}
        <div className="grid-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{display:'block', fontWeight:'bold'}}>No Nota</label>
            <input 
              className="form-control" style={{width:'100%', padding:8}}
              value={form.no_nota} 
              onChange={e => setForm({ ...form, no_nota: e.target.value })} 
            />
          </div>

          <div>
            <label style={{display:'block', fontWeight:'bold'}}>Tanggal Transaksi</label>
            <input 
              type="date" 
              className="form-control" style={{width:'100%', padding:8}}
              value={form.tgl_transaksi} 
              onChange={e => setForm({ ...form, tgl_transaksi: e.target.value })} 
            />
          </div>

          <div>
            <label style={{display:'block', fontWeight:'bold'}}>Spesifikasi</label>
            <select 
              className="form-control" style={{width:'100%', padding:8}}
              value={form.spesifikasi} 
              onChange={e => setForm({ ...form, spesifikasi: e.target.value as any })}
            >
              <option value="Material">Material</option>
              <option value="Tenaga">Tenaga</option>
            </select>
          </div>

          <div>
            <label style={{display:'block', fontWeight:'bold'}}>Proyek</label>
            <select 
              className="form-control" style={{width:'100%', padding:8}}
              value={form.id_proyek} 
              onChange={e => setForm({ ...form, id_proyek: e.target.value })}
            >
              <option value="">Pilih Proyek</option>
              {/* SAFETY MAP */}
              {Array.isArray(projects) && projects.map(p => (
                <option key={p.id_proyek} value={p.id_proyek}>{p.nama_proyek}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- DETAIL ITEM --- */}
        {details?.map((d, i) => (
          <div key={i} className="card" style={{ marginTop: 16, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
            <h4 style={{marginTop:0}}>Material #{i + 1}</h4>

            {/* Baris Input Item */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 10, marginBottom: 16 }}>
              <input 
                placeholder="Nama Item" className="form-control" style={{padding:8}}
                value={d.nama_item} 
                onChange={e => updateDetail(i, 'nama_item', e.target.value)} 
              />
              <select 
                className="form-control" style={{padding:8}}
                value={d.satuan} 
                onChange={e => updateDetail(i, 'satuan', e.target.value)}
              >
                <option value="">Satuan</option>
                {SATUAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input 
                type="number" placeholder="Qty" className="form-control" style={{padding:8}}
                value={d.banyak} 
                onChange={e => updateDetail(i, 'banyak', Number(e.target.value))} 
              />
              <input 
                type="number" placeholder="Harga Satuan" className="form-control" style={{padding:8}}
                value={d.harga_satuan} 
                onChange={e => updateDetail(i, 'harga_satuan', Number(e.target.value))} 
              />
            </div>

            {/* --- DISTRIBUSI --- */}
            <h5 style={{marginBottom:8}}>Distribusi Biaya</h5>
            {d.distribusi?.map((r, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.5fr', gap: 10, marginBottom: 8 }}>
                
                {/* PILIH PEKERJAAN */}
                <select
                  className="form-control" style={{padding:8}}
                  value={r.id_pekerjaan}
                  onChange={e => updateDistribusi(i, idx, 'id_pekerjaan', Number(e.target.value))}
                  disabled={!form.id_proyek}
                >
                  <option value="">Pilih Pekerjaan</option>
                  {filteredJobs?.map(j => (
                    <option key={j.id_pekerjaan} value={j.id_pekerjaan}>{j.nama_pekerjaan}</option>
                  ))}
                </select>

                {/* PILIH SUB PEKERJAAN */}
                <select
                  className="form-control" style={{padding:8}}
                  value={r.id_sub}
                  onChange={e => updateDistribusi(i, idx, 'id_sub', Number(e.target.value))}
                  disabled={!r.id_pekerjaan}
                >
                  <option value="">Pilih Sub Pekerjaan</option>
                  {/* PANGGIL FUNGSI SAFE GET SUBS */}
                  {getFilteredSubs(Number(r.id_pekerjaan)).map(s => (
                    <option key={s.id_sub} value={s.id_sub}>{s.nama_sub}</option>
                  ))}
                </select>

                <div style={{display:'flex', alignItems:'center'}}>
                   <input
                    type="number" className="form-control" style={{padding:8, width:60}}
                    value={r.rasio_penggunaan}
                    onChange={e => updateDistribusi(i, idx, 'rasio_penggunaan', Number(e.target.value))}
                    onBlur={() => addDistribusiIfNeeded(i)}
                   />
                   <span style={{marginLeft:5}}>%</span>
                </div>
              </div>
            ))}

            <label style={{display:'flex', alignItems:'center', marginTop:10, fontSize:'0.9rem'}}>
              <input 
                type="checkbox" style={{marginRight:8}}
                checked={d.allow_partial} 
                onChange={e => updateDetail(i, 'allow_partial', e.target.checked)} 
              />
              Simpan sementara (Rasio {'<'} 100%)
            </label>
          </div>
        ))}

        <div style={{marginTop:20}}>
            <button onClick={addDetail} className="btn" style={{padding:'8px 16px', border:'1px solid #ccc', borderRadius:4, cursor:'pointer'}}>+ Tambah Item</button>
        </div>

        <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:24, paddingTop:16, borderTop:'1px solid #eee'}}>
          <button onClick={onClose} style={{padding:'10px 20px', border:'1px solid #ccc', background:'white', borderRadius:4, cursor:'pointer'}}>Batal</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{padding:'10px 20px', background:'#007bff', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>
            {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          </button>
        </div>
      </div>
    </div>
  );
}