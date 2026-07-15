<?php

namespace App\Http\Controllers\Api\Pemilik;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(
            User::where('id_user', $request->user()->id_user)->first()
        );
    }

    public function update(Request $request)
    {
        $user = User::where('id_user', $request->user()->id_user)->first();

        $request->validate([
            'nama_lengkap' => 'required|string|max:100',
            'email'        => 'nullable|email|max:100',
            'no_telepon'   => 'nullable|string|max:20',
            'password'     => 'nullable|min:6',
            'foto_profil'  => 'nullable|image|max:2048',
        ]);

        $user->nama_lengkap = $request->nama_lengkap;
        $user->email = $request->email;
        $user->no_telepon = $request->no_telepon;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        if ($request->hasFile('foto_profil')) {
            $path = $request->file('foto_profil')->store('foto-profil', 'public');
            $user->foto_profil = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profil pemilik berhasil diperbarui',
            'data' => $user
        ]);
    }

    public function destroy(Request $request)
    {
        User::where('id_user', $request->user()->id_user)->delete();

        return response()->json([
            'message' => 'Akun berhasil dihapus'
        ]);
    }
}
