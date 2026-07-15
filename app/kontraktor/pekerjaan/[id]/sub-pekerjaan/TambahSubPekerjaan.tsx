'use client';

import api from '@/lib/axios';

export default function TambahSubPekerjaanModal({
  idPekerjaan,
  onClose,
  onSuccess,
}: {
  idPekerjaan: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const form = e.target;

    try {
      const res = await api.post('/sub-pekerjaan', {
        id_pekerjaan: idPekerjaan,
        nama_sub: form.nama_sub.value,
        tgl_mulai: form.tgl_mulai.value || null,
      });
      
      alert(res.data.message); // ✅ sekarang valid

      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan sub pekerjaan');
    }
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Tambah Sub Pekerjaan</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Sub Pekerjaan</label>
            <input name="nama_sub" required />
          </div>

          <div className="form-group">
            <label>Tanggal Mulai</label>
            <input name="tgl_mulai" type="date" />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
