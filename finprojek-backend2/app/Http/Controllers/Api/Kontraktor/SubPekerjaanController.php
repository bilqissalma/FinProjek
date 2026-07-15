<?php

namespace App\Http\Controllers\Api\Kontraktor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubPekerjaanController extends Controller
{
    public function indexByPekerjaan($idPekerjaan)
    {
        return DB::table('sub_pekerjaan')
            ->where('id_pekerjaan', $idPekerjaan)
            ->orderBy('id_sub')
            ->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_pekerjaan' => 'required|integer|exists:pekerjaan,id_pekerjaan',
            'nama_sub' => 'required|string|max:100',
            'tgl_mulai' => 'nullable|date',
        ]);

        $idSub = DB::table('sub_pekerjaan')->insertGetId([
            'id_pekerjaan' => $request->id_pekerjaan,
            'nama_sub' => $request->nama_sub,
            'tgl_mulai' => $request->tgl_mulai,
        ]);

        return response()->json([
            'message' => 'Sub pekerjaan berhasil ditambahkan',
            'id_sub' => $idSub,
        ], 201);
    }


    public function show($id)
    {
        $sub = DB::table('sub_pekerjaan')
            ->where('id_sub', $id)
            ->first();

        if (!$sub) {
            return response()->json(['message' => 'Sub pekerjaan tidak ditemukan'], 404);
        }

        return response()->json([
            'sub_pekerjaan' => $sub
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_sub' => 'required|string|max:100',
            'tgl_mulai' => 'nullable|date',
        ]);

        DB::table('sub_pekerjaan')
            ->where('id_sub', $id)
            ->update([
                'nama_sub' => $request->nama_sub,
                'tgl_mulai' => $request->tgl_mulai,
            ]);

        return response()->json([
            'message' => 'Sub pekerjaan berhasil diupdate'
        ]);
    }

    public function destroy($id)
    {
        DB::table('sub_pekerjaan')
            ->where('id_sub', $id)
            ->delete();

        return response()->json([
            'message' => 'Sub pekerjaan berhasil dihapus'
        ]);
    }
}
