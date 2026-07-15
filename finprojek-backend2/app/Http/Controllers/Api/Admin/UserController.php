<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::orderBy('id_user', 'desc')->get();
    }


    public function store(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'required',
            'email' => 'required|email|unique:user,email', // ⚡ perbaikan
            'password' => 'required|min:6',
            'role' => 'required',
            'status' => 'required',
        ]);
    
        $user = User::create([
            'nama_lengkap' => $request->nama_lengkap,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
        ]);
    
        return response()->json([
            'message' => 'User berhasil ditambahkan',
            'data' => $user,
        ], 201);
    }
    
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
    
        $data = $request->validate([
            'nama_lengkap' => 'required',
            'email' => 'nullable|email|unique:user,email,' . $id . ',id_user', // ⚡ perbaikan
            'role' => 'required|in:admin,kontraktor,pemilik',
            'status' => 'required|in:aktif,tidak aktif',
            'password' => 'nullable|min:6',
        ]);
    
        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        } else {
            unset($data['password']);
        }
    
        $user->update($data);
        return $user;
    }
    public function show($id)
{
    return User::where('id_user', $id)->firstOrFail();
}

    

    public function destroy(Request $request, $id)
    {
        if ($request->user()->id_user == $id) {
            return response()->json(['message' => 'Tidak bisa hapus akun sendiri'], 400);
        }

        User::where('id_user', $id)->delete();
        return response()->json(['message' => 'User dihapus']);
    }

    
}
