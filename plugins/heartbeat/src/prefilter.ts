import { loadConfig } from './config.js';
import { getDailySpend, getMessageCountSince } from './db.js';
import { PrefilterResult } from './types.js';
import { logger } from './logger.js';

export function isQuietHours(): boolean {
  const config = loadConfig();
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const current = hours * 60 + minutes;

  const [startH, startM] = config.quietHours.start.split(':').map(Number);
  const [endH, endM] = config.quietHours.end.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start > end) {
    return current >= start || current < end;
  }
  return current >= start && current < end;
}

export function isBudgetExceeded(): boolean {
  const config = loadConfig();
  const spent = getDailySpend();
  return spent >= config.dailyBudgetUsd;
}

export function isHighActivity(): boolean {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  return getMessageCountSince(fifteenMinAgo) >= 10;
}

export function runPrefilter(): PrefilterResult {
  const start = Date.now();
  const reasons: string[] = [];

  if (isBudgetExceeded()) {
    const durationMs = Date.now() - start;
    logger.info({ durationMs }, 'Prefilter: SKIP — daily budget exceeded');
    return { shouldEscalate: false, reason: 'budget_exceeded', context: '', durationMs };
  }

  if (isQuietHours()) {
    if (!isHighActivity()) {
      const durationMs = Date.now() - start;
      logger.info({ durationMs }, 'Prefilter: SKIP — quiet hours, no high activity');
      return { shouldEscalate: false, reason: 'quiet_hours', context: '', durationMs };
    }
    reasons.push('quiet_hours_but_high_activity');
  }

  let context = '';
  if (isHighActivity()) {
    reasons.push('high_activity');
    context += '<prefilter-context>High message activity detected in last 15 minutes.</prefilter-context>\n';
  }

  const durationMs = Date.now() - start;
  logger.info({ durationMs, shouldEscalate: true, reasons }, 'Prefilter: ESCALATE');

  return { shouldEscalate: true, reason: reasons.join(', ') || 'default', context, durationMs };
}
