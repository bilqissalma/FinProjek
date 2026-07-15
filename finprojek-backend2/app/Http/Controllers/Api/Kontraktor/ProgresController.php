<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ProgresController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST PROYEK DAN PROGRES TERAKHIR
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            $data = DB::table('proyek as p')
                ->where(
                    'p.id_kontraktor',
                    $user->id_user
                )
                ->select(
                    'p.id_proyek',
                    'p.nama_proyek',
                    'p.id_pemilik',
                    'p.status',

                    DB::raw('
                        COALESCE(
                            (
                                SELECT pr.persentase
                                FROM progress_proyek AS pr
                                WHERE pr.id_proyek = p.id_proyek
                                ORDER BY
                                    pr.tgl_update DESC,
                                    pr.id_progress DESC
                                LIMIT 1
                            ),
                            0
                        ) AS progres
                    ')
                )
                ->orderBy('p.id_proyek', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id_proyek' => (int) $item->id_proyek,

                        'nama_proyek' =>
                            $item->nama_proyek,

                        'id_pemilik' =>
                            $item->id_pemilik
                                ? (int) $item->id_pemilik
                                : null,

                        'status' =>
                            $item->status,

                        'progres' =>
                            (float) $item->progres,
                    ];
                });

            return response()->json($data);
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'message' =>
                    'Gagal mengambil data progres proyek.',

                'error' => config('app.debug')
                    ? $error->getMessage()
                    : null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL PROGRES PROYEK
    |--------------------------------------------------------------------------
    */
    public function show(
        Request $request,
        $id_proyek
    ) {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        /*
         * Pastikan proyek merupakan milik
         * kontraktor yang sedang login.
         */
        $proyek = DB::table('proyek')
            ->where('id_proyek', $id_proyek)
            ->where(
                'id_kontraktor',
                $user->id_user
            )
            ->select(
                'id_proyek',
                'nama_proyek',
                'status'
            )
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' =>
                    'Proyek tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        $progressList = DB::table(
            'progress_proyek'
        )
            ->where('id_proyek', $id_proyek)
            ->orderBy('tgl_update', 'asc')
            ->orderBy('id_progress', 'asc')
            ->get()
            ->map(function ($progress) {
                $progress->persentase =
                    (float) $progress->persentase;

                $progress->foto_progress_url =
                    $progress->foto_progress
                        ? asset(
                            'storage/' .
                            $progress->foto_progress
                        )
                        : null;

                return $progress;
            });

        $progressTerakhir =
            $progressList->last();

        $persentaseTerakhir =
            $progressTerakhir
                ? (float) $progressTerakhir->persentase
                : 0;

        return response()->json([
            'proyek' => [
                'id_proyek' =>
                    (int) $proyek->id_proyek,

                'nama_proyek' =>
                    $proyek->nama_proyek,

                'status' =>
                    $proyek->status,
            ],

            'persentase_terakhir' =>
                $persentaseTerakhir,

            'progress_list' =>
                $progressList,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TAMBAH PROGRES PROYEK
    |--------------------------------------------------------------------------
    */
    public function store(
        Request $request,
        $id_proyek
    ) {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $validated = $request->validate(
            [
                'judul_update' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'deskripsi' => [
                    'nullable',
                    'string',
                ],

                'tambah_persentase' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:100',
                ],

                'dokumen' => [
                    'nullable',
                    'file',
                    'mimes:jpg,jpeg,png,mp4,mov,avi',
                    'max:20480',
                ],
            ],
            [
                'tambah_persentase.required' =>
                    'Penambahan persentase wajib diisi.',

                'tambah_persentase.numeric' =>
                    'Persentase harus berupa angka.',

                'tambah_persentase.min' =>
                    'Persentase tidak boleh kurang dari 0.',

                'tambah_persentase.max' =>
                    'Penambahan persentase maksimal 100%.',

                'dokumen.mimes' =>
                    'Dokumen harus berupa JPG, JPEG, PNG, MP4, MOV, atau AVI.',

                'dokumen.max' =>
                    'Ukuran dokumen maksimal 20 MB.',
            ]
        );

        /*
         * Cek kepemilikan proyek sebelum
         * menyimpan file.
         */
        $proyek = DB::table('proyek')
            ->where('id_proyek', $id_proyek)
            ->where(
                'id_kontraktor',
                $user->id_user
            )
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' =>
                    'Proyek tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        $path = null;

        if ($request->hasFile('dokumen')) {
            $path = $request
                ->file('dokumen')
                ->store(
                    'progress-proyek',
                    'public'
                );
        }

        try {
            $hasil = DB::transaction(
                function () use (
                    $id_proyek,
                    $user,
                    $validated,
                    $path
                ) {
                    /*
                     * Kunci data proyek agar dua request
                     * tidak mengubah progres bersamaan.
                     */
                    $proyekTerkunci =
                        DB::table('proyek')
                            ->where(
                                'id_proyek',
                                $id_proyek
                            )
                            ->where(
                                'id_kontraktor',
                                $user->id_user
                            )
                            ->lockForUpdate()
                            ->first();

                    if (!$proyekTerkunci) {
                        throw new RuntimeException(
                            'PROYEK_TIDAK_DITEMUKAN'
                        );
                    }

                    /*
                     * Ambil progres terakhir berdasarkan
                     * tanggal dan ID terbaru.
                     */
                    $progressTerakhir =
                        DB::table('progress_proyek')
                            ->where(
                                'id_proyek',
                                $id_proyek
                            )
                            ->orderByDesc(
                                'tgl_update'
                            )
                            ->orderByDesc(
                                'id_progress'
                            )
                            ->first();

                    $persentaseLama =
                        $progressTerakhir
                            ? (float) $progressTerakhir
                                ->persentase
                            : 0;

                    $tambahan =
                        (float) $validated[
                            'tambah_persentase'
                        ];

                    $persentaseBaru = round(
                        $persentaseLama +
                            $tambahan,
                        2
                    );

                    if ($persentaseBaru > 100) {
                        throw new RuntimeException(
                            'PERSENTASE_MELEBIHI_100'
                        );
                    }

                    /*
                     * Tentukan status proyek berdasarkan
                     * progres terbaru.
                     */
                    if ($persentaseBaru >= 100) {
                        $statusProyek = 'selesai';
                    } elseif ($persentaseBaru > 0) {
                        $statusProyek = 'berjalan';
                    } else {
                        $statusProyek = 'aktif';
                    }

                    /*
                     * Simpan progres baru.
                     */
                    $idProgress =
                        DB::table(
                            'progress_proyek'
                        )->insertGetId([
                            'id_proyek' =>
                                $id_proyek,

                            'judul_update' =>
                                $validated[
                                    'judul_update'
                                ] ?? null,

                            'deskripsi' =>
                                $validated[
                                    'deskripsi'
                                ] ?? null,

                            'persentase' =>
                                $persentaseBaru,

                            'foto_progress' =>
                                $path,

                            'tgl_update' =>
                                now()->toDateString(),
                        ]);

                    /*
                     * Sinkronkan status proyek.
                     *
                     * 100%       = selesai
                     * 1%–99,99%  = berjalan
                     * 0%         = aktif
                     */
                    DB::table('proyek')
                        ->where(
                            'id_proyek',
                            $id_proyek
                        )
                        ->update([
                            'status' =>
                                $statusProyek,
                        ]);

                    return [
                        'id_progress' =>
                            $idProgress,

                        'persentase_lama' =>
                            $persentaseLama,

                        'tambahan_persentase' =>
                            $tambahan,

                        'persentase_sekarang' =>
                            $persentaseBaru,

                        'status_proyek' =>
                            $statusProyek,

                        'foto_progress' =>
                            $path,

                        'foto_progress_url' =>
                            $path
                                ? asset(
                                    'storage/' . $path
                                )
                                : null,
                    ];
                }
            );

            return response()->json([
                'message' =>
                    $hasil['status_proyek'] ===
                    'selesai'
                        ? 'Progres berhasil ditambahkan dan proyek telah selesai.'
                        : 'Progres berhasil ditambahkan.',

                'data' => $hasil,
            ], 201);
        } catch (RuntimeException $error) {
            /*
             * Hapus file apabila database gagal
             * menyimpan progres.
             */
            if (
                $path &&
                Storage::disk('public')->exists(
                    $path
                )
            ) {
                Storage::disk('public')->delete(
                    $path
                );
            }

            if (
                $error->getMessage() ===
                'PERSENTASE_MELEBIHI_100'
            ) {
                return response()->json([
                    'message' =>
                        'Total persentase tidak boleh melebihi 100%.',
                ], 422);
            }

            if (
                $error->getMessage() ===
                'PROYEK_TIDAK_DITEMUKAN'
            ) {
                return response()->json([
                    'message' =>
                        'Proyek tidak ditemukan atau bukan milik Anda.',
                ], 404);
            }

            report($error);

            return response()->json([
                'message' =>
                    'Progres proyek gagal disimpan.',
            ], 500);
        } catch (Throwable $error) {
            if (
                $path &&
                Storage::disk('public')->exists(
                    $path
                )
            ) {
                Storage::disk('public')->delete(
                    $path
                );
            }

            report($error);

            return response()->json([
                'message' =>
                    'Progres proyek gagal disimpan.',

                'error' => config('app.debug')
                    ? $error->getMessage()
                    : null,
            ], 500);
        }
    }
}