<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PengeluaranController extends Controller
{
    public function index(Request $request)
    {
        $user = auth('api')->user();
    
        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }
    
        $pengeluaran = DB::table('pengeluaran as pg')
            ->join(
                'proyek as p',
                'pg.id_proyek',
                '=',
                'p.id_proyek'
            )
            ->leftJoin(
                'detail_pengeluaran as dp',
                'pg.id_pengeluaran',
                '=',
                'dp.id_pengeluaran'
            )
            ->leftJoin(
                'distribusi_material as dm',
                'dp.id_detail',
                '=',
                'dm.id_detail'
            )
            ->leftJoin(
                'sub_pekerjaan as sp',
                'dm.id_sub',
                '=',
                'sp.id_sub'
            )
            ->leftJoin(
                'pekerjaan as pk',
                'sp.id_pekerjaan',
                '=',
                'pk.id_pekerjaan'
            )
            ->where(
                'p.id_kontraktor',
                $user->id_user
            )
            ->select(
                'pg.id_pengeluaran',
                'pg.no_nota',
                'pg.tgl_transaksi',
                'pg.spesifikasi',
                'pg.id_proyek',
                'p.nama_proyek',
    
                DB::raw(
                    'GROUP_CONCAT(
                        DISTINCT pk.id_pekerjaan
                        ORDER BY pk.id_pekerjaan
                        SEPARATOR ","
                    ) AS id_pekerjaan_list'
                ),
    
                DB::raw(
                    'GROUP_CONCAT(
                        DISTINCT pk.nama_pekerjaan
                        ORDER BY pk.nama_pekerjaan
                        SEPARATOR ", "
                    ) AS nama_pekerjaan'
                ),
    
                DB::raw(
                    'COALESCE(
                        SUM(DISTINCT dp.jumlah_harga),
                        0
                    ) AS total'
                )
            )
            ->groupBy(
                'pg.id_pengeluaran',
                'pg.no_nota',
                'pg.tgl_transaksi',
                'pg.spesifikasi',
                'pg.id_proyek',
                'p.nama_proyek'
            )
            ->orderByDesc('pg.tgl_transaksi')
            ->orderByDesc('pg.id_pengeluaran')
            ->get();
    
        return response()->json($pengeluaran);
    }
    

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            /* =========================
               VALIDASI HEADER
            ========================== */
            $request->validate([
                'id_proyek' => 'required|integer',
                'no_nota' => 'nullable|string|max:50',
                'tgl_transaksi' => 'nullable|date',
                'spesifikasi' => 'required|in:Material,Tenaga',
                'details' => 'required|array|min:1',
            ]);

            /* =========================
               INSERT PENGELUARAN
            ========================== */
            $idPengeluaran = DB::table('pengeluaran')->insertGetId([
                'id_proyek' => $request->id_proyek,
                'no_nota' => $request->no_nota,
                'tgl_transaksi' => $request->tgl_transaksi,
                'spesifikasi' => $request->spesifikasi,
            ]);

            /* =========================
               LOOP DETAIL
            ========================== */
            foreach ($request->details as $detail) {

                if (empty($detail['nama_item'])) {
                    throw new \Exception('Nama item wajib diisi');
                }

                $idDetail = DB::table('detail_pengeluaran')->insertGetId([
                    'id_pengeluaran' => $idPengeluaran,
                    'nama_item' => $detail['nama_item'],
                    'satuan' => $detail['satuan'] ?? null,
                    'banyak' => $detail['banyak'] ?? null,
                    'harga_satuan' => $detail['harga_satuan'] ?? null,
                ]);

                /* =========================
                   DISTRIBUSI MATERIAL
                ========================== */
                if (!empty($detail['distribusi'])) {

                    $totalRasio = 0;

                    foreach ($detail['distribusi'] as $dist) {

                        if (empty($dist['id_sub'])) {
                            throw new \Exception('Sub pekerjaan belum dipilih');
                        }

                        // ✅ VALIDASI: sub pekerjaan HARUS ADA
                        $subExists = DB::table('sub_pekerjaan')
                            ->where('id_sub', $dist['id_sub'])
                            ->exists();

                        if (!$subExists) {
                            throw new \Exception(
                                'Sub pekerjaan tidak ditemukan (ID: ' . $dist['id_sub'] . ')'
                            );
                        }

                        $rasio = floatval($dist['rasio_penggunaan'] ?? 0);
                        $totalRasio += $rasio;

                        DB::table('distribusi_material')->insert([
                            'id_detail' => $idDetail,
                            'id_sub' => $dist['id_sub'],
                            'rasio_penggunaan' => $rasio,
                        ]);
                    }

                    // ✅ VALIDASI TOTAL RASIO
                    if (
                        empty($detail['allow_partial']) &&
                        round($totalRasio, 2) !== 100.00
                    ) {
                        throw new \Exception(
                            'Total rasio distribusi harus 100%'
                        );
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Pengeluaran berhasil disimpan',
                'id_pengeluaran' => $idPengeluaran,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('STORE PENGELUARAN ERROR', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal menyimpan pengeluaran',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $detailIds = DB::table('detail_pengeluaran')
                ->where('id_pengeluaran', $id)
                ->pluck('id_detail');

            DB::table('distribusi_material')
                ->whereIn('id_detail', $detailIds)
                ->delete();

            DB::table('detail_pengeluaran')
                ->where('id_pengeluaran', $id)
                ->delete();

            DB::table('pengeluaran')
                ->where('id_pengeluaran', $id)
                ->delete();

            DB::commit();

            return response()->json([
                'message' => 'Pengeluaran berhasil dihapus'
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menghapus pengeluaran',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        // =========================
        // HEADER PENGELUARAN
        // =========================
        $pengeluaran = DB::table('pengeluaran as p')
            ->join('proyek as pr', 'pr.id_proyek', '=', 'p.id_proyek')
            ->where('p.id_pengeluaran', $id)
            ->select(
                'p.id_pengeluaran',
                'p.no_nota',
                'p.tgl_transaksi',
                'p.spesifikasi',
                'p.id_proyek',
                'pr.nama_proyek'
            )
            ->first();
    
        if (!$pengeluaran) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }
    
        // =========================
        // DETAIL + DISTRIBUSI
        // =========================
        $details = DB::table('detail_pengeluaran')
            ->where('id_pengeluaran', $id)
            ->get()
            ->map(function ($detail) {
    
                $detail->distribusi = DB::table('distribusi_material as dm')
                    ->join('sub_pekerjaan as sp', 'sp.id_sub', '=', 'dm.id_sub')
                    ->join('pekerjaan as pk', 'pk.id_pekerjaan', '=', 'sp.id_pekerjaan')
                    ->join('proyek as pr', 'pr.id_proyek', '=', 'pk.id_proyek')
                    ->where('dm.id_detail', $detail->id_detail)
                    ->select(
                        'pr.nama_proyek',
                        'pk.nama_pekerjaan',
                        'sp.nama_sub',
                        'dm.rasio_penggunaan'
                    )
                    ->get();
    
                return $detail;
            });
    
        return response()->json([
            'pengeluaran' => $pengeluaran,
            'details' => $details
        ]);
    }
    

public function update(Request $request, $id)
{
    DB::beginTransaction();

    try {
        $request->validate([
            'id_proyek' => 'required|integer',
            'spesifikasi' => 'required|in:Material,Tenaga',
            'details' => 'required|array|min:1',
        ]);

        DB::table('pengeluaran')
            ->where('id_pengeluaran', $id)
            ->update([
                'id_proyek' => $request->id_proyek,
                'no_nota' => $request->no_nota,
                'tgl_transaksi' => $request->tgl_transaksi,
                'spesifikasi' => $request->spesifikasi,
            ]);

        // hapus detail lama
        $detailIds = DB::table('detail_pengeluaran')
            ->where('id_pengeluaran', $id)
            ->pluck('id_detail');

        DB::table('distribusi_material')
            ->whereIn('id_detail', $detailIds)
            ->delete();

        DB::table('detail_pengeluaran')
            ->where('id_pengeluaran', $id)
            ->delete();

        // insert ulang detail
        foreach ($request->details as $detail) {
            $idDetail = DB::table('detail_pengeluaran')->insertGetId([
                'id_pengeluaran' => $id,
                'nama_item' => $detail['nama_item'],
                'satuan' => $detail['satuan'],
                'banyak' => $detail['banyak'],
                'harga_satuan' => $detail['harga_satuan'],
            ]);

            foreach ($detail['distribusi'] as $dist) {
                DB::table('distribusi_material')->insert([
                    'id_detail' => $idDetail,
                    'id_sub' => $dist['id_sub'],
                    'rasio_penggunaan' => $dist['rasio_penggunaan'],
                ]);
            }
        }

        DB::commit();
        return response()->json(['message' => 'Pengeluaran berhasil diperbarui']);

    } catch (\Throwable $e) {
        DB::rollBack();
        return response()->json([
            'message' => 'Gagal update pengeluaran',
            'error' => $e->getMessage()
        ], 422);
    }
}


}
