import { spawn } from 'node:child_process';

function startProcess(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[run-all] ${name} exited with code ${code}`);
      process.exitCode = code;
    }
  });

  return child;
}

const server = startProcess('server', 'node', ['server.js']);
const worker = startProcess('worker', 'node', ['workers/notificationWorker.js']);

function shutdown() {
  if (!server.killed) {
    server.kill('SIGINT');
  }
  if (!worker.killed) {
    worker.kill('SIGINT');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
