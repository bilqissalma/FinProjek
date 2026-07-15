<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function index()
    {
        return User::where('role', 'admin')->get();
    }
    public function store(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'required',
            'email' => 'required|email|unique:user,email',
            'password' => 'required|min:6',
            'status' => 'required',
        ]);
    
        $admin = User::create([
            'nama_lengkap' => $request->nama_lengkap,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'status' => $request->status,
        ]);
    
        return response()->json([
            'message' => 'Admin berhasil ditambahkan',
            'data' => $admin,
        ], 201);
    }
    
    
    public function show($id)
    {
        return User::where('id_user', $id)
            ->where('role', 'admin')
            ->firstOrFail();
    }

    public function update(Request $request, $id)
    {
        $admin = User::where('id_user', $id)
            ->where('role', 'admin')
            ->firstOrFail();
    
        $request->validate([
            'nama_lengkap' => 'required',
            'email' => 'required|email|unique:user,email,' . $id . ',id_user',
            'status' => 'required',
        ]);
    
        $admin->update($request->only('nama_lengkap', 'email', 'status'));
    
        return $admin;
    }
    

    public function destroy($id)
    {
        User::where('id_user', $id)
            ->where('role', 'admin')
            ->delete();

        return response()->json(['message' => 'Admin dihapus']);
    }
}
