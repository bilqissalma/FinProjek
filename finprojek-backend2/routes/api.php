<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\Kontraktor\DashboardController as KontraktorDashboard;
use App\Http\Controllers\Api\Kontraktor\ProyekController;
use App\Http\Controllers\Api\Kontraktor\PekerjaanController;
use App\Http\Controllers\Api\Kontraktor\PengeluaranController;
use App\Http\Controllers\Api\Kontraktor\SubPekerjaanController;
use App\Http\Controllers\Api\Kontraktor\MaterialController;
use App\Http\Controllers\Api\Kontraktor\LaporanKeuanganController;
use App\Http\Controllers\Api\Kontraktor\ProfileController;
use App\Http\Controllers\Api\Kontraktor\ProgresController;
use App\Http\Controllers\Api\Kontraktor\DropdownController;

use App\Http\Controllers\Api\Pemilik\DashboardController as PemilikDashboard;
use App\Http\Controllers\Api\Pemilik\ProyekController as PemilikProyek;

use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\AdminController;

use App\Http\Controllers\Api\PaymentController;

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [
    AuthController::class,
    'forgotPassword',
]);

/*
|--------------------------------------------------------------------------
| Dashboard Kontraktor
|--------------------------------------------------------------------------
*/

Route::prefix('kontraktor')
    ->middleware(['auth:api', 'role:kontraktor'])
    ->group(function () {
        Route::get('/dashboard', [
            KontraktorDashboard::class,
            'index',
        ]);
    });

/*
|--------------------------------------------------------------------------
| Pemilik
|--------------------------------------------------------------------------
*/

Route::prefix('pemilik')
    ->middleware(['auth:api', 'role:pemilik'])
    ->group(function () {
        Route::get('/dashboard', [
            PemilikDashboard::class,
            'index',
        ]);

        Route::get('/proyek', [
            PemilikProyek::class,
            'index',
        ]);

        Route::get('/proyek/{id}', [
            PemilikProyek::class,
            'show',
        ]);

        Route::get('/proyek/{id}/progress', [
            PemilikProyek::class,
            'progress',
        ]);

        Route::post('/proyek/gabung', [
            PemilikProyek::class,
            'gabung',
        ]);

        Route::get('/profile', [
            ProfileController::class,
            'show',
        ]);

        Route::post('/profile', [
            ProfileController::class,
            'update',
        ]);

        Route::delete('/profile', [
            ProfileController::class,
            'destroy',
        ]);
    });

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

