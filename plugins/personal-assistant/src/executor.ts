import { execFile, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ExecutorResult } from './types.js';
import { logger } from './logger.js';

const DEFAULT_TIMEOUT = 300_000;
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';

export function executePrompt(
  prompt: string,
  options: {
    model?: string | null;
    timeout?: number;
    cwd?: string;
  } = {},
): Promise<ExecutorResult> {
  const startTime = Date.now();

  if (prompt.length > 100_000) {
    return executeViaStdin(prompt, options, startTime);
  }

  const args = ['-p', prompt, '--output-format', 'text'];

  if (options.model) {
    args.push('--model', options.model);
  }

  return new Promise((resolve) => {
    const child = execFile(
      CLAUDE_BIN,
      args,
      {
        timeout: options.timeout || DEFAULT_TIMEOUT,
        cwd: options.cwd || process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const exitCode = error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
          ? 1
          : (error as unknown as { code?: number })?.code ?? child.exitCode ?? 0;

        logger.info({ durationMs, exitCode, promptLen: prompt.length }, 'claude -p completed');

        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          exitCode: typeof exitCode === 'number' ? exitCode : 1,
          durationMs,
        });
      },
    );
  });
}

function executeViaStdin(
  prompt: string,
  options: { model?: string | null; timeout?: number; cwd?: string },
  startTime: number,
): Promise<ExecutorResult> {
  const tmpFile = path.join(os.tmpdir(), `heartbeat-prompt-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, prompt, 'utf-8');

  const args = ['-p', '-', '--output-format', 'text'];
  if (options.model) {
    args.push('--model', options.model);
  }

  return new Promise((resolve) => {
    const child = spawn(CLAUDE_BIN, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options.timeout || DEFAULT_TIMEOUT);

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }

      const durationMs = Date.now() - startTime;
      const exitCode = timedOut ? 1 : (code ?? 1);

      logger.info({ durationMs, exitCode, promptLen: prompt.length, viaStdin: true }, 'claude -p completed');

      resolve({ stdout, stderr, exitCode, durationMs });
    });

    const input = fs.createReadStream(tmpFile);
    input.pipe(child.stdin);
  });
}
