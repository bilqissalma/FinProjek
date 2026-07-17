'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
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
        {details?.map((d, i) => {
          const totalHarga =
            Number(d.banyak || 0) * Number(d.harga_satuan || 0);

          return (
            <div
              key={i}
              className="card"
              style={{
                marginTop: 16,
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: 16 }}>
                {form.spesifikasi} #{i + 1}
              </h4>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label style={fieldLabelStyle}>Nama Item</label>
                  <input
                    type="text"
                    placeholder="Contoh: Semen Portland"
                    className="form-control"
                    style={fieldInputStyle}
                    value={d.nama_item}
                    onChange={e =>
                      updateDetail(i, 'nama_item', e.target.value)
                    }
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Satuan</label>
                  <select
                    className="form-control"
                    style={fieldInputStyle}
                    value={d.satuan}
                    onChange={e =>
                      updateDetail(i, 'satuan', e.target.value)
                    }
                  >
                    <option value="">Pilih Satuan</option>
                    {SATUAN_OPTIONS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Jumlah</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="form-control"
                    style={fieldInputStyle}
                    value={d.banyak}
                    onChange={e =>
                      updateDetail(
                        i,
                        'banyak',
                        Number(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    className="form-control"
                    style={fieldInputStyle}
                    value={d.harga_satuan}
                    onChange={e =>
                      updateDetail(
                        i,
                        'harga_satuan',
                        Number(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>
                    Total Harga (Rp)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{
                      ...fieldInputStyle,
                      backgroundColor: '#f3f4f6',
                      fontWeight: 600,
                    }}
                    value={totalHarga.toLocaleString('id-ID')}
                    readOnly
                  />
                </div>
              </div>

              <h5 style={{ marginBottom: 10 }}>
                Distribusi Biaya
              </h5>

              {d.distribusi?.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: 12,
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: '#f9fafb',
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <label style={fieldLabelStyle}>
                      Pekerjaan
                    </label>
                    <select
                      className="form-control"
                      style={fieldInputStyle}
                      value={r.id_pekerjaan}
                      onChange={e =>
                        updateDistribusi(
                          i,
                          idx,
                          'id_pekerjaan',
                          e.target.value
                            ? Number(e.target.value)
                            : '',
                        )
                      }
                      disabled={!form.id_proyek}
                    >
                      <option value="">
                        Pilih Pekerjaan
                      </option>
                      {filteredJobs?.map(j => (
                        <option
                          key={j.id_pekerjaan}
                          value={j.id_pekerjaan}
                        >
                          {j.nama_pekerjaan}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={fieldLabelStyle}>
                      Sub Pekerjaan
                    </label>
                    <select
                      className="form-control"
                      style={fieldInputStyle}
                      value={r.id_sub}
                      onChange={e =>
                        updateDistribusi(
                          i,
                          idx,
                          'id_sub',
                          e.target.value
                            ? Number(e.target.value)
                            : '',
                        )
                      }
                      disabled={!r.id_pekerjaan}
                    >
                      <option value="">
                        Pilih Sub Pekerjaan
                      </option>
                      {getFilteredSubs(
                        Number(r.id_pekerjaan),
                      ).map(s => (
                        <option
                          key={s.id_sub}
                          value={s.id_sub}
                        >
                          {s.nama_sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={fieldLabelStyle}>
                      Rasio Penggunaan (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="form-control"
                      style={fieldInputStyle}
                      value={r.rasio_penggunaan}
                      onChange={e =>
                        updateDistribusi(
                          i,
                          idx,
                          'rasio_penggunaan',
                          Number(e.target.value),
                        )
                      }
                      onBlur={() =>
                        addDistribusiIfNeeded(i)
                      }
                    />
                  </div>
                </div>
              ))}

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: 10,
                  fontSize: '0.9rem',
                }}
              >
                <input
                  type="checkbox"
                  style={{ marginRight: 8 }}
                  checked={d.allow_partial}
                  onChange={e =>
                    updateDetail(
                      i,
                      'allow_partial',
                      e.target.checked,
                    )
                  }
                />
                Simpan sementara jika total rasio belum 100%
              </label>
            </div>
          );
        })}

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


const fieldLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
};

const fieldInputStyle: CSSProperties = {
  width: '100%',
  padding: 9,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  boxSizing: 'border-box',
};
