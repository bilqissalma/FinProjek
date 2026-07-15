'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import api from '@/lib/axios';
import TambahPekerjaanModal from './TambahPekerjaan';
import EditPekerjaanModal from './EditPekerjaan';

type Job = {
  id_pekerjaan: number;
  nama_pekerjaan: string;
  id_proyek: number;
  nama_proyek: string;
  progress: number | string;
  sub_pekerjaan: number | string;
};

type Project = {
  id_proyek: number;
  nama_proyek: string;
};

export default function PekerjaanPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState<number | 'all'>('all');

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<number | null>(null);

  const [menuPos, setMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [showTambahModal, setShowTambahModal] =
    useState(false);

  const [editId, setEditId] =
    useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     FETCH PEKERJAAN
  ========================== */
  const fetchPekerjaan = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get('/pekerjaan');

      const responseData =
        response.data?.data ?? response.data;

      const pekerjaanData = Array.isArray(responseData)
        ? responseData
        : [];

      setJobs(pekerjaanData);
    } catch (error: any) {
      console.error(
        'Gagal mengambil pekerjaan:',
        error.response?.data ?? error
      );

      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        alert(
          'Sesi login telah berakhir. Silakan login kembali.'
        );

        router.replace('/auth/login');
        return;
      }

      setJobs([]);

      alert(
        error.response?.data?.message ??
          'Data pekerjaan gagal dimuat.'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  /* =========================
     FETCH PROYEK
  ========================== */
  const fetchProyek = useCallback(async () => {
    try {
      const response = await api.get('/proyek');

      const responseData =
        response.data?.data ?? response.data;

      setProjects(
        Array.isArray(responseData)
          ? responseData
          : []
      );
    } catch (error: any) {
      console.error(
        'Gagal mengambil proyek:',
        error.response?.data ?? error
      );

      setProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchPekerjaan();
    fetchProyek();
  }, [fetchPekerjaan, fetchProyek]);

  /* =========================
     FILTER PEKERJAAN
  ========================== */
  const filteredJobs =
    selectedProject === 'all'
      ? jobs
      : jobs.filter(
          job =>
            String(job.id_proyek) ===
            String(selectedProject)
        );

  /* =========================
     POSISI MENU
  ========================== */
  const getMenuPosition = (rect: DOMRect) => {
    const MENU_WIDTH = 170;
    const MENU_HEIGHT = 190;
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

    return {
      x,
      y,
    };
  };

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    idPekerjaan: number
  ) => {
    if (openMenuId === idPekerjaan) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    setMenuPos(getMenuPosition(rect));
    setOpenMenuId(idPekerjaan);
  };

  /* =========================
     TUTUP MENU DARI LUAR
  ========================== */
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenMenuId(null);
        setMenuPos(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener(
        'mousedown',
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [openMenuId]);

  /* =========================
     TUTUP MENU SAAT SCROLL
  ========================== */
  useEffect(() => {
    const closeMenu = () => {
      setOpenMenuId(null);
      setMenuPos(null);
    };

    if (openMenuId !== null) {
      window.addEventListener(
        'scroll',
        closeMenu,
        true
      );

      window.addEventListener(
        'resize',
        closeMenu
      );
    }

    return () => {
      window.removeEventListener(
        'scroll',
        closeMenu,
        true
      );

      window.removeEventListener(
        'resize',
        closeMenu
      );
    };
  }, [openMenuId]);

  /* =========================
     DELETE PEKERJAAN
  ========================== */
  const handleDelete = async (id: number) => {
    const selectedJob = jobs.find(
      job =>
        Number(job.id_pekerjaan) === Number(id)
    );

    const namaPekerjaan =
      selectedJob?.nama_pekerjaan ??
      'pekerjaan ini';

    const jumlahSub = Number(
      selectedJob?.sub_pekerjaan ?? 0
    );

    const confirmed = window.confirm(
      `Yakin ingin menghapus "${namaPekerjaan}"?\n\n` +
        `Pekerjaan ini mempunyai ${jumlahSub} sub-pekerjaan.\n\n` +
        'Seluruh sub-pekerjaan, distribusi material, ' +
        'dan data pengeluaran terkait akan ikut dihapus permanen.\n\n' +
        'Data yang sudah dihapus tidak dapat dikembalikan.'
    );

    if (!confirmed) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }

    try {
      setDeletingId(id);

      const response = await api.delete(
        `/pekerjaan/${id}`
      );

      setJobs(previousJobs =>
        previousJobs.filter(
          job =>
            Number(job.id_pekerjaan) !==
            Number(id)
        )
      );

      setOpenMenuId(null);
      setMenuPos(null);

      alert(
        response.data?.message ??
          'Pekerjaan dan seluruh data terkait berhasil dihapus.'
      );
    } catch (error: any) {
      console.error(
        'Gagal menghapus pekerjaan:',
        error.response?.data ?? error
      );

      const status = error.response?.status;

      const message =
        error.response?.data?.message ??
        error.response?.data?.error;

      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        alert(
          'Sesi login telah berakhir. Silakan login kembali.'
        );

        router.replace('/auth/login');
        return;
      }

      if (status === 403) {
        alert(
          message ??
            'Anda tidak memiliki izin untuk menghapus pekerjaan.'
        );
        return;
      }

      if (status === 404) {
        setJobs(previousJobs =>
          previousJobs.filter(
            job =>
              Number(job.id_pekerjaan) !==
              Number(id)
          )
        );

        setOpenMenuId(null);
        setMenuPos(null);

        alert(
          'Pekerjaan tidak ditemukan atau sudah dihapus.'
        );

        return;
      }

      alert(
        message ??
          'Pekerjaan gagal dihapus.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================
     MODAL TAMBAH
  ========================== */
  const handleTambahSuccess = async () => {
    setShowTambahModal(false);
    await fetchPekerjaan();
  };

  /* =========================
     MODAL EDIT
  ========================== */
  const handleEditClose = async () => {
    setEditId(null);
    await fetchPekerjaan();
  };

  return (
    <main className="main-content">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Manajemen Pekerjaan</h1>

          <p>
            Kelola semua pekerjaan dalam proyek Anda
          </p>
        </div>
      </div>

      {/* FILTER */}
      <div className="filter-card">
        <select
          className="filter-input"
          value={selectedProject}
          onChange={event => {
            const value = event.target.value;

            setSelectedProject(
              value === 'all'
                ? 'all'
                : Number(value)
            );
          }}
        >
          <option value="all">
            Semua Proyek
          </option>

          {projects.map(project => (
            <option
              key={project.id_proyek}
              value={project.id_proyek}
            >
              {project.nama_proyek}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            setShowTambahModal(true)
          }
        >
          + Tambah Pekerjaan
        </button>
      </div>

      {/* TABLE */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Pekerjaan</th>
                <th>Proyek</th>
                <th>Progress</th>
                <th>Sub</th>
                <th className="center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="empty"
                  >
                    Memuat data pekerjaan...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="empty"
                  >
                    {selectedProject !== 'all'
                      ? 'Tidak ada pekerjaan di proyek ini.'
                      : 'Tidak ada data pekerjaan.'}
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => {
                  const progress = Math.min(
                    Math.max(
                      Number(job.progress ?? 0),
                      0
                    ),
                    100
                  );

                  return (
                    <tr key={job.id_pekerjaan}>
                      <td className="title">
                        {job.nama_pekerjaan}
                      </td>

                      <td>
                        {job.nama_proyek}
                      </td>

                      <td>
                        <div className="progress-wrapper">
                          <div className="progress-text">
                            {Math.round(progress)}%
                          </div>

                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-gray">
                          {Number(
                            job.sub_pekerjaan ?? 0
                          )}{' '}
                          item
                        </span>
                      </td>

                      <td className="center">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label={`Buka menu ${job.nama_pekerjaan}`}
                          onClick={event =>
                            handleOpenMenu(
                              event,
                              job.id_pekerjaan
                            )
                          }
                        >
                          ⋮
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {openMenuId !== null &&
        menuPos !== null && (
          <div
            ref={menuRef}
            className="dropdown-menu popup"
            style={{
              top: menuPos.y,
              left: menuPos.x,
              position: 'fixed',
              zIndex: 9999,
            }}
          >
            <button
              type="button"
              onClick={() => {
                const id = openMenuId;

                setOpenMenuId(null);
                setMenuPos(null);

                router.push(
                  `/kontraktor/pekerjaan/${id}/sub-pekerjaan`
                );
              }}
            >
              Sub Pekerjaan
            </button>

            <button
              type="button"
              onClick={() => {
                const id = openMenuId;

                setOpenMenuId(null);
                setMenuPos(null);

                router.push(
                  `/kontraktor/pekerjaan/${id}`
                );
              }}
            >
              Detail
            </button>

            <button
              type="button"
              onClick={() => {
                const id = openMenuId;

                setOpenMenuId(null);
                setMenuPos(null);
                setEditId(id);
              }}
            >
              Edit
            </button>

            <button
              type="button"
              className="danger"
              disabled={
                deletingId === openMenuId
              }
              onClick={() =>
                handleDelete(openMenuId)
              }
            >
              {deletingId === openMenuId
                ? 'Menghapus...'
                : 'Hapus'}
            </button>
          </div>
        )}

      {/* MODAL TAMBAH */}
      {showTambahModal && (
        <TambahPekerjaanModal
          onClose={() =>
            setShowTambahModal(false)
          }
          onSuccess={handleTambahSuccess}
        />
      )}

      {/* MODAL EDIT */}
      {editId !== null && (
        <EditPekerjaanModal
          id={editId}
          onClose={handleEditClose}
        />
      )}
    </main>
  );
}