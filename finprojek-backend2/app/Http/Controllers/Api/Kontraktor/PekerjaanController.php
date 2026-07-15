<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Throwable;

class PekerjaanController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | AUTH USER
    |--------------------------------------------------------------------------
    */
    private function authUser()
    {
        return auth('api')->user();
    }

    /*
    |--------------------------------------------------------------------------
    | CEK PROYEK MILIK KONTRAKTOR
    |--------------------------------------------------------------------------
    */
    private function getProjectOwnedByUser($idProyek, $idUser)
    {
        return DB::table('proyek')
            ->where('id_proyek', $idProyek)
            ->where('id_kontraktor', $idUser)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $pekerjaan = DB::table('pekerjaan')
            ->join(
                'proyek',
                'pekerjaan.id_proyek',
                '=',
                'proyek.id_proyek'
            )
            ->where(
                'proyek.id_kontraktor',
                $user->id_user
            )
            ->select(
                'pekerjaan.id_pekerjaan',
                'pekerjaan.nama_pekerjaan',
                'pekerjaan.id_proyek',
                'proyek.nama_proyek',

                DB::raw('
                    (
                        SELECT COUNT(*)
                        FROM sub_pekerjaan
                        WHERE sub_pekerjaan.id_pekerjaan =
                              pekerjaan.id_pekerjaan
                    ) AS sub_pekerjaan
                '),

                DB::raw('
                    COALESCE(
                        (
                            SELECT AVG(progress_proyek.persentase)
                            FROM progress_proyek
                            WHERE progress_proyek.id_proyek =
                                  proyek.id_proyek
                        ),
                        0
                    ) AS progress
                ')
            )
            ->orderBy('pekerjaan.id_pekerjaan', 'desc')
            ->get();

        return response()->json($pekerjaan);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $validated = $request->validate(
            [
                'id_proyek' => [
                    'required',
                    'integer',
                ],

                'nama_pekerjaan' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'pekerjaan',
                        'nama_pekerjaan'
                    )->where(function ($query) use ($request) {
                        return $query->where(
                            'id_proyek',
                            $request->id_proyek
                        );
                    }),
                ],

                'keterangan' => [
                    'nullable',
                    'string',
                ],
            ],
            [
                'id_proyek.required' =>
                    'Proyek wajib dipilih.',

                'nama_pekerjaan.required' =>
                    'Nama pekerjaan wajib diisi.',

                'nama_pekerjaan.unique' =>
                    'Nama pekerjaan sudah ada pada proyek ini.',
            ]
        );

        /*
         * Pastikan proyek benar-benar milik
         * kontraktor yang sedang login.
         */
        $proyek = $this->getProjectOwnedByUser(
            $validated['id_proyek'],
            $user->id_user
        );

        if (!$proyek) {
            return response()->json([
                'message' =>
                    'Proyek tidak ditemukan atau bukan milik Anda.'
            ], 404);
        }

        $idPekerjaan = DB::table('pekerjaan')->insertGetId([
            'id_proyek' =>
                $validated['id_proyek'],

            'nama_pekerjaan' =>
                $validated['nama_pekerjaan'],

            'keterangan' =>
                $validated['keterangan'] ?? null,
        ]);

        return response()->json([
            'message' =>
                'Pekerjaan berhasil ditambahkan.',

            'data' => [
                'id_pekerjaan' => $idPekerjaan,
            ],
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $pekerjaan = DB::table('pekerjaan')
            ->join(
                'proyek',
                'pekerjaan.id_proyek',
                '=',
                'proyek.id_proyek'
            )
            ->where(
                'pekerjaan.id_pekerjaan',
                $id
            )
            ->where(
                'proyek.id_kontraktor',
                $user->id_user
            )
            ->select(
                'pekerjaan.id_pekerjaan',
                'pekerjaan.id_proyek',
                'pekerjaan.nama_pekerjaan',
                'pekerjaan.keterangan',
                'proyek.nama_proyek'
            )
            ->first();

        if (!$pekerjaan) {
            return response()->json([
                'message' =>
                    'Pekerjaan tidak ditemukan.'
            ], 404);
        }

        $subPekerjaan = DB::table('sub_pekerjaan')
            ->where('id_pekerjaan', $id)
            ->orderBy('id_sub')
            ->get();

        return response()->json([
            'pekerjaan' => $pekerjaan,
            'sub_pekerjaan' => $subPekerjaan,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX BERDASARKAN PROYEK
    |--------------------------------------------------------------------------
    */
    public function indexByProyek($idProyek)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $proyek = $this->getProjectOwnedByUser(
            $idProyek,
            $user->id_user
        );

        if (!$proyek) {
            return response()->json([
                'message' =>
                    'Proyek tidak ditemukan atau bukan milik Anda.'
            ], 404);
        }

        $pekerjaan = DB::table('pekerjaan')
            ->where('id_proyek', $idProyek)
            ->orderBy('id_pekerjaan')
            ->get();

        return response()->json($pekerjaan);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $pekerjaan = DB::table('pekerjaan')
            ->join(
                'proyek',
                'pekerjaan.id_proyek',
                '=',
                'proyek.id_proyek'
            )
            ->where(
                'pekerjaan.id_pekerjaan',
                $id
            )
            ->where(
                'proyek.id_kontraktor',
                $user->id_user
            )
            ->select(
                'pekerjaan.id_pekerjaan',
                'pekerjaan.id_proyek'
            )
            ->first();

        if (!$pekerjaan) {
            return response()->json([
                'message' =>
                    'Pekerjaan tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate(
            [
                'id_proyek' => [
                    'required',
                    'integer',
                ],

                'nama_pekerjaan' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'pekerjaan',
                        'nama_pekerjaan'
                    )
                        ->ignore(
                            $id,
                            'id_pekerjaan'
                        )
                        ->where(function ($query) use ($request) {
                            return $query->where(
                                'id_proyek',
                                $request->id_proyek
                            );
                        }),
                ],

                'keterangan' => [
                    'nullable',
                    'string',
                ],
            ],
            [
                'id_proyek.required' =>
                    'Proyek wajib dipilih.',

                'nama_pekerjaan.required' =>
                    'Nama pekerjaan wajib diisi.',

                'nama_pekerjaan.unique' =>
                    'Nama pekerjaan sudah ada pada proyek ini.',
            ]
        );

        /*
         * Pastikan pekerjaan tidak dipindahkan
         * ke proyek milik kontraktor lain.
         */
        $proyekTujuan = $this->getProjectOwnedByUser(
            $validated['id_proyek'],
            $user->id_user
        );

        if (!$proyekTujuan) {
            return response()->json([
                'message' =>
                    'Proyek tujuan tidak ditemukan atau bukan milik Anda.'
            ], 404);
        }

        DB::table('pekerjaan')
            ->where('id_pekerjaan', $id)
            ->update([
                'id_proyek' =>
                    $validated['id_proyek'],

                'nama_pekerjaan' =>
                    $validated['nama_pekerjaan'],

                'keterangan' =>
                    $validated['keterangan'] ?? null,
            ]);

        return response()->json([
            'message' =>
                'Pekerjaan berhasil diperbarui.'
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    |
    | Urutan penghapusan:
    |
    | 1. Ambil sub-pekerjaan.
    | 2. Ambil detail pengeluaran yang didistribusikan ke sub.
    | 3. Hapus distribusi_material.
    | 4. Hapus sub_pekerjaan.
    | 5. Hapus detail_pengeluaran yang tidak lagi digunakan.
    | 6. Hapus pengeluaran yang tidak lagi mempunyai detail.
    | 7. Hapus pekerjaan.
    |
    */
    public function destroy($id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $pekerjaan = DB::table('pekerjaan')
            ->join(
                'proyek',
                'pekerjaan.id_proyek',
                '=',
                'proyek.id_proyek'
            )
            ->where(
                'pekerjaan.id_pekerjaan',
                $id
            )
            ->where(
                'proyek.id_kontraktor',
                $user->id_user
            )
            ->select(
                'pekerjaan.id_pekerjaan',
                'pekerjaan.id_proyek',
                'pekerjaan.nama_pekerjaan'
            )
            ->first();

        if (!$pekerjaan) {
            return response()->json([
                'message' =>
                    'Pekerjaan tidak ditemukan.'
            ], 404);
        }

        $deletedSummary = [
            'sub_pekerjaan' => 0,
            'distribusi_material' => 0,
            'detail_pengeluaran' => 0,
            'pengeluaran' => 0,
            'pekerjaan' => 0,
        ];

        try {
            DB::transaction(function () use (
                $id,
                &$deletedSummary
            ) {
                /*
                |--------------------------------------------------------------------------
                | 1. Ambil seluruh ID sub-pekerjaan
                |--------------------------------------------------------------------------
                */
                $subIds = DB::table('sub_pekerjaan')
                    ->where('id_pekerjaan', $id)
                    ->pluck('id_sub');

                /*
                |--------------------------------------------------------------------------
                | 2. Ambil detail pengeluaran dan pengeluaran
                |    yang terhubung ke sub-pekerjaan
                |--------------------------------------------------------------------------
                */
                $detailIds = collect();
                $pengeluaranIds = collect();

                if ($subIds->isNotEmpty()) {
                    $detailRows = DB::table(
                        'distribusi_material'
                    )
                        ->join(
                            'detail_pengeluaran',
                            'distribusi_material.id_detail',
                            '=',
                            'detail_pengeluaran.id_detail'
                        )
                        ->whereIn(
                            'distribusi_material.id_sub',
                            $subIds
                        )
                        ->select(
                            'detail_pengeluaran.id_detail',
                            'detail_pengeluaran.id_pengeluaran'
                        )
                        ->distinct()
                        ->get();

                    $detailIds = $detailRows
                        ->pluck('id_detail')
                        ->unique()
                        ->values();

                    $pengeluaranIds = $detailRows
                        ->pluck('id_pengeluaran')
                        ->unique()
                        ->values();
                }

                /*
                |--------------------------------------------------------------------------
                | 3. Hapus distribusi material
                |--------------------------------------------------------------------------
                */
                if ($subIds->isNotEmpty()) {
                    $deletedSummary[
                        'distribusi_material'
                    ] = DB::table(
                        'distribusi_material'
                    )
                        ->whereIn('id_sub', $subIds)
                        ->delete();
                }

                /*
                |--------------------------------------------------------------------------
                | 4. Hapus sub-pekerjaan
                |--------------------------------------------------------------------------
                */
                $deletedSummary[
                    'sub_pekerjaan'
                ] = DB::table('sub_pekerjaan')
                    ->where('id_pekerjaan', $id)
                    ->delete();

                /*
                |--------------------------------------------------------------------------
                | 5. Cari detail pengeluaran yang sudah
                |    tidak mempunyai distribusi.
                |--------------------------------------------------------------------------
                |
                | Jika suatu detail masih digunakan oleh sub-pekerjaan
                | lain, detail tersebut tidak akan dihapus.
                |
                */
                if ($detailIds->isNotEmpty()) {
                    $orphanDetailIds = DB::table(
                        'detail_pengeluaran as detail'
                    )
                        ->whereIn(
                            'detail.id_detail',
                            $detailIds
                        )
                        ->whereNotExists(function ($query) {
                            $query
                                ->select(DB::raw(1))
                                ->from(
                                    'distribusi_material as distribusi'
                                )
                                ->whereColumn(
                                    'distribusi.id_detail',
                                    'detail.id_detail'
                                );
                        })
                        ->pluck('detail.id_detail');

                    if ($orphanDetailIds->isNotEmpty()) {
                        $deletedSummary[
                            'detail_pengeluaran'
                        ] = DB::table(
                            'detail_pengeluaran'
                        )
                            ->whereIn(
                                'id_detail',
                                $orphanDetailIds
                            )
                            ->delete();
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | 6. Hapus pengeluaran yang tidak lagi
                |    mempunyai detail pengeluaran.
                |--------------------------------------------------------------------------
                */
                if ($pengeluaranIds->isNotEmpty()) {
                    $orphanPengeluaranIds = DB::table(
                        'pengeluaran as pengeluaran'
                    )
                        ->whereIn(
                            'pengeluaran.id_pengeluaran',
                            $pengeluaranIds
                        )
                        ->whereNotExists(function ($query) {
                            $query
                                ->select(DB::raw(1))
                                ->from(
                                    'detail_pengeluaran as detail'
                                )
                                ->whereColumn(
                                    'detail.id_pengeluaran',
                                    'pengeluaran.id_pengeluaran'
                                );
                        })
                        ->pluck(
                            'pengeluaran.id_pengeluaran'
                        );

                    if (
                        $orphanPengeluaranIds->isNotEmpty()
                    ) {
                        $deletedSummary[
                            'pengeluaran'
                        ] = DB::table('pengeluaran')
                            ->whereIn(
                                'id_pengeluaran',
                                $orphanPengeluaranIds
                            )
                            ->delete();
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | 7. Hapus pekerjaan terakhir
                |--------------------------------------------------------------------------
                */
                $deletedSummary[
                    'pekerjaan'
                ] = DB::table('pekerjaan')
                    ->where('id_pekerjaan', $id)
                    ->delete();
            });

            return response()->json([
                'message' =>
                    'Pekerjaan, sub-pekerjaan, dan data terkait berhasil dihapus.',

                'deleted' => $deletedSummary,
            ], 200);
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'message' =>
                    'Pekerjaan gagal dihapus karena masih terdapat data terkait yang belum ditangani.',

                'error' => config('app.debug')
                    ? $error->getMessage()
                    : null,
            ], 500);
        }
    }
}