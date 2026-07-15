'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import TambahProyekModal from './TambahProyek';
import EditProyekModal from './EditProyek';

interface Project {
  id_proyek: number;
  nama_proyek: string;
  kode_proyek: string;
  status: string;
  lokasi?: string;
  biaya_kesepakatan?: number;
  tgl_mulai?: string;
  tgl_selesai?: string;
  dokumen_mou?: string | null;
  dokumen_mou_url?: string | null;
}

export default function ProyekPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     FETCH PROYEK
  ========================== */
  const fetchProjects = useCallback(async () => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    try {
      setLoading(true);

      const response = await api.get('/proyek');

      const projectData = response.data?.data ?? response.data;

      setProjects(Array.isArray(projectData) ? projectData : []);
    } catch (error: any) {
      console.error(
        'Gagal mengambil proyek:',
        error.response?.data ?? error
      );

      const status = error.response?.status;

      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        alert('Sesi login telah berakhir. Silakan login kembali.');
        router.replace('/auth/login');
        return;
      }

      alert(
        error.response?.data?.message ??
          'Data proyek gagal dimuat.'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /* =========================
     COPY KODE PROYEK
  ========================== */
  const copyKode = async (kode: string) => {
    try {
      await navigator.clipboard.writeText(kode);

      alert(`Kode proyek "${kode}" berhasil disalin.`);
    } catch (error) {
      console.error('Gagal menyalin kode:', error);
      alert('Kode proyek gagal disalin.');
    }
  };

  /* =========================
     POSISI DROPDOWN
  ========================== */
  const getMenuPosition = (rect: DOMRect) => {
    const MENU_WIDTH = 150;
    const MENU_HEIGHT = 150;
    const GAP = 8;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let x = rect.right + GAP;
    let y = rect.top;

    if (x + MENU_WIDTH > screenWidth) {
      x = rect.left - MENU_WIDTH - GAP;
    }

    if (y + MENU_HEIGHT > screenHeight) {
      y = screenHeight - MENU_HEIGHT - GAP;
    }

    if (x < GAP) {
      x = GAP;
    }

    if (y < GAP) {
      y = GAP;
    }

    return { x, y };
  };

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    projectId: number
  ) => {
    if (openMenuId === projectId) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setMenuPos(getMenuPosition(rect));
    setOpenMenuId(projectId);
  };

  /* =========================
     DELETE PROYEK
  ========================== */
  const handleDelete = async (id: number) => {
    const selectedProject = projects.find(
      project => Number(project.id_proyek) === Number(id)
    );

    const projectName =
      selectedProject?.nama_proyek ?? 'proyek ini';

    const confirmed = window.confirm(
      `Yakin ingin menghapus "${projectName}"?\n\n` +
        'Seluruh pekerjaan, subpekerjaan, progres, material, ' +
        'pengeluaran, dan data lain yang berhubungan dengan proyek ini ' +
        'akan ikut dihapus secara permanen.\n\n' +
        'Data yang telah dihapus tidak dapat dikembalikan.'
    );

    if (!confirmed) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }

    try {
      setDeletingId(id);

      const response = await api.delete(`/proyek/${id}`);

      setProjects(previousProjects =>
        previousProjects.filter(
          project =>
            Number(project.id_proyek) !== Number(id)
        )
      );

      setOpenMenuId(null);
      setMenuPos(null);

      alert(
        response.data?.message ??
          'Proyek dan seluruh data terkait berhasil dihapus.'
      );
    } catch (error: any) {
      console.error(
        'Gagal menghapus proyek:',
        error.response?.data ?? error
      );

      const status = error.response?.status;
      const message =
        error.response?.data?.message ??
        error.response?.data?.error;

      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        alert('Sesi login telah berakhir. Silakan login kembali.');
        router.replace('/auth/login');
        return;
      }

      if (status === 403) {
        alert(
          message ??
            'Anda tidak memiliki izin untuk menghapus proyek ini.'
        );
        return;
      }

      if (status === 404) {
        alert('Proyek tidak ditemukan atau sudah dihapus.');

        setProjects(previousProjects =>
          previousProjects.filter(
            project =>
              Number(project.id_proyek) !== Number(id)
          )
        );

        setOpenMenuId(null);
        setMenuPos(null);
        return;
      }

      alert(message ?? 'Proyek gagal dihapus.');
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================
     CLOSE MENU OUTSIDE
  ========================== */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
        setMenuPos(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [openMenuId]);

  /* =========================
     CLOSE MENU SAAT SCROLL
  ========================== */
  useEffect(() => {
    const handleScroll = () => {
      setOpenMenuId(null);
      setMenuPos(null);
    };

    if (openMenuId !== null) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [openMenuId]);

  /* =========================
     CLOSE TAMBAH MODAL
  ========================== */
  const handleCloseTambahModal = () => {
    setShowModal(false);
    fetchProjects();
  };

  /* =========================
     CLOSE EDIT MODAL
  ========================== */
  const handleCloseEditModal = () => {
    setEditId(null);
    fetchProjects();
  };

  return (
    <main className="main-content">
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Manajemen Proyek</h1>

          <p style={{ color: '#777' }}>
            Daftar proyek yang sedang kamu kelola
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Tambah Proyek
        </button>
      </div>

      {/* TABLE */}
      <div className="card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: 'center',
                    padding: 32,
                  }}
                >
                  Memuat data proyek...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: 'center',
                    padding: 32,
                  }}
                >
                  Belum ada proyek
                </td>
              </tr>
            ) : (
              projects.map(project => (
                <tr key={project.id_proyek}>
                  <td>{project.nama_proyek}</td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <code>{project.kode_proyek}</code>

                      <button
                        type="button"
                        title="Salin kode proyek"
                        aria-label={`Salin kode proyek ${project.kode_proyek}`}
                        onClick={() =>
                          copyKode(project.kode_proyek)
                        }
                      >
                        📋
                      </button>
                    </div>
                  </td>

                  <td>{project.status}</td>

                  <td>
                    <button
                      type="button"
                      aria-label={`Buka menu proyek ${project.nama_proyek}`}
                      onClick={event =>
                        handleOpenMenu(
                          event,
                          project.id_proyek
                        )
                      }
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DROPDOWN MENU */}
      {openMenuId !== null && menuPos !== null && (
        <div
          ref={menuRef}
          className="dropdown-menu popup"
          style={{
            position: 'fixed',
            top: menuPos.y,
            left: menuPos.x,
            zIndex: 9999,
          }}
        >
          <button
            type="button"
            onClick={() => {
              const projectId = openMenuId;

              setOpenMenuId(null);
              setMenuPos(null);

              router.push(
                `/kontraktor/proyek/detail/${projectId}`
              );
            }}
          >
            Detail
          </button>

          <button
            type="button"
            onClick={() => {
              const projectId = openMenuId;

              setOpenMenuId(null);
              setMenuPos(null);
              setEditId(projectId);
            }}
          >
            Edit
          </button>

          <button
            type="button"
            className="danger"
            disabled={deletingId === openMenuId}
            onClick={() => handleDelete(openMenuId)}
          >
            {deletingId === openMenuId
              ? 'Menghapus...'
              : 'Hapus'}
          </button>
        </div>
      )}

      {/* MODAL TAMBAH */}
      {showModal && (
        <TambahProyekModal
          onClose={handleCloseTambahModal}
        />
      )}

      {/* MODAL EDIT */}
      {editId !== null && (
        <EditProyekModal
          id={editId}
          onClose={handleCloseEditModal}
        />
      )}
    </main>
  );
}