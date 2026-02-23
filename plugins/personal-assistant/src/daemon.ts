import { ensureDirectories } from './config.js';
import { initDatabase } from './db.js';
import { connectWhatsApp, onMessage } from './whatsapp.js';
import { handleIncomingMessage } from './router.js';
import { startScheduler, stopScheduler } from './scheduler.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  logger.info('Heartbeat daemon starting...');

  ensureDirectories();

  initDatabase();
  logger.info('Database initialized');

  onMessage((jid, senderName, content, timestamp) => {
    handleIncomingMessage(jid, senderName, content, timestamp).catch((err) =>
      logger.error({ err, jid }, 'Message handler error'),
    );
  });

  await connectWhatsApp();
  logger.info('WhatsApp connected');

  startScheduler();
  logger.info('Scheduler started');

  logger.info('Heartbeat daemon running. Press Ctrl+C to stop.');

  const shutdown = () => {
    logger.info('Shutting down...');
    stopScheduler();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'Daemon failed to start');
  process.exit(1);
});
