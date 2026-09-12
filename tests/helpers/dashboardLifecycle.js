import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export default async function iniciarExecucaoDashboard() {
  // O caminho é herdado pelos workers, inclusive quando reiniciados após falhas.
  process.env.DASHBOARD_EXECUTION_FILE = path.join(tmpdir(), `travel-dashboard-${randomUUID()}.json`);
}

export async function lerViagemDaExecucao() {
  try {
    return JSON.parse(await readFile(process.env.DASHBOARD_EXECUTION_FILE, 'utf8'));
  } catch (erro) {
    if (erro.code === 'ENOENT') return null;
    throw erro;
  }
}

export async function registrarViagemDaExecucao(viagem) {
  await writeFile(process.env.DASHBOARD_EXECUTION_FILE, JSON.stringify(viagem), 'utf8');
}

