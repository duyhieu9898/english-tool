import mongoose from 'mongoose';
import { SystemLog } from '../models/SystemLog.js';

class Logger {
  constructor() {
    // No file directory creation or file handles needed anymore!
  }

  async _write(level, message, meta = {}) {
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

    // 1. Always output to Console (standard output is captured by Vercel/Lambda/docker logs)
    const logLine = `[${ts}] [${level}] ${message}${metaString}`;
    if (level === 'ERROR') {
      console.error(logLine);
    } else if (level === 'WARN') {
      console.warn(logLine);
    } else if (level === 'DEBUG') {
      console.debug(logLine);
    } else {
      console.log(logLine);
    }

    // 2. Save to MongoDB in a non-blocking fire-and-forget way if connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        let metaObj = {};
        if (meta instanceof Error) {
          metaObj = { name: meta.name, message: meta.message, stack: meta.stack };
        } else if (typeof meta === 'object' && meta !== null) {
          metaObj = meta;
        } else if (meta !== undefined) {
          metaObj = { value: meta };
        }

        // Capped collection in MongoDB automatically maintains the size/document limit
        await SystemLog.create({
          level,
          message,
          meta: metaObj
        });
      } catch (dbError) {
        // Log to console but do not throw or crash, to prevent cascading errors
        console.error('Failed to save log to MongoDB:', dbError.message);
      }
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
