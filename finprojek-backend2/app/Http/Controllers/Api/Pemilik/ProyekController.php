<?php

namespace App\Http\Controllers\Api\Pemilik;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProyekController extends Controller
{
    /**
     * LIST PROYEK MILIK PEMILIK
     */
    public function index(Request $request)
    {
        $proyekList = DB::table('proyek')
            ->where('id_pemilik', $request->user()->id_user)
            ->select(
                'id_proyek',
                'kode_proyek',
                'nama_proyek',
                'lokasi',
                'biaya_kesepakatan',
                'status',
                'tgl_mulai',
                'tgl_selesai',
                'dokumen_mou'
            )
            ->orderBy('tgl_mulai', 'desc')
            ->get();

        return response()->json($proyekList);
    }

    /**
     * DETAIL PROYEK
     */
    public function show(Request $request, $id)
    {
        $proyek = DB::table('proyek')
            ->where('id_proyek', $id)
            ->where('id_pemilik', $request->user()->id_user)
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' => 'Proyek tidak ditemukan atau bukan milik Anda'
            ], 404);
        }

        return response()->json($proyek);
    }

    /**
     * PROGRESS PROYEK
     */
    public function progress(Request $request, $id)
    {
        // 1️⃣ Pastikan proyek milik pemilik yang sedang login
        $proyek = DB::table('proyek')
            ->where('id_proyek', $id)
            ->where('id_pemilik', $request->user()->id_user)
            ->select(
                'id_proyek',
                'nama_proyek',
                'lokasi',
                'biaya_kesepakatan',
                'dokumen_mou',
                'tgl_mulai',
                'tgl_selesai',
                'status'
            )
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' => 'Proyek tidak ditemukan atau bukan milik Anda'
            ], 404);
        }

        // 2️⃣ Ambil seluruh progres proyek (urut dari awal ke akhir)
        $progressList = DB::table('progress_proyek')
            ->where('id_proyek', $id)
            ->orderBy('tgl_update', 'asc')
            ->orderBy('id_progress', 'asc')
            ->get();

        // 3️⃣ Ambil persentase terakhir
        $persentaseTerakhir = $progressList->last()->persentase ?? 0;

        // 4️⃣ Response JSON
        return response()->json([
            'proyek' => $proyek,
            'persentase_terakhir' => $persentaseTerakhir,
            'progress_list' => $progressList
        ]);
    }

    /**
     * GABUNG PROYEK VIA KODE
     */
    public function gabung(Request $request)
    {
        $request->validate([
            'kode_proyek' => 'required|string|max:10'
        ]);

        // Cari proyek berdasarkan kode
        $proyek = DB::table('proyek')
            ->where('kode_proyek', $request->kode_proyek)
            ->first();

        if (!$proyek) {
            return response()->json([
                'message' => 'Kode proyek tidak ditemukan'
            ], 404);
        }

        // Update pemilik proyek
        DB::table('proyek')
            ->where('id_proyek', $proyek->id_proyek)
            ->update([
                'id_pemilik' => $request->user()->id_user
            ]);

        // Ambil data proyek terbaru
        $proyekBaru = DB::table('proyek')
            ->where('id_proyek', $proyek->id_proyek)
            ->first();

        return response()->json([
            'message' => 'Berhasil bergabung ke proyek',
            'proyek' => $proyekBaru
        ]);
    }
}
