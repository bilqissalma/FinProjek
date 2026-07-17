<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DropdownController extends Controller
{
    /**
     * Mendapatkan pengguna berdasarkan bearer token.
     */
    private function getAuthenticatedUser(Request $request)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return null;
        }

        return DB::table('user')
            ->where('api_token', $token)
            ->first();
    }

    /**
     * Dropdown proyek milik kontraktor yang sedang login.
     */
    public function proyek(Request $request)
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthorized',
                ], 401);
            }

            $data = DB::table('proyek')
                ->where('id_kontraktor', $user->id_user)
                ->select(
                    'id_proyek',
                    'nama_proyek'
                )
                ->orderBy('nama_proyek')
                ->get();

            return response()->json($data);
        } catch (\Throwable $error) {
            Log::error('Dropdown proyek gagal', [
                'message' => $error->getMessage(),
                'trace' => $error->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Gagal mengambil daftar proyek.',
            ], 500);
        }
    }

    /**
     * Dropdown pekerjaan berdasarkan proyek.
     */
    public function pekerjaan(Request $request, $idProyek)
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthorized',
                ], 401);
            }

            /*
             * Pastikan proyek tersebut memang milik kontraktor
             * yang sedang login.
             */
            $proyek = DB::table('proyek')
                ->where('id_proyek', $idProyek)
                ->where('id_kontraktor', $user->id_user)
                ->first();

            if (!$proyek) {
                return response()->json([]);
            }

            $data = DB::table('pekerjaan')
                ->where('id_proyek', $idProyek)
                ->select(
                    'id_pekerjaan',
                    'nama_pekerjaan'
                )
                ->orderBy('nama_pekerjaan')
                ->get();

            return response()->json($data);
        } catch (\Throwable $error) {
            Log::error('Dropdown pekerjaan gagal', [
                'id_proyek' => $idProyek,
                'message' => $error->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal mengambil daftar pekerjaan.',
            ], 500);
        }
    }

    /**
     * Dropdown subpekerjaan berdasarkan pekerjaan.
     */
    public function sub(Request $request, $idPekerjaan)
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthorized',
                ], 401);
            }

            /*
             * Pastikan pekerjaan berasal dari proyek
             * milik kontraktor yang sedang login.
             */
            $pekerjaan = DB::table('pekerjaan as pk')
                ->join(
                    'proyek as p',
                    'p.id_proyek',
                    '=',
                    'pk.id_proyek'
                )
                ->where('pk.id_pekerjaan', $idPekerjaan)
                ->where('p.id_kontraktor', $user->id_user)
                ->select('pk.id_pekerjaan')
                ->first();

            if (!$pekerjaan) {
                return response()->json([]);
            }

            $data = DB::table('sub_pekerjaan')
                ->where('id_pekerjaan', $idPekerjaan)
                ->select(
                    'id_sub',
                    'nama_sub'
                )
                ->orderBy('nama_sub')
                ->get();

            return response()->json($data);
        } catch (\Throwable $error) {
            Log::error('Dropdown subpekerjaan gagal', [
                'id_pekerjaan' => $idPekerjaan,
                'message' => $error->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal mengambil daftar subpekerjaan.',
            ], 500);
        }
    }
}
