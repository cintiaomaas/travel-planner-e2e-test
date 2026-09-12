import { unlink } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { excluirViagemDashboard } from '../pages/dashboardPage.js';
import { abrirAplicacaoAutenticada } from '../pages/autenticacaoPage.js';
import { lerViagemDaExecucao } from './dashboardLifecycle.js';
import { lerSessaoAutenticada } from './authSession.js';

export default async function encerrarExecucaoDashboard(config) {
  let browser;
  try {
    const viagem = await lerViagemDaExecucao();
    if (!viagem) return; // As demais suítes não criam esse registro.
    const sessao = await lerSessaoAutenticada();
    if (!sessao) throw new Error('Sessão do dashboard ausente para excluir a viagem.');
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ baseURL: config.projects[0].use.baseURL, locale: 'pt-BR', storageState: sessao });
    page.setDefaultTimeout(15_000);
    await abrirAplicacaoAutenticada(page);
    await excluirViagemDashboard(page, viagem);
    await unlink(process.env.DASHBOARD_EXECUTION_FILE);
    console.log('[Dashboard] Viagem da execução excluída e ausência confirmada no servidor.');
  } finally {
    if (browser) await browser.close();
  }
}
