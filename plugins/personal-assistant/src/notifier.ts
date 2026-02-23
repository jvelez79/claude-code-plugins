import { sendMessage } from './whatsapp.js';
import { logger } from './logger.js';

export async function notify(groupId: string, message: string): Promise<void> {
  try {
    await sendMessage(groupId, message);
  } catch (err) {
    logger.error({ err, groupId }, 'Failed to send notification');
  }
}
