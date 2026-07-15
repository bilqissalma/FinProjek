<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens; // ⬅️ WAJIB
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    protected $table = 'user';
    protected $primaryKey = 'id_user';

    protected $fillable = [
        'nama_lengkap',
        'email',
        'password',
        'no_telepon',
        'role',
        'status',
        'api_token',
        'is_premium'
    ];

    protected $hidden = [
        'password',
        'api_token'
    ];

    public $timestamps = false;
}
