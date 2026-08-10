<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Lead;
use App\Models\LeadMessage;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadMessageController extends Controller
{
    public function index(string $id)
    {
        $lead = Lead::findOrFail($id);

        return $lead->messages()
            ->get()
            ->map(fn (LeadMessage $message) => $this->formatMessage($message));
    }

    public function store(Request $request, string $id)
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'sender_type' => ['nullable', Rule::in(LeadMessage::SENDER_TYPES)],
            'sender_name' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);

        $senderType = $validated['sender_type'] ?? LeadMessage::SENDER_TEAM;
        $senderName = $validated['sender_name']
            ?? ($senderType === LeadMessage::SENDER_CUSTOMER
                ? $lead->name
                : $request->user()?->name ?? 'Equipe');

        $message = LeadMessage::create([
            'lead_id' => $lead->id,
            'user_id' => $senderType === LeadMessage::SENDER_TEAM ? $request->user()?->id : null,
            'sender_type' => $senderType,
            'sender_name' => $senderName,
            'message' => $validated['message'],
            'sent_at' => now(),
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'leads',
            "Mensagem enviada para lead: {$lead->name}",
            ['lead_id' => $lead->id, 'message_id' => $message->id]
        );

        return $this->formatMessage($message->fresh());
    }

    private function formatMessage(LeadMessage $message): array
    {
        return [
            'id' => $message->id,
            'lead_id' => $message->lead_id,
            'user_id' => $message->user_id,
            'sender_type' => $message->sender_type,
            'sender_name' => $message->sender_name,
            'message' => $message->message,
            'sent_at' => optional($message->sent_at)->toISOString(),
        ];
    }
}
