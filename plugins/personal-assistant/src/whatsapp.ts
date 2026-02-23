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

export function onMessage(
  handler: (jid: string, senderName: string, content: string, timestamp: string) => void,
): void {
  messageHandler = handler;
}

export async function connectWhatsApp(): Promise<WASocket> {
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
        setTimeout(() => connectWhatsApp(), 5000);
      } else {
        logger.error('WhatsApp logged out. Re-run /heartbeat-start to re-authenticate.');
        process.exit(1);
      }
    }

    if (connection === 'open') {
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
      const timestamp = new Date(
        (msg.messageTimestamp as number) * 1000,
      ).toISOString();

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
