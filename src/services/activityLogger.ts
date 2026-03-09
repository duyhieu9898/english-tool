/**
 * activityLogger.ts
 * Debug utility — fires-and-forgets log entries to server/activity_log.json
 */

import http from './http';

interface LogEntry {
  fn: string;       // function name
  lesson?: string;  // lessonId
  detail?: string;  // extra context
  data?: unknown;   // any payload
}

export function log(entry: LogEntry): void {
  http.post('/activityLog', entry).catch(() => {/* never throw */});
}

export function clearLog(): Promise<void> {
  return http.delete('/activityLog').then(() => {});
}
