<?php


namespace App\Http\Controllers\Api\Kontraktor;


use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class MaterialController extends Controller
{
 // MaterialController.php
public function index(Request $request)
{
   $query = DB::table('distribusi_material as dm')
       ->join('detail_pengeluaran as dp', 'dm.id_detail', '=', 'dp.id_detail')
       ->join('pengeluaran as p', 'dp.id_pengeluaran', '=', 'p.id_pengeluaran')
       ->join('sub_pekerjaan as s', 'dm.id_sub', '=', 's.id_sub')
       ->join('pekerjaan as j', 's.id_pekerjaan', '=', 'j.id_pekerjaan')
       ->join('proyek as pr', 'j.id_proyek', '=', 'pr.id_proyek')
       ->select(
           'p.tgl_transaksi',
           'p.spesifikasi',
           'dp.nama_item',
           'dp.satuan',
           'pr.id_proyek',
           'pr.nama_proyek',
           'j.id_pekerjaan',
           'j.nama_pekerjaan',
           's.id_sub',
           's.nama_sub',
           DB::raw('(dp.banyak * dm.rasio_penggunaan / 100) as jumlah_pakai'),
           DB::raw('(dp.jumlah_harga * dm.rasio_penggunaan / 100) as biaya_pakai')
       );


   // FILTER OPSIONAL
   if ($request->id_proyek) {
       $query->where('pr.id_proyek', $request->id_proyek);
   }


   if ($request->id_pekerjaan) {
       $query->where('j.id_pekerjaan', $request->id_pekerjaan);
   }


   if ($request->id_sub) {
       $query->where('s.id_sub', $request->id_sub);
   }


   if ($request->start && $request->end) {
       $query->whereBetween('p.tgl_transaksi', [$request->start, $request->end]);
   }


   return response()->json(
       $query->orderBy('p.tgl_transaksi')->get()
   );
}


}
