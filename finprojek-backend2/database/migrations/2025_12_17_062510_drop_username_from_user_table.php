<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up()
    {
        Schema::table('user', function (Blueprint $table) {
            if (Schema::hasColumn('user', 'username')) {
                $table->dropColumn('username');
            }
        });
    }

    public function down()
    {
        Schema::table('user', function (Blueprint $table) {
            $table->string('username')->nullable();
        });
    }
};
