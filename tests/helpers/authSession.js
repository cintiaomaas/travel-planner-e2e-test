import { readFile, writeFile, rm } from 'node:fs/promises';
import { loginUsuarioExistente } from '../data/usuarios.js';
import { entrarNaAplicacao, abrirAplicacaoAutenticada } from '../pages/autenticacaoPage.js';

/** Lê a sessão temporária desta execução; retorna null se ainda não houve login. */
export async function lerSessaoAutenticada() {
  try {
    return JSON.parse(await readFile(process.env.E2E_AUTH_STATE_FILE, 'utf8'));
  } catch (erro) {
    if (erro.code === 'ENOENT') return null;
    throw erro;
  }
}

/** Salva cookies e localStorage do contexto autenticado fora do repositório. */
export async function salvarSessaoAutenticada(contexto) {
  await writeFile(process.env.E2E_AUTH_STATE_FILE,
    JSON.stringify(await contexto.storageState()), { encoding: 'utf8', mode: 0o600 });
}

/** Remove o arquivo de autenticação no encerramento, mesmo se ele não existir. */
export async function removerSessaoAutenticada() {
  await rm(process.env.E2E_AUTH_STATE_FILE, { force: true });
}

/**
 * Abre um contexto isolado e uma página com a sessão salva.
 * Sem sessão, faz login com loginUsuarioExistente e salva a autenticação.
 * Retorna { contexto, page }; quem chamou deve fechar contexto ao terminar.
 * Em caso de erro na preparação, fecha o contexto antes de propagar a falha.
 */
export async function criarContextoAutenticado(browser, baseURL) {
  const sessao = await lerSessaoAutenticada();
  const contexto = await browser.newContext({ baseURL, storageState: sessao ?? undefined });
  try {
    const page = await contexto.newPage();
    if (sessao) {
      await abrirAplicacaoAutenticada(page);
    } else {
      await entrarNaAplicacao(page, loginUsuarioExistente);
      await salvarSessaoAutenticada(contexto);
    }
    return { contexto, page };
  } catch (erro) {
    await contexto.close();
    throw erro;
  }
}
