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
}
