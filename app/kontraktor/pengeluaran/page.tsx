'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import api from '@/lib/axios';
import TambahPengeluaranModal from './TambahPengeluaran';

type Pengeluaran = {
  id_pengeluaran: number;
  no_nota: string;
  tgl_transaksi: string | null;
  spesifikasi: 'Material' | 'Tenaga';
  id_proyek: number;
  nama_proyek: string;

  id_pekerjaan?: number | null;
  id_pekerjaan_list?: string | null;
  nama_pekerjaan?: string | null;

  total: number;
};

type Project = {
  id_proyek: number;
  nama_proyek: string;
};

type Job = {
  id_pekerjaan: number;
  id_proyek: number;
  nama_pekerjaan: string;
};

export default function PengeluaranPage() {
  const router = useRouter();

  const [data, setData] = useState<Pengeluaran[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<number | 'all'>('all');

  const [selectedJob, setSelectedJob] =
    useState<number | 'all'>('all');

  const [openMenuId, setOpenMenuId] =
    useState<number | null>(null);

  const [menuPos, setMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [showTambahModal, setShowTambahModal] =
    useState(false);

  /* =========================
     FETCH PENGELUARAN
  ========================== */
  const fetchPengeluaran = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get('/pengeluaran');

      const rawData =
        response.data?.data ?? response.data;

      const list = Array.isArray(rawData)
        ? rawData
        : [];

      const normalized: Pengeluaran[] = list.map(
        (item: any) => ({
          id_pengeluaran: Number(
            item.id_pengeluaran
          ),

          no_nota: item.no_nota ?? '-',

          tgl_transaksi:
            item.tgl_transaksi ?? null,

          spesifikasi:
            item.spesifikasi === 'Tenaga'
              ? 'Tenaga'
              : 'Material',

          id_proyek: Number(item.id_proyek),

          nama_proyek:
            item.nama_proyek ??
            'Proyek tidak diketahui',

          id_pekerjaan:
            item.id_pekerjaan !== null &&
            item.id_pekerjaan !== undefined
              ? Number(item.id_pekerjaan)
              : null,

          id_pekerjaan_list:
            item.id_pekerjaan_list !== null &&
            item.id_pekerjaan_list !== undefined
              ? String(item.id_pekerjaan_list)
              : null,

          nama_pekerjaan:
            item.nama_pekerjaan ?? null,

          total: Number(item.total ?? 0),
        })
      );

      console.log(
        'DATA PENGELUARAN:',
        normalized
      );

      setData(normalized);
    } catch (error: any) {
      console.error(
        'Gagal memuat pengeluaran:',
        error.response?.data ?? error
      );

      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     FETCH PROYEK
  ========================== */
  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/proyek');

      const rawData =
        response.data?.data ?? response.data;

      setProjects(
        Array.isArray(rawData)
          ? rawData.map((item: any) => ({
              id_proyek: Number(
                item.id_proyek
              ),

              nama_proyek:
                item.nama_proyek,
            }))
          : []
      );
    } catch (error: any) {
      console.error(
        'Gagal memuat proyek:',
        error.response?.data ?? error
      );

      setProjects([]);
    }
  }, []);

  /* =========================
     FETCH PEKERJAAN
  ========================== */
  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get('/pekerjaan');

      const rawData =
        response.data?.data ?? response.data;

      setJobs(
        Array.isArray(rawData)
          ? rawData.map((item: any) => ({
              id_pekerjaan: Number(
                item.id_pekerjaan
              ),

              id_proyek: Number(
                item.id_proyek
              ),

              nama_pekerjaan:
                item.nama_pekerjaan,
            }))
          : []
      );
    } catch (error: any) {
      console.error(
        'Gagal memuat pekerjaan:',
        error.response?.data ?? error
      );

      setJobs([]);
    }
  }, []);

  useEffect(() => {
    fetchPengeluaran();
    fetchProjects();
    fetchJobs();
  }, [
    fetchPengeluaran,
    fetchProjects,
    fetchJobs,
  ]);

  /* =========================
     PEKERJAAN BERDASARKAN PROYEK
  ========================== */
  const filteredJobs =
    selectedProject === 'all'
      ? []
      : jobs.filter(
          job =>
            String(job.id_proyek) ===
            String(selectedProject)
        );

  /* =========================
     FILTER PENGELUARAN
  ========================== */
  const filteredData = data.filter(item => {
    if (
      selectedProject !== 'all' &&
      String(item.id_proyek) !==
        String(selectedProject)
    ) {
      return false;
    }

    if (selectedJob !== 'all') {
      /*
       * Backend mengirim ID pekerjaan seperti:
       * "2754101,2754102"
       */
      const pekerjaanIds = String(
        item.id_pekerjaan_list ??
          item.id_pekerjaan ??
          ''
      )
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);

      if (
        !pekerjaanIds.includes(
          String(selectedJob)
        )
      ) {
        return false;
      }
    }

    return true;
  });

  /* =========================
     POSISI POPUP
  ========================== */
  const getMenuPosition = (rect: DOMRect) => {
    const WIDTH = 140;
    const HEIGHT = 150;
    const GAP = 8;

    let x = rect.right + GAP;
    let y = rect.top;

    if (x + WIDTH > window.innerWidth) {
      x = rect.left - WIDTH - GAP;
    }

    if (y + HEIGHT > window.innerHeight) {
      y =
        window.innerHeight -
        HEIGHT -
        GAP;
    }

    if (x < GAP) x = GAP;
    if (y < GAP) y = GAP;

    return { x, y };
  };

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: number
  ) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    setMenuPos(getMenuPosition(rect));
    setOpenMenuId(id);
  };

  /* =========================
     CLOSE POPUP
  ========================== */
  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
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
        closeMenu
      );
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        closeMenu
      );
    };
  }, [openMenuId]);

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
     DELETE PENGELUARAN
  ========================== */
  const handleDelete = async (id: number) => {
    const selectedExpense = data.find(
      item =>
        Number(item.id_pengeluaran) ===
        Number(id)
    );

    const confirmed = window.confirm(
      `Yakin ingin menghapus pengeluaran ${
        selectedExpense?.no_nota ?? ''
      }?\n\nData detail dan distribusi yang terkait juga dapat ikut terhapus.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await api.delete(
        `/pengeluaran/${id}`
      );

      setData(previous =>
        previous.filter(
          item =>
            Number(item.id_pengeluaran) !==
            Number(id)
        )
      );

      setOpenMenuId(null);
      setMenuPos(null);

      alert(
        response.data?.message ??
          'Pengeluaran berhasil dihapus.'
      );
    } catch (error: any) {
      console.error(
        'Gagal menghapus pengeluaran:',
        error.response?.data ?? error
      );

      alert(
        error.response?.data?.message ??
          'Gagal menghapus data.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================
     FORMAT TANGGAL
  ========================== */
  const formatTanggal = (
    tanggal: string | null
  ) => {
    if (!tanggal) return '-';

    const tanggalNormal =
      tanggal.substring(0, 10);

    const date = new Date(
      `${tanggalNormal}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return tanggalNormal;
    }

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main className="main-content">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Manajemen Pengeluaran</h1>

          <p>
            Catat dan kelola pengeluaran proyek
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

            setSelectedJob('all');
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

        <select
          className="filter-input"
          disabled={selectedProject === 'all'}
          value={selectedJob}
          onChange={event => {
            const value = event.target.value;

            setSelectedJob(
              value === 'all'
                ? 'all'
                : Number(value)
            );
          }}
        >
          <option value="all">
            {selectedProject === 'all'
              ? 'Pilih proyek dahulu'
              : 'Semua pekerjaan'}
          </option>

          {filteredJobs.map(job => (
            <option
              key={job.id_pekerjaan}
              value={job.id_pekerjaan}
            >
              {job.nama_pekerjaan}
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
          + Tambah
        </button>
      </div>

      {/* INFORMASI FILTER */}
      {(selectedProject !== 'all' ||
        selectedJob !== 'all') && (
        <div
          style={{
            marginBottom: 12,
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Menampilkan {filteredData.length} dari{' '}
          {data.length} pengeluaran
        </div>
      )}

      {/* TABLE */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="modern-table">
            <thead>
              <tr>
                <th>No Nota</th>
                <th>Tanggal</th>
                <th>Proyek</th>
                <th>Spesifikasi</th>
                <th className="right">
                  Total
                </th>
                <th className="center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="empty"
                  >
                    Memuat data pengeluaran...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="empty"
                  >
                    Tidak ada data pengeluaran
                    untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr
                    key={item.id_pengeluaran}
                  >
                    <td className="nota">
                      {item.no_nota}
                    </td>

                    <td>
                      {formatTanggal(
                        item.tgl_transaksi
                      )}
                    </td>

                    <td>
                      <div>
                        {item.nama_proyek}
                      </div>

                      {item.nama_pekerjaan && (
                        <small
                          style={{
                            color: '#666666',
                            fontSize: '0.85em',
                          }}
                        >
                          Job:{' '}
                          {item.nama_pekerjaan}
                        </small>
                      )}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          item.spesifikasi ===
                          'Material'
                            ? 'badge-blue'
                            : 'badge-green'
                        }`}
                      >
                        {item.spesifikasi}
                      </span>
                    </td>

                    <td className="right total">
                      Rp{' '}
                      {Number(
                        item.total ?? 0
                      ).toLocaleString('id-ID')}
                    </td>

                    <td className="center">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={event =>
                          handleOpenMenu(
                            event,
                            item.id_pengeluaran
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
      </div>

      {/* POPUP MENU */}
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
                  `/kontraktor/pengeluaran/detail/${id}`
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

                router.push(
                  `/kontraktor/pengeluaran/edit/${id}`
                );
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
        <TambahPengeluaranModal
          onClose={() =>
            setShowTambahModal(false)
          }
          onSuccess={async () => {
            setShowTambahModal(false);
            await fetchPengeluaran();
          }}
        />
      )}
    </main>
  );
}