import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  step: string;
  message: string;
  data?: any;
}

export class ExtractionLogger {
  private logs: LogEntry[] = [];
  private startTime: number;
  private sessionId: string;
  private logDir: string;

  constructor(platform: string, url: string) {
    this.startTime = Date.now();
    this.sessionId = `${platform}_${Date.now()}`;
    this.logDir = path.join(process.cwd(), 'extraction_logs');

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.info('INIT', `Starting extraction for ${platform}`, { url });
  }

  private log(level: LogEntry['level'], step: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      step,
      message,
      data
    };

    this.logs.push(entry);

    // Console output with color
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m'    // Gray
    };
    const reset = '\x1b[0m';
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(
      `${colors[level]}[${elapsed}s] [${level.toUpperCase()}] [${step}]${reset} ${message}`
    );

    if (data) {
      console.log(`  ${JSON.stringify(data, null, 2)}`);
    }
  }

  info(step: string, message: string, data?: any) {
    this.log('info', step, message, data);
  }

  warn(step: string, message: string, data?: any) {
    this.log('warn', step, message, data);
  }

  error(step: string, message: string, data?: any) {
    this.log('error', step, message, data);
  }

  debug(step: string, message: string, data?: any) {
    this.log('debug', step, message, data);
  }

  async saveScreenshot(page: any, filename: string) {
    try {
      const screenshotPath = path.join(this.logDir, `${this.sessionId}_${filename}`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      this.info('SCREENSHOT', `Saved screenshot: ${filename}`, { path: screenshotPath });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.warn('SCREENSHOT', `Failed to save screenshot: ${filename}`, { error: message });
    }
  }

  async saveHTML(html: string, filename: string) {
    try {
      const htmlPath = path.join(this.logDir, `${this.sessionId}_${filename}`);
      fs.writeFileSync(htmlPath, html, 'utf-8');
      this.info('HTML_SAVE', `Saved HTML: ${filename}`, { path: htmlPath, size: html.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.warn('HTML_SAVE', `Failed to save HTML: ${filename}`, { error: message });
    }
  }

  async saveJSON(data: unknown, filename: string) {
    try {
      const jsonPath = path.join(this.logDir, `${this.sessionId}_${filename}`);
      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(jsonPath, content, 'utf-8');
      this.info('JSON_SAVE', `Saved JSON: ${filename}`, { path: jsonPath, size: content.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.warn('JSON_SAVE', `Failed to save JSON: ${filename}`, { error: message });
    }
  }

  async saveLogs() {
    try {
      const logPath = path.join(this.logDir, `${this.sessionId}_log.json`);
      const summary = {
        sessionId: this.sessionId,
        totalTime: ((Date.now() - this.startTime) / 1000).toFixed(2) + 's',
        logs: this.logs,
        summary: {
          total: this.logs.length,
          info: this.logs.filter(l => l.level === 'info').length,
          warn: this.logs.filter(l => l.level === 'warn').length,
          error: this.logs.filter(l => l.level === 'error').length,
          debug: this.logs.filter(l => l.level === 'debug').length
        }
      };

      fs.writeFileSync(logPath, JSON.stringify(summary, null, 2), 'utf-8');
      this.info('LOG_SAVE', `Saved logs to ${logPath}`);

      return logPath;
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  getSummary() {
    return {
      sessionId: this.sessionId,
      totalTime: ((Date.now() - this.startTime) / 1000).toFixed(2) + 's',
      totalLogs: this.logs.length,
      errors: this.logs.filter(l => l.level === 'error').length,
      warnings: this.logs.filter(l => l.level === 'warn').length
    };
  }
}
