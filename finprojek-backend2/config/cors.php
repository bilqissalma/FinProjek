<?php

$allowedOrigins = array_values(
    array_filter(
        array_map(
            'trim',
            explode(
                ',',
                env(
                    'CORS_ALLOWED_ORIGINS',
                    'http://localhost:3000'
                )
            )
        )
    )
);

return [

    /*
    |--------------------------------------------------------------------------
    | CORS Paths
    |--------------------------------------------------------------------------
    */
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Methods
    |--------------------------------------------------------------------------
    */
    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    */
    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    */
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     * Karena autentikasi Anda menggunakan Bearer Token,
     * bukan cookie lintas domain.
     */
    'supports_credentials' => false,
];
