import { execFile } from 'child_process';
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
