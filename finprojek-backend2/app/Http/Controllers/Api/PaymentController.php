<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function create(Request $request)
    {
        try {
            if (!auth()->check()) throw new Exception('USER BELUM LOGIN');

            Config::$serverKey = config('midtrans.server_key');
            Config::$isProduction = config('midtrans.is_production');
            Config::$isSanitized = true;
            Config::$is3ds = true;

            $user = auth()->user();

            $params = [
                'transaction_details' => [
                    'order_id' => 'ORDER-' . now()->timestamp . '-' . $user->id,
                    'gross_amount' => 99000,
                ],
                'customer_details' => [
                    'first_name' => $user->name,
                    'email' => $user->email,
                ],
            ];

            Log::info('MIDTRANS PARAMS', $params);

            $snapToken = Snap::getSnapToken($params);

            return response()->json([
                'snap_token' => $snapToken
            ]);

        } catch (Exception $e) {
            Log::error('MIDTRANS CREATE ERROR', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Endpoint untuk menandai user VIP
    public function markVip(Request $request)
    {
        if (!auth()->check()) return response()->json(['message' => 'Unauthorized'], 401);

        $user = auth()->user();
        $user->is_premium = 1; // misal 1 bulan
        $user->save();

        return response()->json(['message' => 'User upgraded to VIP']);
    }

    public function webhook(Request $request)
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');

        $notif = new Notification();

        if (in_array($notif->transaction_status, ['capture', 'settlement'])) {
            $parts = explode('-', $notif->order_id);
            $userId = $parts[2] ?? null; // note: user id ada di posisi ke-2

            if ($userId) {
                $user = User::find($userId);
                if ($user) {
                    $user->is_premium = 1; // 1 bulan
                    $user->save();
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
