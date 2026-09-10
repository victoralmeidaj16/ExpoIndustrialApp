import { Redirect } from 'expo-router';

/**
 * Rota legada do cadastro do expositor.
 *
 * A tela vivia aqui em ~1.300 linhas praticamente idênticas às de
 * `expositor.tsx` — que é a versão mantida (mesmo formulário + leitor de
 * crachás). O arquivo continua existindo só para não quebrar os links
 * `/preencher` já distribuídos aos expositores.
 */
export default function PreencherRedirect() {
  return <Redirect href="/expositor" />;
}
