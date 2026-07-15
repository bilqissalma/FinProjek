<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;


class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'required|string|max:100',
            'email'        => 'required|email|max:100|unique:user,email',
            'password'     => 'required|min:6',
            'no_telepon'   => 'required|max:20',
            'role'         => 'required|in:kontraktor,pemilik'
        ]);

        User::create([
            'nama_lengkap' => $request->nama_lengkap,
            'email'        => $request->email,
            'password'     => Hash::make($request->password),
            'no_telepon'   => $request->no_telepon,
            'role'         => $request->role,
            'status'       => 'aktif'
        ]);

        return response()->json([
            'message' => 'Registrasi berhasil'
        ], 201);
    }

    // LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)
            ->where('status', 'aktif')
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        // 🔑 TOKEN MANUAL (TANPA SANCTUM)
        $token = Str::random(60);

        $user->api_token = $token;
        $user->save();

        return response()->json([
            'token' => $token,
            'user'  => $user
        ]);
    }

    // FORGOT PASSWORD
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Email tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'message' => 'Jika email terdaftar, link reset akan dikirim'
        ]);
    }

    public function logout(Request $request)
{
    $user = $request->user();
    $user->api_token = null;
    $user->save();

    return response()->json([
        'message' => 'Logout berhasil'
    ]);
}

}
