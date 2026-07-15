<?php

namespace App\Http\Controllers\Api\Kontraktor;

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
        | AUTHENTICATED USER
        |--------------------------------------------------------------------------
        |
        | Menggunakan guard api karena route dashboard memakai auth:api.
        |
        */
        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            /*
            |--------------------------------------------------------------------------
            | TOTAL PROYEK
            |--------------------------------------------------------------------------
            */
            $totalProyek = DB::table('proyek')
                ->where('id_kontraktor', $user->id_user)
                ->count();

            /*
            |--------------------------------------------------------------------------
            | STATUS PROYEK
            |--------------------------------------------------------------------------
            |
            | Status "aktif" dan "berjalan" dimasukkan ke proyek berjalan.
            | LOWER dan TRIM digunakan agar aman terhadap kapital dan spasi.
            |
            */
            $proyekBerjalan = DB::table('proyek')
                ->where('id_kontraktor', $user->id_user)
                ->where(function ($query) {
                    $query
                        ->whereRaw(
                            'LOWER(TRIM(status)) = ?',
                            ['berjalan']
                        )
                        ->orWhereRaw(
                            'LOWER(TRIM(status)) = ?',
                            ['aktif']
                        );
                })
                ->count();

            $proyekSelesai = DB::table('proyek')
                ->where('id_kontraktor', $user->id_user)
                ->whereRaw(
                    'LOWER(TRIM(status)) = ?',
                    ['selesai']
                )
                ->count();

            /*
            |--------------------------------------------------------------------------
            | TOTAL PEKERJAAN
            |--------------------------------------------------------------------------
            */
            $totalPekerjaan = DB::table('pekerjaan')
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
                ->count('pekerjaan.id_pekerjaan');

            /*
            |--------------------------------------------------------------------------
            | PEKERJAAN PER PROYEK
            |--------------------------------------------------------------------------
            |
            | LEFT JOIN memastikan proyek tanpa pekerjaan tetap muncul
            | dengan total pekerjaan 0.
            |
            */
            $pekerjaanPerProyek = DB::table('proyek')
                ->leftJoin(
                    'pekerjaan',
                    'proyek.id_proyek',
                    '=',
                    'pekerjaan.id_proyek'
                )
                ->where(
                    'proyek.id_kontraktor',
                    $user->id_user
                )
                ->select(
                    'proyek.id_proyek',
                    'proyek.nama_proyek',
                    DB::raw(
                        'COUNT(pekerjaan.id_pekerjaan) AS total_pekerjaan'
                    )
                )
                ->groupBy(
                    'proyek.id_proyek',
                    'proyek.nama_proyek'
                )
                ->orderBy(
                    'proyek.id_proyek',
                    'asc'
                )
                ->get()
                ->map(function ($item) {
                    return [
                        'id_proyek' => (int) $item->id_proyek,
                        'nama_proyek' => $item->nama_proyek,
                        'total_pekerjaan' => (int) $item->total_pekerjaan,
                    ];
                });

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */
            return response()->json([
                'nama' => $user->nama_lengkap ?? 'Kontraktor',

                'total_proyek' => (int) $totalProyek,

                'total_pekerjaan' => (int) $totalPekerjaan,

                'status_proyek' => [
                    'berjalan' => (int) $proyekBerjalan,
                    'selesai' => (int) $proyekSelesai,
                ],

                'pekerjaan_per_proyek' => $pekerjaanPerProyek,
            ], 200);
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Gagal mengambil data dashboard.',
                'error' => config('app.debug')
                    ? $error->getMessage()
                    : null,
            ], 500);
        }
    }
}