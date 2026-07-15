'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import TambahSubPekerjaanModal from './TambahSubPekerjaan';
import EditSubPekerjaanModal from './EditSubPekerjaan';
import React from 'react';

type SubPekerjaan = {
  id_sub: number;
  nama_sub: string;
  tgl_mulai: string | null;
};

export default function SubPekerjaanPage() {
  const { id } = useParams();
  const idPekerjaan = id as string;

  const [subs, setSubs] = useState<SubPekerjaan[]>([]);
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [showTambah, setShowTambah] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api
      .get(`/pekerjaan/${idPekerjaan}`)
      .then(res => setNamaPekerjaan(res.data.nama_pekerjaan));

    api
      .get(`/pekerjaan/${idPekerjaan}/sub-pekerjaan`)
      .then(res => setSubs(res.data));
  }, [idPekerjaan]);

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus sub pekerjaan ini?')) return;
    await api.delete(`/sub-pekerjaan/${id}`);
    setSubs(prev => prev.filter(s => s.id_sub !== id));
    setOpenMenuId(null);
  };

  const getMenuPosition = (rect: DOMRect) => {
    const WIDTH = 160;
    const GAP = 8;
    let x = rect.right + GAP;
    if (x + WIDTH > window.innerWidth) {
      x = rect.left - WIDTH - GAP;
    }
    return { x, y: rect.top };
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener('mousedown', close);
    }
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuId]);

  return (
    <main className="main-content">
      <div className="flex-between mb-4">
        <div>
          <h1>Sub Pekerjaan</h1>
          <p style={{ color: '#6b7280' }}>{namaPekerjaan}</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowTambah(true)}
        >
          + Tambah Sub Pekerjaan
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nama Sub Pekerjaan</th>
              <th>Tanggal Mulai</th>
              <th style={{ textAlign: 'center', width: 80 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id_sub}>
                <td>{s.nama_sub}</td>
                <td>{s.tgl_mulai ?? '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-icon"
                    onClick={e => {
                      setMenuPos(
                        getMenuPosition(
                          e.currentTarget.getBoundingClientRect()
                        )
                      );
                      setOpenMenuId(s.id_sub);
                    }}
                  >
                    ⋮
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP MENU */}
      {openMenuId !== null && menuPos && (
        <div ref={menuRef} style={menuBoxStyle(menuPos)}>
          <button
            style={menuItem}
            onClick={() => {
              setEditId(openMenuId);
              setOpenMenuId(null);
            }}
          >
            ✏️ Edit
          </button>

          <button
            style={dangerItem}
            onClick={() => handleDelete(openMenuId)}
          >
            🗑️ Hapus
          </button>
        </div>
      )}

      {showTambah && (
        <TambahSubPekerjaanModal
          idPekerjaan={Number(idPekerjaan)}
          onClose={() => setShowTambah(false)}
          onSuccess={() => {
            setShowTambah(false);
            api
              .get(`/pekerjaan/${idPekerjaan}/sub-pekerjaan`)
              .then(res => setSubs(res.data));
          }}
        />
      )}

      {editId !== null && (
        <EditSubPekerjaanModal
          idSub={editId}
          onClose={() => setEditId(null)}
          onSuccess={() => {
            setEditId(null);
            api
              .get(`/pekerjaan/${idPekerjaan}/sub-pekerjaan`)
              .then(res => setSubs(res.data));
          }}
        />
      )}
    </main>
  );
}

/* ================= STYLE (TYPE SAFE) ================= */

const menuBoxStyle = (
  pos: { x: number; y: number }
): React.CSSProperties => ({
  position: 'fixed',
  top: pos.y,
  left: pos.x,
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 10px 25px rgba(0,0,0,.12)',
  padding: 6,
  width: 160,
  zIndex: 9999,
});

const menuItem: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  textAlign: 'left',
  cursor: 'pointer',
};

const dangerItem: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  textAlign: 'left',
  color: '#dc2626',
  cursor: 'pointer',
};
