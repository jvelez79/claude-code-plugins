import fs from 'fs';
import path from 'path';
import { GROUPS_DIR, MESSAGE_CONTEXT_LIMIT, estimateCost } from './config.js';
import { getGroup, storeMessage, getRecentMessages, logActivity } from './db.js';
import { executePrompt } from './executor.js';
import { notify } from './notifier.js';
import { logger } from './logger.js';

export async function handleIncomingMessage(
  jid: string,
  senderName: string,
  content: string,
  timestamp: string,
): Promise<void> {
  const group = getGroup(jid);
  if (!group || !group.active) return;

  storeMessage(jid, senderName, content, timestamp);

  if (!matchesTrigger(content, group.trigger)) return;

  logger.info({ group: group.folder, sender: senderName }, 'Trigger matched, processing message');

  const startTime = Date.now();

  try {
    const prompt = buildPrompt(group.id, group.folder, senderName, content);
    const result = await executePrompt(prompt, { model: group.model });

    if (result.stdout.trim()) {
      await notify(jid, result.stdout.trim());
    }

    logActivity({
      type: 'message',
      groupId: group.id,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: result.exitCode === 0 ? 'success' : 'error',
      summary: `Responded to ${senderName} in ${group.folder}`,
      costEstimate: estimateCost(result.durationMs),
    });
  } catch (err) {
    logger.error({ err, group: group.folder }, 'Error handling message');
    logActivity({
      type: 'message',
      groupId: group.id,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'error',
      summary: `Error: ${(err as Error).message}`,
      costEstimate: 0,
    });
  }
}

function matchesTrigger(content: string, trigger: string): boolean {
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\s)${escaped}\\b`, 'i');
  return pattern.test(content);
}

function buildPrompt(groupId: string, folder: string, senderName: string, currentMessage: string): string {
  const parts: string[] = [];

  const claudeMdPath = path.join(GROUPS_DIR, folder, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    parts.push(fs.readFileSync(claudeMdPath, 'utf-8'));
  }

  const recent = getRecentMessages(groupId, MESSAGE_CONTEXT_LIMIT);
  if (recent.length > 0) {
    const messagesXml = recent
      .map((m) => `<message sender="${escapeXml(m.senderName)}" time="${m.timestamp}">${escapeXml(m.content)}</message>`)
      .join('\n');
    parts.push(`<messages>\n${messagesXml}\n</messages>`);
  }

  parts.push(`<current-message sender="${escapeXml(senderName)}">${escapeXml(currentMessage)}</current-message>`);

  return parts.join('\n\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