Route::prefix('admin')
    ->middleware(['auth:api', 'role:admin'])
    ->group(function () {
        Route::get('/dashboard', [
            UserController::class,
            'dashboard',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Kelola User
        |--------------------------------------------------------------------------
        */

        Route::get('/users', [
            UserController::class,
            'index',
        ]);

        Route::post('/users', [
            UserController::class,
            'store',
        ]);

        Route::get('/users/{id}', [
            UserController::class,
            'show',
        ]);

        Route::put('/users/{id}', [
            UserController::class,
            'update',
        ]);

        Route::delete('/users/{id}', [
            UserController::class,
            'destroy',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Kelola Admin
        |--------------------------------------------------------------------------
        */

        Route::get('/admins', [
            AdminController::class,
            'index',
        ]);

        Route::post('/admins', [
            AdminController::class,
            'store',
        ]);

        Route::get('/admins/{id}', [
            AdminController::class,
            'show',
        ]);

        Route::put('/admins/{id}', [
            AdminController::class,
            'update',
        ]);

        Route::delete('/admins/{id}', [
            AdminController::class,
            'destroy',
        ]);
    });

/*
|--------------------------------------------------------------------------
| Fitur Kontraktor
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api', 'role:kontraktor'])
    ->group(function () {
        /*
        |--------------------------------------------------------------------------
        | Payment
        |--------------------------------------------------------------------------
        */

        Route::post('/payment/mark-vip', [
            PaymentController::class,
            'markVip',
        ]);

        Route::post('/payments/create', [
            PaymentController::class,
            'create',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Proyek
        |--------------------------------------------------------------------------
        */

        Route::get('/proyek', [
            ProyekController::class,
            'index',
        ]);

        Route::post('/proyek', [
            ProyekController::class,
            'store',
        ]);

        Route::get('/proyek/{id}', [
            ProyekController::class,
            'show',
        ]);

        Route::put('/proyek/{id}', [
            ProyekController::class,
            'update',
        ]);

        Route::delete('/proyek/{id}', [
            ProyekController::class,
            'destroy',
        ]);

        Route::get('/proyek/{id}/pekerjaan', [
            PekerjaanController::class,
            'indexByProyek',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Pekerjaan
        |--------------------------------------------------------------------------
        */

        Route::get('/pekerjaan', [
            PekerjaanController::class,
            'index',
        ]);

        Route::post('/pekerjaan', [
            PekerjaanController::class,
            'store',
        ]);

        Route::get('/pekerjaan/{id}', [
            PekerjaanController::class,
            'show',
        ]);

        Route::put('/pekerjaan/{id}', [
            PekerjaanController::class,
            'update',
        ]);

        Route::delete('/pekerjaan/{id}', [
            PekerjaanController::class,
            'destroy',
        ]);

        Route::get('/pekerjaan/{id}/sub-pekerjaan', [
            SubPekerjaanController::class,
            'indexByPekerjaan',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Subpekerjaan
        |--------------------------------------------------------------------------
        */

        Route::post('/sub-pekerjaan', [
            SubPekerjaanController::class,
            'store',
        ]);

        Route::get('/sub-pekerjaan/{id}', [
            SubPekerjaanController::class,
            'show',
        ]);

        Route::put('/sub-pekerjaan/{id}', [
            SubPekerjaanController::class,
            'update',
        ]);

        Route::delete('/sub-pekerjaan/{id}', [
            SubPekerjaanController::class,
            'destroy',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Pengeluaran
        |--------------------------------------------------------------------------
        */

        Route::get('/pengeluaran', [
            PengeluaranController::class,
            'index',
        ]);

        Route::post('/pengeluaran', [
            PengeluaranController::class,
            'store',
        ]);

        Route::get('/pengeluaran/{id}', [
            PengeluaranController::class,
            'show',
        ]);

        Route::put('/pengeluaran/{id}', [
            PengeluaranController::class,
            'update',
        ]);

        Route::delete('/pengeluaran/{id}', [
            PengeluaranController::class,
            'destroy',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Material dan Tenaga
        |--------------------------------------------------------------------------
        */

        Route::get('/material', [
            MaterialController::class,
            'index',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Dropdown
        |--------------------------------------------------------------------------
        |
        | Hanya satu kelompok route dropdown.
        | Route closure DB::table sebelumnya sudah dihapus.
        |
        */

        Route::get('/dropdown/proyek', [
            DropdownController::class,
            'proyek',
        ]);

        Route::get('/dropdown/pekerjaan/{idProyek}', [
            DropdownController::class,
            'pekerjaan',
        ]);

        Route::get('/dropdown/sub/{idPekerjaan}', [
            DropdownController::class,
            'sub',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Laporan Keuangan
        |--------------------------------------------------------------------------
        */

        Route::get('/laporan-keuangan', [
            LaporanKeuanganController::class,
            'index',
        ]);

        Route::get('/laporan-keuangan/export/excel', [
            LaporanKeuanganController::class,
            'exportExcel',
        ]);

        Route::get('/laporan-keuangan/export/pdf', [
            LaporanKeuanganController::class,
            'exportPdf',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Profil
        |--------------------------------------------------------------------------
        */

        Route::get('/profile', [
            ProfileController::class,
            'show',
        ]);

        Route::post('/profile', [
            ProfileController::class,
            'update',
        ]);

        Route::delete('/profile', [
            ProfileController::class,
            'destroy',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Progres
        |--------------------------------------------------------------------------
        */

        Route::get('/progres', [
            ProgresController::class,
            'index',
        ]);

        Route::get('/progres/{id}', [
            ProgresController::class,
            'show',
        ]);

        Route::post('/progres/{id}', [
            ProgresController::class,
            'store',
        ]);
    });

/*
|--------------------------------------------------------------------------
| Midtrans Webhook
|--------------------------------------------------------------------------
*/

Route::post('/payments/webhook', [
    PaymentController::class,
    'webhook',
]);

/*
|--------------------------------------------------------------------------
| User Aktif
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')
    ->get('/me', function () {
        return auth('api')->user();
    });

Route::middleware('auth:api')
    ->get('/user', function (Request $request) {
        return $request->user();
    });

/*
|--------------------------------------------------------------------------
| Test Payment Controller
|--------------------------------------------------------------------------
*/

Route::get('/test-payment', function () {
    return class_exists(
        \App\Http\Controllers\Api\PaymentController::class
    )
        ? 'CONTROLLER OK'
        : 'CONTROLLER NOT FOUND';
});
