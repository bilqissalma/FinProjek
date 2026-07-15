'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

type Proyek = {
  id_proyek: number;
  nama_proyek: string;
};

type Pekerjaan = {
  id_pekerjaan: number;
  id_proyek: number;
  nama_pekerjaan: string;
};

type SubPekerjaan = {
  id_sub: number;
  id_pekerjaan: number;
  nama_sub: string;
};

export default function EditPengeluaran() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data Master
  const [projects, setProjects] = useState<Proyek[]>([]);
  const [jobs, setJobs] = useState<Pekerjaan[]>([]);
  
  // State untuk menampung semua opsi sub-pekerjaan yang dibutuhkan
  const [subs, setSubs] = useState<SubPekerjaan[]>([]); 

  const [form, setForm] = useState({
    no_nota: '',
    tgl_transaksi: '',
    spesifikasi: 'Material',
    id_proyek: '',
  });

  const [details, setDetails] = useState<Detail[]>([]);

  /* =========================
     1. FETCH DATA UTAMA (LOADER)
  ========================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // A. Ambil Data Master & Data Pengeluaran Berbarengan
        const [resProyek, resPekerjaan, resPengeluaran] = await Promise.all([
          api.get('/proyek'),
          api.get('/pekerjaan'),
          api.get(`/pengeluaran/${id}`)
        ]);

        // B. Set Data Master Proyek & Pekerjaan
        const projectsData = Array.isArray(resProyek.data.data) ? resProyek.data.data : resProyek.data;
        const jobsData = Array.isArray(resPekerjaan.data.data) ? resPekerjaan.data.data : resPekerjaan.data;
        
        setProjects(projectsData);
        setJobs(jobsData);

        // C. Proses Data Pengeluaran
        const raw = resPengeluaran.data.data || resPengeluaran.data; 
        const p = raw.pengeluaran || raw; // Handle struktur data yg mungkin beda
        
        setForm({
          no_nota: p.no_nota ?? '',
          tgl_transaksi: p.tgl_transaksi ?? '',
          spesifikasi: p.spesifikasi ?? 'Material',
          id_proyek: String(p.id_proyek ?? ''),
        });

        const detailsData = raw.details || [];
        
        // D. KUMPULKAN ID PEKERJAAN YANG DIPAKAI
        const jobIdsToFetch = new Set<number>();

        const formattedDetails = detailsData.map((d: any): Detail => {
          const rawDistribusi = d.distribusi || [];
          let formattedDist: Distribusi[];

          if (rawDistribusi.length > 0) {
             formattedDist = rawDistribusi.map((r: any) => {
                const jobId = r.id_pekerjaan ? Number(r.id_pekerjaan) : '';
                const subId = r.id_sub ? Number(r.id_sub) : '';
                
                if (jobId) jobIdsToFetch.add(jobId);

                return {
                  id_pekerjaan: jobId,
                  id_sub: subId,
                  rasio_penggunaan: Number(r.rasio_penggunaan || 0)
                };
             });
          } else {
             formattedDist = [{ id_pekerjaan: '', id_sub: '', rasio_penggunaan: 100 }];
          }

          return {
            nama_item: d.nama_item ?? '',
            satuan: d.satuan ?? '',
            banyak: Number(d.banyak ?? 0),
            harga_satuan: Number(d.harga_satuan ?? 0),
            allow_partial: false,
            distribusi: formattedDist
          };
        });

        // E. FETCH SUB PEKERJAAN SEKALIGUS (Pre-fetching)
        if (jobIdsToFetch.size > 0) {
          const promises = Array.from(jobIdsToFetch).map(jobId => 
             api.get(`/pekerjaan/${jobId}/sub-pekerjaan`)
                .then(res => Array.isArray(res.data.data) ? res.data.data : res.data)
                .catch(() => []) 
          );

          const results = await Promise.all(promises);
          const allSubs = results.flat();
          const uniqueSubs = Array.from(new Map(allSubs.map((item: any) => [item.id_sub, item])).values());
          setSubs(uniqueSubs as SubPekerjaan[]);
        }

        setDetails(formattedDetails);

      } catch (err) {
        console.error("Gagal load data:", err);
        alert("Gagal memuat data edit.");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadData();
  }, [id]);


  // Filter Helper
  const filteredJobs = jobs.filter(j => Number(j.id_proyek) === Number(form.id_proyek));
  const filteredSubs = (jobId: number | '') => {
      if (!jobId) return [];
      return subs.filter(s => Number(s.id_pekerjaan) === Number(jobId));
  };


  /* =========================
     HANDLERS (Update & Add)
  ========================== */
  const updateDetail = <K extends keyof Detail>(i: number, key: K, value: Detail[K]) => {
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
        // ✅ FIX: Tambahkan 'as Distribusi' agar TypeScript tidak error saat build
        distribusi: [{ id_pekerjaan: '', id_sub: '', rasio_penggunaan: 100 } as Distribusi] 
      }
    ]);
  };

  const removeDetail = (i: number) => {
    if (confirm("Hapus baris ini?")) {
      setDetails(prev => prev.filter((_, idx) => idx !== i));
    }
  };

  const updateDistribusi = (i: number, d: number, key: keyof Distribusi, value: any) => {
    setDetails(prev => {
        const copy = [...prev];
        const newDist = [...copy[i].distribusi];
        
        newDist[d] = { ...newDist[d], [key]: value };

        if (key === 'id_pekerjaan') {
            newDist[d].id_sub = ''; 
            if (value) {
                api.get(`/pekerjaan/${value}/sub-pekerjaan`)
                   .then(res => {
                       const newSubs = Array.isArray(res.data.data) ? res.data.data : res.data;
                       setSubs(curr => {
                           const combined = [...curr, ...newSubs];
                           return Array.from(new Map(combined.map(item => [item.id_sub, item])).values());
                       });
                   });
            }
        }

        copy[i] = { ...copy[i], distribusi: newDist };
        return copy;
    });
  };

  const addDistribusiIfNeeded = (i: number) => {
      const total = details[i].distribusi.reduce((s, d) => s + Number(d.rasio_penggunaan), 0);
      if (total < 100 && !details[i].allow_partial) {
          setDetails(prev => {
              const copy = [...prev];
              // ✅ FIX: Tambahkan 'as Distribusi' agar TypeScript tidak error saat build
              const newItem = { id_pekerjaan: '', id_sub: '', rasio_penggunaan: 100 - total } as Distribusi;
              const newDist = [...copy[i].distribusi, newItem];
              copy[i] = { ...copy[i], distribusi: newDist };
              return copy;
          });
      }
  };

  const handleSubmit = async () => {
      if(loading) return;

      // Validasi
      for (const d of details) {
          if (!d.nama_item) return alert("Nama item wajib diisi");
          const total = d.distribusi.reduce((s, r) => s + Number(r.rasio_penggunaan), 0);
          if (!d.allow_partial && Math.abs(total - 100) > 0.1) return alert(`Total rasio ${d.nama_item} harus 100%`);
          
          for (const dist of d.distribusi) {
             if (dist.id_pekerjaan && !dist.id_sub) return alert("Sub pekerjaan wajib dipilih");
          }
      }

      try {
          setLoading(true);
          await api.put(`/pengeluaran/${id}`, {
              ...form,
              id_proyek: Number(form.id_proyek),
              details: details
          });
          alert("Berhasil update pengeluaran");
          router.push('/kontraktor/pengeluaran');
      } catch (e: any) {
          alert(e.response?.data?.message || "Gagal update");
      } finally {
          setLoading(false);
      }
  };


  if (loading) return <p className="main-content">Loading data...</p>;

  return (
    <main className="main-content">
      <h1>Edit Pengeluaran</h1>
      
      {/* HEADER FORM */}
      <div className="card mb-4" style={{marginBottom: 20}}>
        <div className="grid grid-2 gap-4" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
           <div>
               <label className="block font-bold mb-1">No Nota</label>
               <input className="form-control w-full p-2 border rounded" value={form.no_nota} onChange={e => setForm({...form, no_nota: e.target.value})} />
           </div>
           <div>
               <label className="block font-bold mb-1">Tanggal</label>
               <input type="date" className="form-control w-full p-2 border rounded" value={form.tgl_transaksi} onChange={e => setForm({...form, tgl_transaksi: e.target.value})} />
           </div>
           <div>
               <label className="block font-bold mb-1">Spesifikasi</label>
               <select className="form-control w-full p-2 border rounded" value={form.spesifikasi} onChange={e => setForm({...form, spesifikasi: e.target.value})}>
                   <option>Material</option>
                   <option>Tenaga</option>
               </select>
           </div>
           <div>
               <label className="block font-bold mb-1">Proyek</label>
               <select className="form-control w-full p-2 border rounded" value={form.id_proyek} onChange={e => setForm({...form, id_proyek: e.target.value})}>
                   <option value="">Pilih Proyek</option>
                   {projects.map(p => <option key={p.id_proyek} value={p.id_proyek}>{p.nama_proyek}</option>)}
               </select>
           </div>
        </div>
      </div>

      {/* ITEMS */}
      {details.map((d, i) => (
         <div key={i} className="card mb-4" style={{marginBottom: 20, padding: 20, border: '1px solid #eee'}}>
             <div className="flex justify-between mb-2" style={{display:'flex', justifyContent:'space-between'}}>
                 <h4>Item #{i+1}</h4>
                 {details.length > 1 && <button onClick={() => removeDetail(i)} className="text-red-500" style={{color:'red'}}>Hapus</button>}
             </div>

             <div className="grid grid-4 gap-2 mb-4" style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10}}>
                 <input placeholder="Nama Item" className="form-control p-2 border rounded" value={d.nama_item} onChange={e => updateDetail(i, 'nama_item', e.target.value)} />
                 <select className="form-control p-2 border rounded" value={d.satuan} onChange={e => updateDetail(i, 'satuan', e.target.value)}>
                     <option value="">Satuan</option>
                     {SATUAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <input type="number" placeholder="Qty" className="form-control p-2 border rounded" value={d.banyak} onChange={e => updateDetail(i, 'banyak', Number(e.target.value))} />
                 <input type="number" placeholder="Harga" className="form-control p-2 border rounded" value={d.harga_satuan} onChange={e => updateDetail(i, 'harga_satuan', Number(e.target.value))} />
             </div>

             <h5 className="text-gray-500 mb-2">Alokasi:</h5>
             {d.distribusi.map((dist, j) => (
                 <div key={j} className="grid grid-3 gap-2 mb-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr 100px', gap:10}}>
                     <select className="form-control p-2 border rounded" value={dist.id_pekerjaan} onChange={e => updateDistribusi(i, j, 'id_pekerjaan', Number(e.target.value))}>
                         <option value="">Pilih Pekerjaan</option>
                         {filteredJobs.map(job => <option key={job.id_pekerjaan} value={job.id_pekerjaan}>{job.nama_pekerjaan}</option>)}
                     </select>

                     <select 
                        className="form-control p-2 border rounded" 
                        value={dist.id_sub} 
                        onChange={e => updateDistribusi(i, j, 'id_sub', Number(e.target.value))} 
                        disabled={!dist.id_pekerjaan}
                    >
                         <option value="">Sub Pekerjaan</option>
                         {filteredSubs(Number(dist.id_pekerjaan)).map(sub => <option key={sub.id_sub} value={sub.id_sub}>{sub.nama_sub}</option>)}
                     </select>

                     <div style={{position:'relative'}}>
                        <input type="number" className="form-control p-2 border rounded w-full" value={dist.rasio_penggunaan} onChange={e => updateDistribusi(i, j, 'rasio_penggunaan', Number(e.target.value))} onBlur={() => addDistribusiIfNeeded(i)} />
                        <span style={{position:'absolute', right:5, top:8, color:'#888'}}>%</span>
                     </div>
                 </div>
             ))}
         </div>
      ))}

      <button onClick={addDetail} className="w-full p-2 border-dashed border-2 text-gray-500 mb-4" style={{width:'100%', padding:10, border:'2px dashed #ccc', marginBottom:20}}>+ Tambah Item</button>

      <div className="flex justify-end gap-2" style={{display:'flex', justifyContent:'flex-end', gap:10}}>
          <button onClick={() => router.back()} className="btn-secondary p-2 rounded" style={{background:'#eee', padding:'10px 20px'}}>Batal</button>
          <button onClick={handleSubmit} className="btn-primary p-2 rounded text-white" style={{background:'#2563eb', color:'white', padding:'10px 20px'}}>Simpan Perubahan</button>
      </div>
    </main>
  );
}