<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index()
    {
        return Lead::all();
    }

    public function store(Request $request)
    {
        $lead = Lead::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'status' => $request->status
        ]);

        return $lead;
    }

    public function update(Request $request, string $id)
    {
        $lead = Lead::findOrFail($id);

        $lead->update([
            'name' => $request->name ?? $lead->name,
            'phone' => $request->phone ?? $lead->phone,
            'email' => $request->email ?? $lead->email,
            'status' => $request->status ?? $lead->status,
        ]);

        return $lead;
    }
}
