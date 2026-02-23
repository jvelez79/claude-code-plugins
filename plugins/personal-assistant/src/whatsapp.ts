import makeWASocket, {
  DisconnectReason,
  WASocket,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { AUTH_DIR } from './config.js';
import { logger } from './logger.js';

let sock: WASocket | null = null;
let messageHandler: ((jid: string, senderName: string, content: string, timestamp: string) => void) | null = null;
let reconnectAttempt = 0;

export function onMessage(
  handler: (jid: string, senderName: string, content: string, timestamp: string) => void,
): void {
  messageHandler = handler;
}

export async function connectWhatsApp(): Promise<WASocket> {
  if (sock) {
    sock.ev.removeAllListeners('creds.update');
    sock.ev.removeAllListeners('connection.update');
    sock.ev.removeAllListeners('messages.upsert');
    sock.end(undefined);
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode, shouldReconnect }, 'WhatsApp connection closed');

      if (shouldReconnect) {
        const delay = Math.min(5000 * Math.pow(2, reconnectAttempt), 300_000);
        reconnectAttempt++;
        logger.info({ delay, attempt: reconnectAttempt }, 'Scheduling reconnection');
        setTimeout(() => connectWhatsApp(), delay);
      } else {
        logger.error('WhatsApp logged out. Re-run /heartbeat-start to re-authenticate.');
        process.exit(1);
      }
    }

    if (connection === 'open') {
      reconnectAttempt = 0;
      logger.info('WhatsApp connected');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid) continue;

      const content =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';
      if (!content) continue;

      const senderName = msg.pushName || msg.key.participant || 'Unknown';
      const rawTs = msg.messageTimestamp;
      const tsNumber = typeof rawTs === 'number' ? rawTs : Number(rawTs);
      const timestamp = isNaN(tsNumber) ? new Date().toISOString() : new Date(tsNumber * 1000).toISOString();

      if (messageHandler) {
        messageHandler(jid, senderName, content, timestamp);
      }
    }
  });

  return sock;
}

export async function sendMessage(jid: string, text: string): Promise<void> {
  if (!sock) throw new Error('WhatsApp not connected');
  await sock.sendMessage(jid, { text });
}

export async function getAvailableGroups(): Promise<Array<{ id: string; subject: string }>> {
  if (!sock) throw new Error('WhatsApp not connected');
  const groups = await sock.groupFetchAllParticipating();
  return Object.entries(groups).map(([id, meta]) => ({
    id,
    subject: meta.subject,
  }));
}

export function getSocket(): WASocket | null {
  return sock;
}
