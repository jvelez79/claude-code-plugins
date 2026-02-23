#!/usr/bin/env node
// Lists available WhatsApp groups from the authenticated session.
// Usage: node list-wa-groups.js
// Requires: daemon auth state at .claude/pa/heartbeat/store/auth/

const path = require('path');

const dataDir = process.env.HEARTBEAT_DATA_DIR
  || path.resolve(process.cwd(), '.claude', 'pa', 'heartbeat');
const authDir = path.join(dataDir, 'store', 'auth');

async function main() {
  const fs = require('fs');
  if (!fs.existsSync(path.join(authDir, 'creds.json'))) {
    console.error('No WhatsApp auth found. Run /heartbeat-start first to authenticate.');
    process.exit(1);
  }

  const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
  const pino = require('pino');

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  // Wait for connection
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout (15s). Is WhatsApp authenticated?'));
    }, 15000);

    sock.ev.on('connection.update', (update) => {
      if (update.connection === 'open') {
        clearTimeout(timeout);
        resolve();
      }
      if (update.connection === 'close') {
        clearTimeout(timeout);
        reject(new Error('Connection closed. Re-run /heartbeat-start to re-authenticate.'));
      }
    });
  });

  // Fetch groups
  const groups = await sock.groupFetchAllParticipating();
  const list = Object.entries(groups).map(([id, meta]) => ({
    jid: id,
    name: meta.subject,
    participants: meta.participants?.length || 0,
  }));

  // Sort by name
  list.sort((a, b) => a.name.localeCompare(b.name));

  // Output
  console.log(`Found ${list.length} groups:\n`);
  list.forEach((g, i) => {
    console.log(`${i + 1}. ${g.name}`);
    console.log(`   JID: ${g.jid}`);
    console.log(`   Participants: ${g.participants}`);
    console.log('');
  });

  // Also output as JSON for programmatic use
  console.log('---JSON---');
  console.log(JSON.stringify(list));

  sock.end(undefined);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
