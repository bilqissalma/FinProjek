<?php

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

use App\Http\Controllers\Api\Pemilik\DashboardController as PemilikDashboard;
use App\Http\Controllers\Api\Pemilik\ProyekController as PemilikProyek;

use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\AdminController;

use App\Http\Controllers\Api\PaymentController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);



    Route::prefix('kontraktor')
    ->middleware(['auth:api', 'role:kontraktor'])
    ->group(function () {

        Route::get('/dashboard', [KontraktorDashboard::class, 'index']);

    });
    Route::prefix('pemilik')
    ->middleware(['auth:api', 'role:pemilik'])
    ->group(function () {

        Route::get('/dashboard', [PemilikDashboard::class, 'index']);

        Route::get('/proyek', [PemilikProyek::class, 'index']);
        Route::get('/proyek/{id}', [PemilikProyek::class, 'show']);
        Route::get('/proyek/{id}/progress', [PemilikProyek::class, 'progress']);
        Route::post('/proyek/gabung', [PemilikProyek::class, 'gabung']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::post('/profile', [ProfileController::class, 'update']);
        Route::delete('/profile', [ProfileController::class, 'destroy']);
    });

    Route::prefix('admin')
    ->middleware(['auth:api', 'role:admin'])
    ->group(function () {

        /* =====================
           DASHBOARD
        ===================== */
        Route::get('/dashboard', [UserController::class, 'dashboard']);

        /* =====================
           KELOLA USER
           (kontraktor & pemilik)
        ===================== */
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        /* =====================
           KELOLA ADMIN
        ===================== */
        Route::get('/admins', [AdminController::class, 'index']);
        Route::post('/admins', [AdminController::class, 'store']);
        Route::get('/admins/{id}', [AdminController::class, 'show']);      // <-- hapus 'admin' dobel
        Route::put('/admins/{id}', [AdminController::class, 'update']);    // <-- hapus 'admin' dobel
        Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
    });
    



    

    Route::middleware('auth:api')->group(function () {
        Route::post('/payment/mark-vip', [PaymentController::class, 'markVip']);
        
        // PROYEK
        Route::get('/proyek', [ProyekController::class, 'index']);
        Route::post('/proyek', [ProyekController::class, 'store']);
        Route::delete('/proyek/{id}', [ProyekController::class, 'destroy']);
        Route::get('/proyek/{id}', [ProyekController::class, 'show']);
        Route::put('/proyek/{id}', [ProyekController::class, 'update']);

    
        // PEKERJAAN
        Route::get('/pekerjaan', [PekerjaanController::class, 'index']);
        Route::post('/pekerjaan', [PekerjaanController::class, 'store']);
        Route::delete('/pekerjaan/{id}', [PekerjaanController::class, 'destroy']);
        Route::get('/pekerjaan/{id}', [PekerjaanController::class, 'show']);
        Route::put('/pekerjaan/{id}', [PekerjaanController::class, 'update']);

        Route::get('/pengeluaran', [PengeluaranController::class, 'index']);
        Route::post('/pengeluaran', [PengeluaranController::class, 'store']);
        Route::delete('/pengeluaran/{id}', [PengeluaranController::class, 'destroy']);
        Route::get('/proyek/{id}/pekerjaan', [PekerjaanController::class, 'indexByProyek']);
        Route::get('/pengeluaran/{id}', [PengeluaranController::class, 'show']);
        Route::put('/pengeluaran/{id}', [PengeluaranController::class, 'update']);

        Route::get('/pekerjaan/{id}/sub-pekerjaan', [SubPekerjaanController::class, 'indexByPekerjaan']);
        Route::post('/sub-pekerjaan',[SubPekerjaanController::class, 'store']);
        Route::delete('/sub-pekerjaan/{id}',[SubPekerjaanController::class, 'destroy']);
        Route::get('/sub-pekerjaan/{id}', [SubPekerjaanController::class, 'show']);   // ambil data edit
Route::put('/sub-pekerjaan/{id}', [SubPekerjaanController::class, 'update']); // simpan hasil edit

        Route::get('/material', [MaterialController::class, 'index']);
        Route::get('/dropdown/proyek', fn () =>
            DB::table('proyek')->select('id_proyek', 'nama_proyek')->get()
        );
        Route::get('/dropdown/pekerjaan/{id_proyek}', fn ($id_proyek) =>
            DB::table('pekerjaan')
            ->where('id_proyek', $id_proyek)
            ->select('id_pekerjaan', 'nama_pekerjaan')
            ->get()
        );
        Route::get('/dropdown/sub/{id_pekerjaan}', fn ($id_pekerjaan) =>
            DB::table('sub_pekerjaan')
            ->where('id_pekerjaan', $id_pekerjaan)
            ->select('id_sub', 'nama_sub')
            ->get()
        );

        Route::get('/laporan-keuangan', [LaporanKeuanganController::class, 'index']);
        Route::get('/laporan-keuangan/export/excel', [LaporanKeuanganController::class, 'exportExcel']);
        Route::get('/laporan-keuangan/export/pdf', [LaporanKeuanganController::class, 'exportPdf']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::post('/profile', [ProfileController::class, 'update']);
        Route::delete('/profile', [ProfileController::class, 'destroy']);

        Route::get('/progres', [ProgresController::class, 'index']);
        Route::get('/progres/{id}', [ProgresController::class, 'show']);
        Route::post('/progres/{id}', [ProgresController::class, 'store']);

    });



Route::middleware('auth:api')->post('/payments/create', [PaymentController::class, 'create']);
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);


Route::middleware('auth:api')->get('/me', function () {
    return auth('api')->user();
});



/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/test-payment', function () {
    return class_exists(\App\Http\Controllers\Api\PaymentController::class)
        ? 'CONTROLLER OK'
        : 'CONTROLLER NOT FOUND';
});
