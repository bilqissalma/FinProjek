<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use App\Models\Proyek;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProyekController extends Controller
{
    /**
     * Mengambil pengguna berdasarkan bearer token.
     */
    private function authUser(Request $request)
    {
        return DB::table('user')
            ->where('api_token', $request->bearerToken())
            ->first();
    }

    /**
     * Mengecek apakah masa trial pengguna sudah habis.
     */
    private function isTrialExpired($user): bool
    {
        if ((int) $user->is_premium === 1) {
            return false;
        }

        if (!$user->vip_expired_at) {
            return true;
        }

        return now()->greaterThan($user->vip_expired_at);
    }

    /**
     * Menghapus data pada tabel yang mempunyai hubungan dengan:
     * - id_proyek
     * - id_pekerjaan
     * - id_sub
     *
     * Pemeriksaan Schema dilakukan agar tidak error jika suatu tabel
     * tidak mempunyai salah satu kolom tersebut.
     */
    private function deleteRelatedRows(
        string $table,
        int $projectId,
        array $pekerjaanIds,
        array $subPekerjaanIds
    ): void {
        if (!Schema::hasTable($table)) {
            return;
        }

        $hasIdProyek = Schema::hasColumn($table, 'id_proyek');
        $hasIdPekerjaan = Schema::hasColumn($table, 'id_pekerjaan');
        $hasIdSub = Schema::hasColumn($table, 'id_sub');

        $canDeleteByProject = $hasIdProyek;
        $canDeleteByPekerjaan =
            $hasIdPekerjaan && count($pekerjaanIds) > 0;
        $canDeleteBySub =
            $hasIdSub && count($subPekerjaanIds) > 0;

        if (
            !$canDeleteByProject &&
            !$canDeleteByPekerjaan &&
            !$canDeleteBySub
        ) {
            return;
        }

        DB::table($table)
            ->where(function ($query) use (
                $projectId,
                $pekerjaanIds,
                $subPekerjaanIds,
                $canDeleteByProject,
                $canDeleteByPekerjaan,
                $canDeleteBySub
            ) {
                $conditionAdded = false;

                if ($canDeleteByProject) {
                    $query->where('id_proyek', $projectId);
                    $conditionAdded = true;
                }

                if ($canDeleteByPekerjaan) {
                    if ($conditionAdded) {
                        $query->orWhereIn(
                            'id_pekerjaan',
                            $pekerjaanIds
                        );
                    } else {
                        $query->whereIn(
                            'id_pekerjaan',
                            $pekerjaanIds
                        );
                    }

                    $conditionAdded = true;
                }

                if ($canDeleteBySub) {
                    if ($conditionAdded) {
                        $query->orWhereIn(
                            'id_sub',
                            $subPekerjaanIds
                        );
                    } else {
                        $query->whereIn(
                            'id_sub',
                            $subPekerjaanIds
                        );
                    }
                }
            })
            ->delete();
    }

    /**
     * Menampilkan seluruh proyek milik kontraktor.
     */
    public function index(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $proyek = Proyek::where(
            'id_kontraktor',
            $user->id_user
        )->get();

        $proyek->each(function ($item) {
            $item->dokumen_mou_url = $item->dokumen_mou
                ? asset('storage/' . $item->dokumen_mou)
                : null;
        });

        return response()->json($proyek);
    }

    /**
     * Menambahkan proyek.
     */
/**
 * Menambahkan proyek baru.
 */
public function store(Request $request)
{
    $user = $this->authUser($request);

    if (!$user) {
        return response()->json([
            'message' => 'Unauthorized'
        ], 401);
    }

    if ($this->isTrialExpired($user)) {
        return response()->json([
            'message' => 'Masa trial Anda sudah habis. Silakan upgrade.'
        ], 403);
    }

    $validated = $request->validate(
        [
            'nama_proyek' => [
                'required',
                'string',
                'max:100',
            ],

            'lokasi' => [
                'required',
                'string',
                'max:150',
            ],

            'biaya_kesepakatan' => [
                'required',
                'numeric',
                'min:0',
            ],

            'tgl_mulai' => [
                'required',
                'date',
            ],

            'tgl_selesai' => [
                'required',
                'date',
                'after_or_equal:tgl_mulai',
            ],

            'id_pemilik' => [
                'nullable',
                'integer',
            ],

            'dokumen_mou' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx',
                'max:2048',
            ],
        ],
        [
            'nama_proyek.required' =>
                'Nama proyek wajib diisi.',

            'lokasi.required' =>
                'Lokasi proyek wajib diisi.',

            'biaya_kesepakatan.required' =>
                'Biaya kesepakatan wajib diisi.',

            'biaya_kesepakatan.numeric' =>
                'Biaya kesepakatan harus berupa angka.',

            'tgl_mulai.required' =>
                'Tanggal mulai wajib diisi.',

            'tgl_selesai.required' =>
                'Tanggal selesai wajib diisi.',

            'tgl_selesai.after_or_equal' =>
                'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',

            'dokumen_mou.mimes' =>
                'Dokumen MOU harus berupa PDF, DOC, atau DOCX.',

            'dokumen_mou.max' =>
                'Ukuran dokumen MOU maksimal 2 MB.',
        ]
    );

    $pathDokumen = null;

    try {
        if ($request->hasFile('dokumen_mou')) {
            $pathDokumen = $request
                ->file('dokumen_mou')
                ->store('dokumen_mou', 'public');

            $validated['dokumen_mou'] = $pathDokumen;
        } else {
            $validated['dokumen_mou'] = null;
        }

        /*
        |--------------------------------------------------------------------------
        | DATA OTOMATIS
        |--------------------------------------------------------------------------
        */
        $validated['id_kontraktor'] = $user->id_user;

        // Proyek baru langsung berstatus berjalan
        $validated['status'] = 'berjalan';

        $validated['kode_proyek'] = strtoupper(
            substr(
                str_shuffle(
                    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
                ),
                0,
                6
            )
        );

        $proyek = Proyek::create($validated);

        $proyek->dokumen_mou_url = $proyek->dokumen_mou
            ? asset('storage/' . $proyek->dokumen_mou)
            : null;

        return response()->json([
            'message' => 'Proyek berhasil ditambahkan.',
            'data' => $proyek,
        ], 201);
    } catch (\Throwable $error) {
        /*
         * Hapus file jika upload berhasil,
         * tetapi penyimpanan database gagal.
         */
        if (
            $pathDokumen &&
            Storage::disk('public')->exists($pathDokumen)
        ) {
            Storage::disk('public')->delete($pathDokumen);
        }

        report($error);

        return response()->json([
            'message' => 'Proyek gagal ditambahkan.',
            'error' => config('app.debug')
                ? $error->getMessage()
                : null,
        ], 500);
    }
}

    /**
     * Menampilkan detail proyek.
     */
    public function show(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $proyek = Proyek::where('id_proyek', $id)
            ->where('id_kontraktor', $user->id_user)
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' => 'Proyek tidak ditemukan'
            ], 404);
        }

        $proyek->dokumen_mou_url =
            $proyek->dokumen_mou &&
            Storage::disk('public')->exists(
                $proyek->dokumen_mou
            )
                ? asset('storage/' . $proyek->dokumen_mou)
                : null;

        return response()->json($proyek);
    }

    /**
     * Memperbarui proyek.
     */
    public function update(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        if ($this->isTrialExpired($user)) {
            return response()->json([
                'message' =>
                    'Masa trial Anda sudah habis. Silakan upgrade.'
            ], 403);
        }

        $proyek = Proyek::where('id_proyek', $id)
            ->where('id_kontraktor', $user->id_user)
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' => 'Proyek tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'nama_proyek' => 'required|string|max:100',
            'lokasi' => 'required|string|max:150',
            'biaya_kesepakatan' => 'required|numeric',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date',
            'status' => 'required|string',
            'dokumen_mou' =>
                'nullable|file|mimes:pdf,doc,docx|max:2048',
        ]);

        if ($request->hasFile('dokumen_mou')) {
            $dokumenLama = $proyek->dokumen_mou;

            $validated['dokumen_mou'] = $request
                ->file('dokumen_mou')
                ->store('dokumen_mou', 'public');

            if ($dokumenLama) {
                Storage::disk('public')->delete($dokumenLama);
            }
        }

        $proyek->update($validated);

        return response()->json([
            'message' => 'Proyek berhasil diperbarui',
            'data' => $proyek->fresh(),
        ]);
    }

    /**
     * Menghapus proyek beserta seluruh data yang berhubungan.
     */
    public function destroy(Request $request, $id)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        if ($this->isTrialExpired($user)) {
            return response()->json([
                'message' => 'Masa trial Anda sudah habis. Silakan upgrade.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Pastikan proyek milik kontraktor yang sedang login
        |--------------------------------------------------------------------------
        */
        $proyek = Proyek::where('id_proyek', $id)
            ->where('id_kontraktor', $user->id_user)
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' => 'Proyek tidak ditemukan'
            ], 404);
        }

        $dokumenMou = $proyek->dokumen_mou;

        try {
            DB::transaction(function () use ($id, $proyek) {

                /*
                |--------------------------------------------------------------------------
                | 1. Ambil semua pekerjaan milik proyek
                |--------------------------------------------------------------------------
                */
                $idPekerjaan = DB::table('pekerjaan')
                    ->where('id_proyek', $id)
                    ->pluck('id_pekerjaan');

                /*
                |--------------------------------------------------------------------------
                | 2. Ambil semua sub-pekerjaan dari pekerjaan
                |--------------------------------------------------------------------------
                */
                $idSubPekerjaan = collect();

                if ($idPekerjaan->isNotEmpty()) {
                    $idSubPekerjaan = DB::table('sub_pekerjaan')
                        ->whereIn('id_pekerjaan', $idPekerjaan)
                        ->pluck('id_sub');
                }

                /*
                |--------------------------------------------------------------------------
                | 3. Ambil semua pengeluaran milik proyek
                |--------------------------------------------------------------------------
                */
                $idPengeluaran = DB::table('pengeluaran')
                    ->where('id_proyek', $id)
                    ->pluck('id_pengeluaran');

                /*
                |--------------------------------------------------------------------------
                | 4. Ambil semua detail pengeluaran
                |--------------------------------------------------------------------------
                */
                $idDetailPengeluaran = collect();

                if ($idPengeluaran->isNotEmpty()) {
                    $idDetailPengeluaran = DB::table('detail_pengeluaran')
                        ->whereIn('id_pengeluaran', $idPengeluaran)
                        ->pluck('id_detail');
                }

                /*
                |--------------------------------------------------------------------------
                | 5. Hapus distribusi material
                |--------------------------------------------------------------------------
                |
                | distribusi_material mempunyai relasi ke:
                | - detail_pengeluaran melalui id_detail
                | - sub_pekerjaan melalui id_sub
                */
                if (
                    $idDetailPengeluaran->isNotEmpty() ||
                    $idSubPekerjaan->isNotEmpty()
                ) {
                    DB::table('distribusi_material')
                        ->where(function ($query) use (
                            $idDetailPengeluaran,
                            $idSubPekerjaan
                        ) {
                            if ($idDetailPengeluaran->isNotEmpty()) {
                                $query->whereIn(
                                    'id_detail',
                                    $idDetailPengeluaran
                                );
                            }

                            if ($idSubPekerjaan->isNotEmpty()) {
                                if ($idDetailPengeluaran->isNotEmpty()) {
                                    $query->orWhereIn(
                                        'id_sub',
                                        $idSubPekerjaan
                                    );
                                } else {
                                    $query->whereIn(
                                        'id_sub',
                                        $idSubPekerjaan
                                    );
                                }
                            }
                        })
                        ->delete();
                }

                /*
                |--------------------------------------------------------------------------
                | 6. Hapus detail pengeluaran
                |--------------------------------------------------------------------------
                */
                if ($idPengeluaran->isNotEmpty()) {
                    DB::table('detail_pengeluaran')
                        ->whereIn('id_pengeluaran', $idPengeluaran)
                        ->delete();
                }

                /*
                |--------------------------------------------------------------------------
                | 7. Hapus pengeluaran
                |--------------------------------------------------------------------------
                */
                DB::table('pengeluaran')
                    ->where('id_proyek', $id)
                    ->delete();

                /*
                |--------------------------------------------------------------------------
                | 8. Hapus progress proyek
                |--------------------------------------------------------------------------
                */
                DB::table('progress_proyek')
                    ->where('id_proyek', $id)
                    ->delete();

                /*
                |--------------------------------------------------------------------------
                | 9. Hapus sub-pekerjaan
                |--------------------------------------------------------------------------
                */
                if ($idPekerjaan->isNotEmpty()) {
                    DB::table('sub_pekerjaan')
                        ->whereIn('id_pekerjaan', $idPekerjaan)
                        ->delete();
                }

                /*
                |--------------------------------------------------------------------------
                | 10. Hapus pekerjaan
                |--------------------------------------------------------------------------
                */
                DB::table('pekerjaan')
                    ->where('id_proyek', $id)
                    ->delete();

                /*
                |--------------------------------------------------------------------------
                | 11. Hapus proyek terakhir
                |--------------------------------------------------------------------------
                */
                $proyek->delete();
            });

            /*
            |--------------------------------------------------------------------------
            | Hapus file MOU setelah transaksi database berhasil
            |--------------------------------------------------------------------------
            */
            if (
                $dokumenMou &&
                Storage::disk('public')->exists($dokumenMou)
            ) {
                Storage::disk('public')->delete($dokumenMou);
            }

            return response()->json([
                'message' =>
                    'Proyek beserta pekerjaan, sub-pekerjaan, pengeluaran, dan progres berhasil dihapus.'
            ], 200);

        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Proyek gagal dihapus.',
                'error' => config('app.debug')
                    ? $error->getMessage()
                    : null
            ], 500);
        }
    }
}
