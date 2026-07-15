<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 6px; }
        th { background: #eee; }
    </style>
</head>
<body>

<h2>Laporan Keuangan</h2>
<p><strong>Proyek:</strong> {{ $proyek->nama_proyek }}</p>

<table>
    <thead>
        <tr>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Item</th>
            <th>Jumlah</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($laporan as $item)
        <tr>
            <td>{{ $item->tgl_transaksi }}</td>
            <td>{{ $item->spesifikasi }}</td>
            <td>{{ $item->nama_item }}</td>
            <td>Rp {{ number_format($item->jumlah_harga, 0, ',', '.') }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

</body>
</html>
