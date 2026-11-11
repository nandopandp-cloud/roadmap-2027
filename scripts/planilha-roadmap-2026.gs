/**
 * Aviso de alteração da planilha "Roadmap - 2026/02" para o Roadmap JG.
 *
 * A cada alteração na planilha (valores, cores, linhas), avisa o app, que lê a planilha na hora e
 * aplica só o que mudou. Sem alteração, o app não lê a planilha.
 *
 * Instalação (uma vez, por alguém com permissão de edição na planilha):
 *  1. Na planilha: Extensões → Apps Script. Apague o conteúdo e cole este arquivo. Salve.
 *  2. Configurações do projeto (engrenagem) → Propriedades do script → Adicionar propriedade:
 *     ROADMAP_SYNC_SECRET = o mesmo valor configurado na Vercel.
 *  3. No editor, escolha a função "instalarAviso" e clique em Executar. Autorize o acesso.
 *  4. Para testar, escolha "testarAviso" e clique em Executar: o registro deve mostrar HTTP 200.
 */

const ROADMAP_URL = 'https://roadmap-2027.vercel.app/api/roadmap/2026/sincronizar';

/** Gatilho "Ao alterar": dispara em edições de valor e também de formatação (cores das semanas). */
function avisarRoadmap() {
  const segredo = PropertiesService.getScriptProperties().getProperty('ROADMAP_SYNC_SECRET');
  if (!segredo) throw new Error('Defina ROADMAP_SYNC_SECRET em Configurações do projeto → Propriedades do script.');
  const resposta = UrlFetchApp.fetch(ROADMAP_URL, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + segredo },
    muteHttpExceptions: true,
  });
  const status = resposta.getResponseCode();
  if (status !== 200) throw new Error('Roadmap respondeu HTTP ' + status + ': ' + resposta.getContentText().slice(0, 300));
  return resposta.getContentText();
}

/** Instala o gatilho (pode ser executada de novo: não duplica). */
function instalarAviso() {
  const planilha = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'avisarRoadmap')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('avisarRoadmap').forSpreadsheet(planilha).onChange().create();
}

/** Envia um aviso manual e mostra a resposta do app no registro de execução. */
function testarAviso() {
  console.log(avisarRoadmap());
}
