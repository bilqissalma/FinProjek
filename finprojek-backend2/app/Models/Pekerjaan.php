<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pekerjaan extends Model
{
    protected $table = 'pekerjaan';
    protected $primaryKey = 'id_pekerjaan';

    public $timestamps = false;

    protected $fillable = [
        'id_proyek',
        'nama_pekerjaan',
        'keterangan',
    ];
}
