<?php

namespace App\Http\Controllers\Api\Pemilik;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | AUTH USER
        |--------------------------------------------------------------------------
        */
        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | PENGECEKAN ROLE TAMBAHAN
        |--------------------------------------------------------------------------
        |
        | Middleware role:pemilik seharusnya sudah memeriksa role.
        | Pemeriksaan ini ditambahkan sebagai perlindungan tambahan.
        |
        */
        if (
            strtolower(trim((string) $user->role)) !==
            'pemilik'
        ) {
            return response()->json([
                'message' =>
                    'Akun yang sedang digunakan bukan akun pemilik.',
                'role' => $user->role,
            ], 403);
        }

        try {
            /*
            |--------------------------------------------------------------------------
            | TOTAL PROYEK
            |--------------------------------------------------------------------------
            */
            $totalProyek = DB::table('proyek')
                ->where(
                    'id_pemilik',
                    $user->id_user
                )
                ->count();

            /*
            |--------------------------------------------------------------------------
            | PROYEK BERJALAN
            |--------------------------------------------------------------------------
            |
            | Status aktif dan berjalan dianggap sebagai proyek berjalan.
            |
            */
            $proyekBerjalan = DB::table('proyek')
                ->where(
                    'id_pemilik',
                    $user->id_user
                )
                ->where(function ($query) {
                    $query
                        ->whereRaw(
                            'LOWER(TRIM(status)) = ?',
                            ['aktif']
                        )
                        ->orWhereRaw(
                            'LOWER(TRIM(status)) = ?',
                            ['berjalan']
                        );
                })
                ->count();

            /*
            |--------------------------------------------------------------------------
            | PROYEK SELESAI
            |--------------------------------------------------------------------------
            */
            $proyekSelesai = DB::table('proyek')
                ->where(
                    'id_pemilik',
                    $user->id_user
                )
                ->whereRaw(
                    'LOWER(TRIM(status)) = ?',
                    ['selesai']
                )
                ->count();

            /*
            |--------------------------------------------------------------------------
            | DAFTAR PROYEK TERBARU
            |--------------------------------------------------------------------------
            */
            $proyekTerbaru = DB::table('proyek as p')
                ->where(
                    'p.id_pemilik',
                    $user->id_user
                )
                ->select(
                    'p.id_proyek',
                    'p.kode_proyek',
                    'p.nama_proyek',
                    'p.lokasi',
                    'p.status',
                    'p.tgl_mulai',
                    'p.tgl_selesai',

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
                ->orderByDesc('p.id_proyek')
                ->limit(5)
                ->get()
                ->map(function ($proyek) {
                    return [
                        'id_proyek' =>
                            (int) $proyek->id_proyek,

                        'kode_proyek' =>
                            $proyek->kode_proyek,

                        'nama_proyek' =>
                            $proyek->nama_proyek,

                        'lokasi' =>
                            $proyek->lokasi,

                        'status' =>
                            $proyek->status,

                        'tgl_mulai' =>
                            $proyek->tgl_mulai,

                        'tgl_selesai' =>
                            $proyek->tgl_selesai,

                        'progres' =>
                            (float) $proyek->progres,
                    ];
                });

            return response()->json([
                'nama' =>
                    $user->nama_lengkap ??
                    'Pemilik',

                'role' =>
                    $user->role,

                'total_proyek' =>
                    (int) $totalProyek,

                'proyek_berjalan' =>
                    (int) $proyekBerjalan,

                'proyek_selesai' =>
                    (int) $proyekSelesai,

                'proyek_terbaru' =>
                    $proyekTerbaru,
            ], 200);
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'message' =>
                    'Gagal mengambil data dashboard pemilik.',

                'error' => config('app.debug')
                    ? $error->getMessage()
                    : null,
            ], 500);
        }
    }
}
