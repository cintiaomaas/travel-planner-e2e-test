import { unlink } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { excluirViagemDashboard } from '../pages/dashboardPage.js';
import { abrirAplicacaoAutenticada } from '../pages/autenticacaoPage.js';
import { lerViagemDaExecucao, arquivoViagem } from './dashboardLifecycle.js';
import { lerSessaoAutenticada } from './authSession.js';

export default async function encerrarExecucaoDashboard(config, chave = 'dashboard') {
  let browser;
  try {
    const viagem = await lerViagemDaExecucao(chave);
    if (!viagem) return; // A suíte correspondente não foi executada.
    const sessao = await lerSessaoAutenticada();
    if (!sessao) throw new Error(`Sessão ausente para excluir a viagem de ${chave}.`);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ baseURL: config.projects[0].use.baseURL, locale: 'pt-BR', storageState: sessao });
    page.setDefaultTimeout(15_000);
    await abrirAplicacaoAutenticada(page);
    await excluirViagemDashboard(page, viagem);
    await unlink(arquivoViagem(chave));
    console.log(`[${chave}] Viagem da execução excluída e ausência confirmada no servidor.`);
  } finally {
    if (browser) await browser.close();
  }
}
