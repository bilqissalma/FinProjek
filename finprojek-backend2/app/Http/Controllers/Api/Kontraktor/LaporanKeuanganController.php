<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Exports\LaporanKeuanganExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;


class LaporanKeuanganController extends Controller
{
    public function index(Request $request)
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $idProyek = $request->query('id_proyek');
        $start    = $request->query('start');
        $end      = $request->query('end');

        /* ===============================
           BASE QUERY
        =============================== */
        $baseQuery = DB::table('pengeluaran')
            ->join('detail_pengeluaran', 'detail_pengeluaran.id_pengeluaran', '=', 'pengeluaran.id_pengeluaran')
            ->join('proyek', 'pengeluaran.id_proyek', '=', 'proyek.id_proyek')
            ->where('proyek.id_kontraktor', $user->id_user);

        if ($idProyek) {
            $baseQuery->where('pengeluaran.id_proyek', $idProyek);
        }

        if ($start && $end) {
            $baseQuery->whereBetween('pengeluaran.tgl_transaksi', [$start, $end]);
        }

        /* ===============================
           CHART
        =============================== */
        $chart = (clone $baseQuery)
            ->select(
                'pengeluaran.tgl_transaksi',
                DB::raw('SUM(detail_pengeluaran.jumlah_harga) as total')
            )
            ->groupBy('pengeluaran.tgl_transaksi')
            ->orderBy('pengeluaran.tgl_transaksi')
            ->get();

        $totalPengeluaran = $chart->sum('total');

        /* ===============================
           BREAKDOWN (FIXED)
        =============================== */
        $breakdown = (clone $baseQuery)
            ->select(
                DB::raw("
                    SUM(CASE WHEN pengeluaran.spesifikasi = 'Material'
                        THEN detail_pengeluaran.jumlah_harga ELSE 0 END) as total_material
                "),
                DB::raw("
                    SUM(CASE WHEN pengeluaran.spesifikasi = 'Tenaga'
                        THEN detail_pengeluaran.jumlah_harga ELSE 0 END) as total_tenaga
                ")
            )
            ->first();

        /* ===============================
           BIAYA PROYEK
        =============================== */
        $biayaKesepakatan = 0;
        if ($idProyek) {
            $biayaKesepakatan = DB::table('proyek')
                ->where('id_proyek', $idProyek)
                ->value('biaya_kesepakatan') ?? 0;
        }

        /* ===============================
           ✅ PERSENTASE PENGELUARAN (DITAMBAHKAN)
        =============================== */
        $persentasePengeluaran = 0;
        if ($biayaKesepakatan > 0) {
            $persentasePengeluaran = round(
                ($totalPengeluaran / $biayaKesepakatan) * 100,
                2
            );
        }

        return response()->json([
            'proyek' => [
                'biaya_kesepakatan' => (float) $biayaKesepakatan
            ],
            'total_pengeluaran'      => (float) $totalPengeluaran,
            'total_material'         => (float) ($breakdown->total_material ?? 0),
            'total_tenaga'           => (float) ($breakdown->total_tenaga ?? 0),
            'sisa_anggaran'          => (float) ($biayaKesepakatan - $totalPengeluaran),
            'persentase_pengeluaran' => (float) $persentasePengeluaran,
            'chart'                  => $chart,
        ]);
    }

    public function exportLaporanKeuangan($idProyek)
    {
        $proyek = DB::table('proyek')
            ->where('id_proyek', $idProyek)
            ->first();
    
        $namaProyek = $proyek
            ? Str::slug($proyek->nama_proyek, ' ')
            : 'Proyek';
    
        $fileName = 'Laporan Keuangan - ' . $namaProyek . '.xlsx';
    
        return Excel::download(
            new LaporanKeuanganExport($idProyek),
            $fileName
        );
    }

    public function exportExcel(Request $request)
    {
        $idProyek = $request->query('id_proyek');
    
        $proyek = DB::table('proyek')
            ->where('id_proyek', $idProyek)
            ->first();
    
        $namaProyek = $proyek
            ? Str::slug($proyek->nama_proyek, ' ')
            : 'Proyek';
    
        $fileName = 'Laporan Keuangan - ' . $namaProyek . '.xlsx';
    
        return Excel::download(
            new LaporanKeuanganExport($idProyek),
            $fileName
        );
    }



public function exportPdf(Request $request)
{
    $idProyek = $request->query('id_proyek');

    if (!$idProyek) {
        return response()->json(['message' => 'ID proyek wajib'], 400);
    }

    $proyek = DB::table('proyek')
        ->where('id_proyek', $idProyek)
        ->first();

    if (!$proyek) {
        return response()->json(['message' => 'Proyek tidak ditemukan'], 404);
    }

    $laporan = DB::table('pengeluaran')
        ->join('detail_pengeluaran', 'detail_pengeluaran.id_pengeluaran', '=', 'pengeluaran.id_pengeluaran')
        ->where('pengeluaran.id_proyek', $idProyek)
        ->select(
            'pengeluaran.tgl_transaksi',
            'pengeluaran.spesifikasi',
            'detail_pengeluaran.nama_item',
            'detail_pengeluaran.jumlah_harga'
        )
        ->orderBy('pengeluaran.tgl_transaksi')
        ->get();

    $pdf = Pdf::loadView('pdf.laporan-keuangan', [
        'proyek'  => $proyek,
        'laporan' => $laporan
    ])->setPaper('A4', 'portrait');

    return $pdf->stream();
}

}
