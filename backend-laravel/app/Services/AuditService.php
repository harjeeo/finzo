<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    public function log(array $params): AuditLog
    {
        return AuditLog::create([
            'business_id' => $params['businessId'],
            'user_id' => $params['userId'] ?? null,
            'user_email' => $params['userEmail'] ?? null,
            'entity_type' => $params['entityType'],
            'entity_id' => $params['entityId'],
            'action' => $params['action'],
            'summary' => $params['summary'] ?? null,
            'changes' => $params['changes'] ?? null,
        ]);
    }

    public function findAll(string $businessId, array $filters = [])
    {
        return AuditLog::where('business_id', $businessId)
            ->when($filters['entityType'] ?? null, fn ($q, $v) => $q->where('entity_type', $v))
            ->when($filters['entityId'] ?? null, fn ($q, $v) => $q->where('entity_id', $v))
            ->when($filters['from'] ?? null, fn ($q, $v) => $q->where('created_at', '>=', $v))
            ->when($filters['to'] ?? null, fn ($q, $v) => $q->where('created_at', '<=', "{$v} 23:59:59.999"))
            ->orderByDesc('created_at')
            ->take(500)
            ->get();
    }
}
