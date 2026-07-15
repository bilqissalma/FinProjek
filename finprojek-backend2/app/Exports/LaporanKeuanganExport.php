<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class LaporanKeuanganExport implements FromCollection, WithHeadings
{
    protected $idProyek;

    public function __construct($idProyek)
    {
        $this->idProyek = $idProyek;
    }

    public function collection()
    {
        $rows = [];
        $no = 1;

        $pekerjaanList = DB::table('pekerjaan')
            ->where('id_proyek', $this->idProyek)
            ->orderBy('id_pekerjaan')
            ->get();

        foreach ($pekerjaanList as $pekerjaan) {

            $totalPekerjaan = 0;
            $indexPekerjaan = count($rows);

            $rows[] = [
                $no,
                $pekerjaan->nama_pekerjaan,
                '',
                '',
                '',
                '',
                '',
                0
            ];

            $subList = DB::table('sub_pekerjaan')
                ->where('id_pekerjaan', $pekerjaan->id_pekerjaan)
                ->get();

            foreach ($subList as $sub) {

                $totalSub = 0;
                $indexSub = count($rows);

                $rows[] = [
                    '',
                    '   └ ' . $sub->nama_sub,
                    '',
                    '',
                    '',
                    '',
                    '',
                    0
                ];

                $items = DB::table('distribusi_material')
                    ->join('detail_pengeluaran', 'detail_pengeluaran.id_detail', '=', 'distribusi_material.id_detail')
                    ->join('pengeluaran', 'pengeluaran.id_pengeluaran', '=', 'detail_pengeluaran.id_pengeluaran')
                    ->where('distribusi_material.id_sub', $sub->id_sub)
                    ->select(
                        'pengeluaran.spesifikasi',
                        'detail_pengeluaran.nama_item',
                        'detail_pengeluaran.banyak',
                        'detail_pengeluaran.satuan',
                        'detail_pengeluaran.harga_satuan',
                        'detail_pengeluaran.jumlah_harga'
                    )
                    ->get();

                foreach ($items as $item) {
                    $totalSub += $item->jumlah_harga;
                    $totalPekerjaan += $item->jumlah_harga;

                    $rows[] = [
                        '',
                        '',
                        $item->nama_item . ' (' . $item->spesifikasi . ')',
                        $item->banyak,
                        $item->satuan,
                        $item->harga_satuan,
                        $item->jumlah_harga,
                        ''
                    ];
                }

                $rows[$indexSub][7] = $totalSub;
            }

            $rows[$indexPekerjaan][7] = $totalPekerjaan;
            $no++;
        }

        return collect($rows);
    }

    public function headings(): array
    {
        return [
            'No',
            'Jenis Pekerjaan',
            'Material / Tenaga',
            'Volume',
            'Satuan',
            'Harga Satuan',
            'Jumlah',
            'Total'
        ];
    }
}
