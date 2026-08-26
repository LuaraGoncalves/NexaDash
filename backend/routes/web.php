<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'NexaDash API',
        'status' => 'online',
    ]);
});
