<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MaterialController extends Controller
{
    /**
     * Menampilkan rekap penggunaan material dan tenaga
     * berdasarkan kontraktor yang sedang login.
     */
    public function index(Request $request)
    {
        try {
            /*
             * Route sudah menggunakan middleware auth:api,
             * sehingga user dapat diambil dari guard API.
             */
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthorized',
                ], 401);
            }

            if (
                strtolower((string) $user->role) !==
                'kontraktor'
            ) {
                return response()->json([
                    'message' =>
                        'Akses hanya tersedia untuk kontraktor.',
                ], 403);
            }

            $query = DB::table(
                'distribusi_material as dm'
            )
                ->join(
                    'detail_pengeluaran as dp',
                    'dp.id_detail',
                    '=',
                    'dm.id_detail'
                )
                ->join(
                    'pengeluaran as pg',
                    'pg.id_pengeluaran',
                    '=',
                    'dp.id_pengeluaran'
                )
                ->join(
                    'sub_pekerjaan as sp',
                    'sp.id_sub',
                    '=',
                    'dm.id_sub'
                )
                ->join(
                    'pekerjaan as pk',
                    'pk.id_pekerjaan',
                    '=',
                    'sp.id_pekerjaan'
                )
                ->join(
                    'proyek as pr',
                    'pr.id_proyek',
                    '=',
                    'pk.id_proyek'
                )

                /*
                 * Hanya mengambil proyek milik kontraktor
                 * yang sedang login.
                 */
                ->where(
                    'pr.id_kontraktor',
                    $user->id_user
                )

                /*
                 * Pengeluaran harus berasal dari proyek
                 * yang sama dengan pekerjaan.
                 */
                ->whereColumn(
                    'pg.id_proyek',
                    'pr.id_proyek'
                )

                ->select([
                    'dm.id_distribusi',
                    'dp.id_detail',
                    'pg.id_pengeluaran',

                    'pr.id_proyek',
                    'pk.id_pekerjaan',
                    'sp.id_sub',

                    'pg.tgl_transaksi',
                    'pg.spesifikasi',

                    'dp.nama_item',
                    'dp.satuan',
                    'dp.banyak',
                    'dp.harga_satuan',

                    'dm.rasio_penggunaan',

                    'pr.nama_proyek',
                    'pk.nama_pekerjaan',
                    'sp.nama_sub',
                ])

                /*
                 * Jumlah yang digunakan berdasarkan rasio.
                 */
                ->selectRaw(
                    '
                    ROUND(
                        COALESCE(dp.banyak, 0)
                        * (
                            COALESCE(
                                dm.rasio_penggunaan,
                                100
                            ) / 100
                        ),
                        2
                    ) AS jumlah_pakai
                    '
                )

                /*
                 * Biaya dihitung langsung dari:
                 * banyak × harga satuan × rasio.
                 *
                 * Tidak lagi bergantung pada kolom
                 * dp.jumlah_harga.
                 */
                ->selectRaw(
                    '
                    ROUND(
                        COALESCE(dp.banyak, 0)
                        * COALESCE(dp.harga_satuan, 0)
                        * (
                            COALESCE(
                                dm.rasio_penggunaan,
                                100
                            ) / 100
                        ),
                        2
                    ) AS biaya_pakai
                    '
                );

            /*
             * Filter proyek.
             */
            if ($request->filled('id_proyek')) {
                $query->where(
                    'pr.id_proyek',
                    $request->input('id_proyek')
                );
            }

            /*
             * Filter pekerjaan.
             */
            if ($request->filled('id_pekerjaan')) {
                $query->where(
                    'pk.id_pekerjaan',
                    $request->input('id_pekerjaan')
                );
            }

            /*
             * Filter subpekerjaan.
             */
            if ($request->filled('id_sub')) {
                $query->where(
                    'sp.id_sub',
                    $request->input('id_sub')
                );
            }

            /*
             * Filter tanggal mulai.
             */
            if ($request->filled('start')) {
                $query->whereDate(
                    'pg.tgl_transaksi',
                    '>=',
                    $request->input('start')
                );
            }

            /*
             * Filter tanggal selesai.
             */
            if ($request->filled('end')) {
                $query->whereDate(
                    'pg.tgl_transaksi',
                    '<=',
                    $request->input('end')
                );
            }

            $data = $query
                ->orderBy('pg.tgl_transaksi')
                ->orderBy('dm.id_distribusi')
                ->get();

            return response()->json($data);
        } catch (\Throwable $error) {
            Log::error(
                'Gagal mengambil data material',
                [
                    'message' =>
                        $error->getMessage(),

                    'file' =>
                        $error->getFile(),

                    'line' =>
                        $error->getLine(),

                    'user_id' =>
                        auth('api')->user()?->id_user,
                ]
            );

            return response()->json([
                'message' =>
                    'Data material gagal dimuat.',
            ], 500);
        }
    }
}
