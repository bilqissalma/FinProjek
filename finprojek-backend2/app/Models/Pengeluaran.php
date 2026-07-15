<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengeluaran extends Model
{
    protected $table = 'pengeluaran';

    protected $fillable = [
        'id_proyek',
        'no_nota',
        'tgl_transaksi',
        'spesifikasi',
    ];

    public $timestamps = false;
}
