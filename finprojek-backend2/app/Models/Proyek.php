<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyek extends Model
{
    protected $table = 'proyek';
    protected $primaryKey = 'id_proyek';

    // ⬅️ MATIKAN TIMESTAMPS
    public $timestamps = false;

    protected $fillable = [
        'kode_proyek',
        'id_kontraktor',
        'id_pemilik',
        'nama_proyek',
        'lokasi',
        'biaya_kesepakatan',
        'dokumen_mou',
        'tgl_mulai',
        'tgl_selesai',
        'status',
    ];
}
