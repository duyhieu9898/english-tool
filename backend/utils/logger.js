import fs from 'fs';
import path from 'path';
import { LOGS_DIR } from '../db/paths.js';

class Logger {
  constructor() {
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  }

  getTodayLogPath() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(LOGS_DIR, `${today}.log`);
  }

  _write(level, message, meta = {}) {
    const ts = new Date().toISOString();
    let metaString = '';
    
    if (Object.keys(meta).length > 0 || meta instanceof Error) {
      if (meta instanceof Error || meta.stack) {
        metaString = ` ${meta.stack || meta.message || meta}`;
      } else {

        try {
          metaString = ` ${JSON.stringify(meta)}`;
        } catch {
          metaString = ' [Unserializable Meta]';
        }
      }
    }

    const logLine = `[${ts}] [${level}] ${message}${metaString}\n`;
    
    try {
      this.ensureLogDir();
      fs.appendFileSync(this.getTodayLogPath(), logLine, 'utf8');
      
      // Also write to stdout if not in test/production environment (optional, keeping it simple for now)
      if (level === 'ERROR') {
        console.error(`[${level}] ${message}`, meta);
      } else {
        console.log(`[${level}] ${message}`, Object.keys(meta).length > 0 ? meta : '');
      }
    } catch (e) {
      console.error('Failed to write to log file:', e);
    }
  }

  info(message, meta) {
    this._write('INFO', message, meta);
  }

  warn(message, meta) {
    this._write('WARN', message, meta);
  }

  error(message, errorOrMeta) {
    this._write('ERROR', message, errorOrMeta);
  }

  debug(message, meta) {
    this._write('DEBUG', message, meta);
  }
}

export const logger = new Logger();
