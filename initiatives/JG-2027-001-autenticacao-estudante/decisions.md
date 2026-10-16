# Decisões — JG-2027-001 Autenticação simplificada do estudante

Registro de decisões relevantes e suas justificativas. Decisões listadas como **Proposta** ainda não
foram aprovadas.

## Decisões registradas

| # | Decisão | Situação | Justificativa | Fonte |
| --- | --- | --- | --- | --- |
| D1 | Manter o login por e-mail e senha como alternativa | Proposta | Evitar migração obrigatória e preservar contas existentes. | PRD §1, RN08 |
| D2 | O Admins continua sendo a origem do cadastro e da gestão de credenciais | Proposta | Identidade única e cadastro centralizado. | PRD §5, RN01–RN02 |
| D3 | Validação de QR Code e código visual sempre no servidor | Proposta | A leitura no cliente não é autenticação. | PRD §7.3, §12 |
| D4 | Revogar credencial e bloquear acesso são ações distintas | Proposta | Revogação afeta só os métodos simplificados; bloqueio afeta todos. | PRD §8.7, RN05–RN06 |
| D5 | A reemissão invalida a credencial anterior | Proposta | Evitar duas credenciais válidas simultaneamente. | PRD §8.5, RN07 |

## Observações para refinamento

- O protótipo navegável atual demonstra o código alternativo como **seis números**; o PRD prevê um
  **código visual com ícones espaciais**. Alinhar o protótipo à especificação antes de testes com estudantes.

## Decisões pendentes

As decisões pendentes estão listadas na seção 20 do PRD e espelhadas na aba **Dependências** da iniciativa.
