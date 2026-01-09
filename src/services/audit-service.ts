export interface AuditLogEntry {
    timestamp: number;
    action: string;
    userId?: string;
    details?: any;
}

class AuditService {
    private logs: AuditLogEntry[] = [];

    public log(action: string, details?: any, userId?: string) {
        const entry: AuditLogEntry = {
            timestamp: Date.now(),
            action,
            userId,
            details
        };

        this.logs.push(entry);

        // In a real app, this would send to a backend endpoint
        console.log(`[AUDIT] ${new Date(entry.timestamp).toISOString()} [${action}] User:${userId || 'ANON'}`, details || '');
    }

    public getLogs(): AuditLogEntry[] {
        return this.logs;
    }
}

export const auditService = new AuditService();
