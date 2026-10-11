import { Injectable } from '@angular/core';

import { AuditLog } from '../../features/change-requests/models/change-request.models';

export const AUDIT_LOG_STORAGE_KEY = 'change-request-review.audit-logs';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  record(event: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const auditLog: AuditLog = {
      ...event,
      id: this.createId(),
      timestamp: new Date().toISOString(),
    };
    const logs = this.getLogs();
    localStorage.setItem(
      AUDIT_LOG_STORAGE_KEY,
      JSON.stringify([...logs, auditLog]),
    );
    return auditLog;
  }

  getLogs(): AuditLog[] {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isAuditLog)) {
      throw new Error('Audit log storage contains invalid data.');
    }

    return parsed.map((log) => ({ ...log }));
  }

  clear(): void {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  }

  private createId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return `audit-${globalThis.crypto.randomUUID()}`;
    }
    return `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function isAuditLog(value: unknown): value is AuditLog {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'string' &&
    typeof value['actorUserId'] === 'string' &&
    (value['action'] === 'user.created' ||
      value['action'] === 'user.create_failed') &&
    typeof value['targetUserId'] === 'string' &&
    typeof value['timestamp'] === 'string' &&
    typeof value['description'] === 'string' &&
    (value['outcome'] === 'success' || value['outcome'] === 'failure') &&
    (value['changedFields'] === undefined ||
      (Array.isArray(value['changedFields']) &&
        value['changedFields'].every(
          (field): field is string => typeof field === 'string',
        )))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
