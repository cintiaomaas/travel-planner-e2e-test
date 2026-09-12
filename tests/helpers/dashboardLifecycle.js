import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export default async function iniciarExecucaoDashboard() {
  // O caminho é herdado pelos workers, inclusive quando reiniciados após falhas.
  process.env.DASHBOARD_EXECUTION_FILE = path.join(tmpdir(), `travel-dashboard-${randomUUID()}.json`);
}

export async function lerViagemDaExecucao(chave = 'dashboard') {
  try {
    return JSON.parse(await readFile(arquivoViagem(chave), 'utf8'));
  } catch (erro) {
    if (erro.code === 'ENOENT') return null;
    throw erro;
  }
}

export async function registrarViagemDaExecucao(viagem, chave = 'dashboard') {
  await writeFile(arquivoViagem(chave), JSON.stringify(viagem), 'utf8');
}
export function arquivoViagem(chave = 'dashboard') {
  return chave === 'dashboard' ? process.env.DASHBOARD_EXECUTION_FILE : `${process.env.DASHBOARD_EXECUTION_FILE}.${chave}`;
}
