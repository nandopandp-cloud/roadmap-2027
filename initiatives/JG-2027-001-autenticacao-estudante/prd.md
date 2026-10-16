# PRD — Login simplificado do estudante

**Jovens Gênios | Admins + Exploradores | Roadmap 2027**

| Campo | Valor |
| --- | --- |
| Status | Proposta para discovery e refinamento técnico |
| Tipo de iniciativa | Transversal — Produto, UX, Engenharia, Segurança e Dados |
| Público prioritário | Estudantes do Ensino Fundamental I, especialmente crianças em fase de alfabetização |
| Plataformas impactadas | Admins e Exploradores |
| Responsável pelo cadastro e gerenciamento de usuários | Admins |

## 1. Resumo executivo

A Jovens Gênios utiliza atualmente o Admins como plataforma central de cadastro e gerenciamento de usuários. O acesso convencional do estudante é realizado por e-mail e senha, exigindo que a criança saiba identificar, digitar e, eventualmente, recuperar suas credenciais.

Esse modelo cria uma barreira de acesso para estudantes dos anos iniciais, especialmente aqueles que ainda não dominam a leitura e a escrita. Na prática, a dificuldade de autenticação pode aumentar a dependência do professor, gerar interrupções nas atividades pedagógicas e dificultar a utilização autônoma do Exploradores.

A iniciativa propõe evoluir o modelo de autenticação do estudante, mantendo o cadastro centralizado no Admins e adicionando dois métodos de acesso simplificado:

- **QR Code individual:** o estudante utiliza sua carteirinha para iniciar o processo de autenticação.
- **Código visual espacial:** o estudante reproduz uma sequência individual de ícones temáticos do universo espacial da Jovens Gênios.

O login convencional por e-mail e senha permanecerá disponível como alternativa, sem exigir que todos os estudantes migrem obrigatoriamente para os novos métodos. O Admins será responsável pela emissão, visualização operacional, reemissão e controle de permissão das credenciais. O Exploradores será responsável por disponibilizar a experiência de entrada, validar o método escolhido por meio do serviço de autenticação e direcionar o estudante à sua conta.

A iniciativa deverá contemplar tanto estudantes já cadastrados quanto novos registros, incluindo cadastros individuais, importações em massa e alterações posteriores nos vínculos escolares.

**Resultado esperado:** permitir que o estudante acesse sua conta de maneira simples, rápida e adequada à sua faixa etária, sem comprometer a segurança, a integridade dos cadastros existentes ou a continuidade da experiência educacional.

## 2. Contexto e problema

O modelo atual de acesso pressupõe que o estudante consiga operar credenciais textuais. Essa premissa não corresponde à realidade de parte dos estudantes do Ensino Fundamental I.

A dificuldade não se limita à tela de login. Ela envolve a emissão e distribuição de credenciais, a associação correta entre estudante e conta, a troca de usuários em dispositivos compartilhados, o gerenciamento de acessos no ambiente escolar e os procedimentos administrativos para solucionar problemas.

Como o Admins concentra o cadastro dos estudantes, a solução não pode ser implementada apenas como uma alteração visual no Exploradores. É necessário estabelecer um fluxo consistente entre o cadastro, a geração de credenciais, a autenticação e o controle de acesso.

O projeto deverá resolver cinco problemas centrais:

1. **Acessibilidade:** permitir que crianças em fase de alfabetização acessem a plataforma sem depender da digitação de e-mail e senha.
2. **Autonomia:** reduzir a necessidade de intervenção do professor durante o login.
3. **Gestão:** permitir que a escola ou o administrador autorizado emita e substitua credenciais diretamente no Admins.
4. **Segurança:** garantir que cada método de acesso corresponda à conta correta e que credenciais bloqueadas ou substituídas não continuem autorizando novos acessos.
5. **Continuidade:** preservar os cadastros, vínculos escolares, permissões e históricos existentes durante a implantação.

## 3. Objetivos do produto

### 3.1 Objetivo principal

Implementar um modelo de autenticação simplificada para estudantes, integrado ao cadastro e ao gerenciamento de usuários do Admins, que permita acesso ao Exploradores por QR Code, código visual espacial ou e-mail e senha.

### 3.2 Objetivos específicos

- Reduzir a dificuldade de acesso dos estudantes em fase de alfabetização.
- Diminuir a necessidade de suporte do professor para iniciar uma sessão.
- Permitir emissão e reemissão de credenciais pelo Admins.
- Disponibilizar controle administrativo para permitir ou bloquear o acesso do estudante.
- Garantir compatibilidade com estudantes já cadastrados e com novos cadastros.
- Preservar o método de autenticação convencional para os estudantes que continuarem utilizando e-mail e senha.
- Instrumentar o fluxo para medir o sucesso da autenticação e identificar problemas de usabilidade.
- Criar uma estrutura que possa evoluir para outros contextos de acesso, sem exigir um novo cadastro para cada método.

### 3.3 Não objetivos

Não fazem parte do escopo inicial:

- Substituir ou reconstruir integralmente o módulo de cadastro de usuários do Admins.
- Alterar a experiência de autenticação de professores, gestores ou outros perfis que não sejam estudantes.
- Criar uma nova conta para estudantes que já possuam cadastro válido.
- Tornar o QR Code ou o código visual obrigatórios para todos os estudantes.
- Eliminar o login convencional por e-mail e senha.
- Criar um fluxo autônomo de recuperação de credenciais na interface administrativa.
- Alterar funcionalidades pedagógicas, conteúdos, avaliações, gamificação ou histórico de aprendizagem do Exploradores.
- Criar uma plataforma independente de gerenciamento de identidades sem antes avaliar a arquitetura de autenticação já existente.

## 4. Público-alvo e cenários de utilização

### 4.1 Estudante em fase de alfabetização

É o público prioritário. Precisa acessar a plataforma sem depender de leitura ou digitação de informações textuais complexas.

A experiência deve priorizar ícones grandes, instruções curtas, feedback visual e poucas decisões por tela.

### 4.2 Estudante que já utiliza e-mail e senha

Poderá continuar utilizando o método convencional. A adoção de uma credencial simplificada não deverá invalidar automaticamente seu acesso existente.

### 4.3 Professor ou responsável operacional pela turma

Precisa distribuir os cartões de acesso e orientar os estudantes. O gerenciamento da credencial propriamente dito deverá ocorrer no Admins por usuários autorizados, de acordo com suas permissões.

### 4.4 Administrador ou gestor escolar

Precisa consultar os estudantes sob sua responsabilidade, emitir credenciais, reemitir cartões e controlar a permissão de acesso, respeitando os limites de sua atuação na rede ou escola.

### 4.5 Equipe de suporte e operação

Precisa conseguir investigar falhas por meio de registros de autenticação e eventos administrativos, sem depender da visualização de senhas ou de segredos de autenticação.

## 5. Princípios de experiência e arquitetura

A iniciativa deverá seguir os seguintes princípios:

- **Identidade única.** Cada estudante continua sendo uma única entidade no ecossistema Jovens Gênios. Os métodos de autenticação são formas de acessar essa identidade, e não novos cadastros.
- **Cadastro centralizado.** O Admins continua sendo a origem administrativa dos dados do estudante e de seus vínculos escolares.
- **Separação de responsabilidades.** O Admins gerencia as credenciais e as permissões administrativas; o serviço de autenticação valida as credenciais e controla as sessões; o Exploradores oferece a experiência de entrada.
- **Segurança por padrão.** Nenhuma credencial deverá conter dados pessoais legíveis desnecessários. Revogação, reemissão e bloqueio precisam ser respeitados pelo servidor.
- **Acessibilidade infantil.** A experiência deve considerar crianças que ainda não leem, que têm dificuldade de reconhecer sequências ou que utilizam dispositivos compartilhados.
- **Compatibilidade.** Os métodos existentes não devem ser removidos como consequência da implantação do novo fluxo.
- **Operação simples.** O gerenciamento administrativo deverá privilegiar ações claras: emitir, reemitir e permitir ou bloquear acesso.

## 6. Solução proposta

A solução será composta por três elementos integrados.

### 6.1 Admins — Gestão de credenciais

O Admins será responsável por associar as credenciais ao estudante já cadastrado, disponibilizar a emissão do cartão, mostrar o status da credencial e permitir sua reemissão ou o bloqueio do acesso. A interface deverá incluir os dados necessários para identificar o estudante e seu contexto escolar, além de uma área específica de credenciais.

### 6.2 Serviço de autenticação

O serviço responsável pela autenticação deverá receber a tentativa de acesso, validar a credencial apresentada, verificar as permissões e o status do estudante e estabelecer uma sessão segura quando a validação for aprovada.

Essa responsabilidade deverá ser centralizada na arquitetura, mesmo que a primeira implementação utilize componentes do backend existente. O objetivo é evitar que cada plataforma implemente regras divergentes.

### 6.3 Exploradores — Entrada do estudante

O Exploradores deverá apresentar uma tela de acesso com três alternativas:

- Ler o QR Code da carteirinha.
- Utilizar o código visual espacial.
- Entrar com e-mail e senha.

Os dois primeiros métodos deverão receber maior destaque para o público dos anos iniciais. O login convencional permanecerá disponível como alternativa visível e acessível.

## 7. Experiência no Exploradores

### 7.1 Tela inicial de acesso

A tela deverá utilizar a identidade visual espacial da Jovens Gênios, com ilustrações, elementos do universo, paleta roxa e laranja e componentes adequados à experiência desktop e aos dispositivos utilizados pelas escolas.

O estudante deverá visualizar:

- Identidade visual da Jovens Gênios.
- Mensagem curta de boas-vindas.
- Botão principal para iniciar o acesso.
- Opções de autenticação simplificada.
- Alternativa de acesso convencional.

O fluxo não deverá apresentar uma opção de acesso como responsável ou professor nessa mesma jornada. O escopo é exclusivamente o acesso do estudante.

### 7.2 Escolha do método

Após iniciar o fluxo, o estudante deverá visualizar as opções:

- **Ler meu QR Code** — Abre a interface de leitura do QR Code da carteirinha.
- **Usar meu código de ícones** — Abre uma grade visual para reproduzir a sequência individual de símbolos espaciais.
- **E-mail e senha** — Abre o formulário convencional, mantendo a compatibilidade com as contas que utilizam esse método.

A escolha do método não deverá criar ou modificar a conta do estudante.

### 7.3 Acesso por QR Code

O estudante deverá posicionar a carteirinha diante da câmera do dispositivo.

O sistema deverá:

1. Solicitar acesso à câmera quando necessário.
2. Apresentar uma moldura visual para orientar o posicionamento do código.
3. Ler o QR Code.
4. Enviar a credencial identificada ao serviço de autenticação.
5. Validar o status da credencial e do estudante.
6. Criar a sessão autenticada quando autorizado.
7. Direcionar o estudante à área correspondente no Exploradores.

A leitura do QR Code, por si só, não deverá ser considerada uma autenticação concluída. A autorização deve ocorrer no servidor.

Caso a câmera esteja indisponível ou o QR Code não possa ser lido, o estudante deverá poder retornar à escolha do método e utilizar o código visual ou o login convencional.

Mensagens de erro deverão orientar a próxima ação sem apresentar informações técnicas ou detalhes que facilitem a exploração indevida de credenciais.

### 7.4 Acesso por código visual espacial

O código visual será uma sequência individual de ícones, gerada pelo sistema e apresentada na carteirinha.

A temática espacial deverá utilizar símbolos visualmente distintos, por exemplo:

- Foguete.
- Planeta.
- Estrela.
- Cometa.
- Capacete de astronauta.
- Alienígena.
- Lua.
- Satélite.

O conjunto definitivo de ícones deverá ser validado em testes de usabilidade com crianças. Os símbolos precisam ser reconhecíveis, distintos entre si e visualmente consistentes em diferentes tamanhos de tela.

O fluxo deverá permitir que o estudante selecione os símbolos na ordem apresentada em sua carteirinha. A sequência selecionada deverá ser exibida em uma área de conferência antes do envio.

Requisitos da interação:

- Apresentar os ícones em tamanho adequado para seleção.
- Mostrar a sequência selecionada e a ordem de escolha.
- Permitir remover ou substituir um ícone antes de entrar.
- Disponibilizar uma ação para limpar a sequência e começar novamente.
- Habilitar o botão de entrada somente quando a quantidade de símbolos exigida estiver preenchida.
- Validar a sequência no servidor.
- Exibir feedback claro em caso de sucesso ou falha.

A quantidade de símbolos e o tamanho do conjunto deverão ser definidos durante o refinamento técnico. A solução precisa equilibrar facilidade de memorização, velocidade de uso e resistência a tentativas de acesso indevidas.

O código visual deverá funcionar como uma credencial secreta. A combinação não poderá ser armazenada em texto puro ou exposta em logs.

### 7.5 Acesso por e-mail e senha

O fluxo convencional deverá permanecer disponível.

O estudante que selecionar essa opção será direcionado ao formulário já utilizado ou à experiência equivalente existente no Exploradores, respeitando a arquitetura atual de autenticação.

A implantação dos novos métodos não deverá:

- Alterar automaticamente o e-mail cadastrado.
- Redefinir a senha existente.
- Invalidar a sessão de usuários sem necessidade técnica.
- Criar uma segunda conta para o mesmo estudante.
- Exigir a emissão de uma carteirinha para continuar utilizando e-mail e senha.

### 7.6 Validação e retorno ao produto

Após a validação, o estudante deverá receber uma confirmação visual breve e ser direcionado à sua área no Exploradores.

O sistema deverá preservar o vínculo com a conta correta, incluindo dados escolares, histórico, atividades e demais informações já existentes.

A sessão autenticada deverá obedecer às políticas de duração, expiração e encerramento definidas pela arquitetura da plataforma.

## 8. Experiência no Admins

### 8.1 Ponto de entrada

A gestão de credenciais deverá ser incorporada ao cadastro existente do estudante no Admins.

Não deverá ser criado um cadastro paralelo ou uma nova entidade administrativa que duplique os dados de identidade do estudante.

A tela de detalhes do estudante deverá disponibilizar uma seção ou aba denominada **“Credencial de acesso”**, contendo as informações e ações necessárias.

### 8.2 Lista de estudantes

A listagem deverá permitir identificar rapidamente quais estudantes possuem credenciais emitidas e quais estão aptos a utilizar o novo método.

Novas informações deverão ser adicionadas à tabela existente, preservando os filtros, a pesquisa e as ações atuais.

Colunas propostas:

> _A tabela de colunas propostas não foi incluída na versão em texto recebida deste documento. Complete esta seção a partir do documento original._

A coluna de método de acesso deverá representar os métodos habilitados para a conta. Ela não deverá indicar que o estudante utilizou um método específico no último acesso, salvo quando essa informação estiver disponível no registro de autenticação.

As colunas de status da credencial e permissão de acesso deverão ser independentes. Um estudante pode possuir uma credencial emitida, mas estar bloqueado administrativamente. A implementação deverá avaliar a largura da tabela atual e utilizar recursos de visualização responsiva, seleção de colunas ou filtros quando necessário, sem comprometer a legibilidade.

### 8.3 Detalhes do estudante

A tela de detalhes deverá preservar os dados cadastrais e escolares existentes e adicionar a seção de credenciais.

Informações propostas:

- Nome e identificador do estudante.
- Escola e turma.
- Status cadastral.
- Status da credencial.
- Permissão de acesso.
- Métodos de autenticação habilitados.
- Data de emissão da credencial.
- Data da última reemissão.
- Último acesso bem-sucedido.
- Histórico de emissão, reemissão, bloqueio e alteração de permissão.

A interface não deverá exibir a senha convencional, o segredo original do QR Code ou o segredo utilizado para validar o código visual.

### 8.4 Emissão de credencial

A emissão deverá estar disponível para estudantes que ainda não possuam credencial simplificada. Ao selecionar “Emitir credencial”, o sistema deverá gerar uma credencial individual e preparar a carteirinha correspondente.

O cartão deverá apresentar:

- Identidade visual da Jovens Gênios.
- Nome do estudante, conforme política de identificação aprovada.
- Identificador operacional necessário para distribuição.
- QR Code individual.
- Sequência de ícones espaciais.
- Orientação simples de uso.
- Referência à escola ou turma quando necessária à operação.

A emissão deverá ser registrada no histórico administrativo.

A credencial deverá ser associada ao registro existente do estudante. A operação não deverá criar um novo usuário.

### 8.5 Reemissão de credencial

A reemissão será utilizada quando o estudante perder a carteirinha, esquecer a sequência ou precisar substituir uma credencial comprometida. Ao selecionar “Reemitir credencial”, o sistema deverá solicitar confirmação e, preferencialmente, o motivo da operação.

Após a confirmação:

- A credencial anterior deverá ser invalidada.
- O sistema deverá gerar um novo QR Code e uma nova sequência de ícones.
- A nova credencial deverá ser vinculada ao mesmo estudante.
- A carteirinha atualizada deverá ficar disponível para impressão.
- O histórico deverá registrar a ação, o responsável, a data e o motivo informado.

A reemissão não deverá alterar a identidade, o cadastro, a escola, a turma ou o histórico de aprendizagem do estudante.

A substituição deverá ser consistente no servidor, evitando que duas credenciais permaneçam válidas simultaneamente de maneira não intencional.

### 8.6 Permitir ou bloquear acesso

O Admins deverá disponibilizar um controle administrativo para permitir ou bloquear o acesso do estudante. O controle deverá ser independente da emissão da credencial.

- **Acesso permitido:** o estudante poderá autenticar-se por um método habilitado, desde que a credencial seja válida e as demais regras de autenticação sejam satisfeitas.
- **Acesso bloqueado:** o servidor deverá recusar novas autenticações para a conta, independentemente de o estudante apresentar um QR Code válido, a sequência correta de ícones ou e-mail e senha.

O bloqueio deverá preservar o cadastro e o histórico do estudante.

A interface deverá solicitar confirmação e registrar o responsável pela alteração, a data e o estado anterior e posterior da permissão. A implementação deverá definir o tratamento das sessões existentes após o bloqueio. A expectativa é que o bloqueio tenha efeito imediato ou dentro de um intervalo técnico explicitamente definido, sem depender apenas de uma nova tentativa de login.

### 8.7 Revogação da credencial

A revogação deverá invalidar a credencial simplificada atual, sem excluir o estudante ou seus dados.

A ação será diferente do bloqueio de acesso:

- **Revogar credencial:** invalida o QR Code e o código visual atuais.
- **Bloquear acesso:** impede a autenticação da conta por todos os métodos, inclusive e-mail e senha.

Essa distinção deverá estar clara na interface.

Se a credencial for revogada, o estudante poderá continuar utilizando e-mail e senha quando a conta estiver autorizada e esse método estiver habilitado. Caso o objetivo seja impedir completamente o acesso, o operador deverá bloquear a conta.

A interface não deverá oferecer uma ação genérica que misture os dois comportamentos.

### 8.8 Impressão e distribuição da carteirinha

A carteirinha deverá ser gerada em formato adequado para impressão e distribuição às escolas.

O sistema deverá permitir gerar o cartão individual e, se confirmado como necessário para a operação escolar, disponibilizar emissão em lote por turma ou seleção de estudantes.

A exportação deverá garantir que cada cartão corresponda ao estudante correto e que credenciais substituídas não sejam distribuídas inadvertidamente. Os arquivos gerados deverão ser tratados como material sensível, pois contêm informações de acesso. A disponibilidade, o armazenamento e o compartilhamento desses arquivos deverão seguir controles de autorização apropriados.

### 8.9 Histórico administrativo

O histórico deverá registrar, no mínimo:

- Emissão de credencial.
- Reemissão de credencial.
- Revogação de credencial.
- Alteração da permissão de acesso.
- Tentativas de autenticação, quando consultadas na visão de eventos de uso.

Cada evento administrativo deverá identificar o responsável, a data e hora, a operação executada, o estudante afetado e o resultado da ação.

O histórico deverá ser somente leitura para os perfis operacionais comuns, respeitando as permissões do Admins. Não deverá armazenar senhas, segredos completos de autenticação ou conteúdo integral de credenciais.

## 9. Requisitos funcionais

| ID | Requisito | Descrição |
| --- | --- | --- |
| RF01 | Preservar o cadastro existente | A solução deverá utilizar o registro atual do estudante como referência única para a emissão e validação das novas credenciais. |
| RF02 | Disponibilizar métodos simplificados | O Exploradores deverá oferecer QR Code e código visual espacial para estudantes elegíveis, preservando o login por e-mail e senha. |
| RF03 | Gerar credencial individual | O Admins deverá permitir emitir uma credencial simplificada para um estudante já cadastrado. |
| RF04 | Gerar carteirinha | O sistema deverá disponibilizar o cartão com QR Code e sequência de ícones correspondente à credencial ativa. |
| RF05 | Reemitir credencial | O Admins deverá permitir substituir a credencial anterior por uma nova, invalidando a anterior. |
| RF06 | Permitir ou bloquear acesso | O Admins deverá disponibilizar um controle administrativo que afete a autorização de autenticação no servidor. |
| RF07 | Revogar credencial | O sistema deverá invalidar a credencial simplificada sem excluir o cadastro ou o histórico do estudante. |
| RF08 | Validar QR Code | O serviço de autenticação deverá validar a credencial associada ao QR Code e as permissões do estudante antes de estabelecer a sessão. |
| RF09 | Validar código visual | O serviço de autenticação deverá validar a sequência enviada pelo Exploradores sem expor o segredo armazenado. |
| RF10 | Preservar e-mail/senha | Os métodos convencionais deverão continuar disponíveis conforme a configuração e o estado da conta. |
| RF11 | Integrar novos cadastros | O processo de cadastro de novos estudantes deverá permitir a emissão posterior ou automática de credenciais, conforme a decisão operacional aprovada. |
| RF12 | Integrar cadastros existentes | A solução deverá permitir habilitar estudantes já cadastrados sem duplicar contas ou alterar indevidamente seus dados. |
| RF13 | Registrar eventos | O sistema deverá registrar as operações de autenticação e as alterações administrativas relevantes. |
| RF14 | Respeitar permissões | Somente usuários autorizados poderão emitir, reemitir, revogar credenciais ou alterar a permissão de acesso. |
| RF15 | Tratar falhas de autenticação | O Exploradores deverá apresentar mensagens adequadas à idade do estudante e oferecer caminhos para tentar novamente ou selecionar outro método. |
| RF16 | Controlar sessões | O sistema deverá aplicar políticas de sessão e considerar a troca de estudante em dispositivos compartilhados. |
| RF17 | Disponibilizar filtros | O Admins deverá permitir localizar estudantes por status de credencial, permissão de acesso, escola e turma, além dos filtros existentes. |
| RF18 | Preservar vínculos | A emissão, reemissão ou revogação de credenciais não deverá alterar vínculos escolares ou históricos de aprendizagem. |
| RF19 | Garantir consistência | Falhas técnicas durante emissão, reemissão, revogação ou bloqueio não deverão deixar o cadastro em estado inconsistente. |
| RF20 | Suportar operação em lote, se aprovada | A emissão em lote deverá manter a associação inequívoca entre cada cartão e o estudante correspondente. |

## 10. Regras de negócio

| ID | Regra | Descrição |
| --- | --- | --- |
| RN01 | Identidade única | Cada estudante deverá possuir uma única identidade no ecossistema, independentemente do número de métodos de autenticação habilitados. |
| RN02 | Cadastro centralizado | O Admins continuará sendo a referência administrativa para o cadastro e os vínculos escolares. |
| RN03 | Credencial vinculada | Cada QR Code e cada sequência visual deverão estar vinculados a um único estudante e a uma versão específica da credencial. |
| RN04 | Independência entre credencial e cadastro | A revogação ou reemissão não poderá excluir o cadastro nem o histórico do estudante. |
| RN05 | Bloqueio global | O bloqueio de acesso deverá ser respeitado por todos os métodos de autenticação da conta. |
| RN06 | Revogação específica | A revogação de uma credencial simplificada não deverá ser confundida com o bloqueio global da conta. |
| RN07 | Substituição | A reemissão deverá invalidar a credencial anterior, evitando sua utilização posterior. |
| RN08 | Métodos alternativos | E-mail e senha permanecerão disponíveis para contas que utilizem esse método, desde que o acesso esteja permitido. |
| RN09 | Cadastro existente | Estudantes já cadastrados poderão receber credenciais simplificadas sem passar por um novo cadastro. |
| RN10 | Novo cadastro | A criação do estudante deverá continuar respeitando os fluxos atuais do Admins, com as novas informações de credencial adicionadas ao processo definido. |
| RN11 | Auditoria | Toda ação administrativa de emissão, reemissão, revogação ou alteração de permissão deverá ser registrada. |
| RN12 | Segurança dos segredos | O sistema não poderá armazenar senhas ou segredos de autenticação em texto puro. |
| RN13 | Distribuição do cartão | A emissão técnica não garante que o cartão tenha sido entregue ao estudante. A operação escolar deverá prever sua distribuição segura. |
| RN14 | Dispositivo compartilhado | A sessão de um estudante não poderá ser reaproveitada inadvertidamente por outro estudante que utilize o mesmo dispositivo. |
| RN15 | Privacidade | Os dados impressos na carteirinha deverão se limitar ao necessário para identificação operacional e acesso. |
| RN16 | Integridade cadastral | Alterações de escola, turma ou vínculo não deverão gerar automaticamente uma nova identidade para o estudante. |
| RN17 | Falha parcial | Operações que não puderem ser concluídas deverão informar o resultado real e permitir nova tentativa segura, sem duplicação de credenciais ativas. |
| RN18 | Permissões administrativas | O alcance de cada operação deverá respeitar a hierarquia de rede, escola, turma e estudante e os níveis de permissionamento existentes no Admins. |

## 11. Impactos no cadastro de usuários

A iniciativa deverá evoluir o cadastro atual do Admins, sem substituir sua estrutura central.

Será necessário avaliar se as novas informações devem ser adicionadas diretamente à entidade de usuário ou representadas por uma entidade de credencial relacionada ao estudante.

A recomendação é manter os dados de identidade separados dos dados de autenticação. O cadastro existente continuará armazenando os dados pessoais, identificadores e vínculos escolares. As credenciais deverão possuir seu próprio ciclo de vida.

A estrutura lógica deverá contemplar:

- Identificador do estudante.
- Métodos de autenticação habilitados.
- Status da credencial simplificada.
- Permissão global de acesso.
- Identificador interno da credencial.
- Data e responsável pela emissão.
- Data e responsável pela última reemissão.
- Data e responsável pela revogação, quando aplicável.
- Referência segura ao material necessário à validação.
- Histórico de alterações administrativas.

Os campos de credencial não deverão ser tratados como simples atributos cadastrais editáveis livremente. A emissão, a reemissão e a revogação deverão ocorrer por operações de negócio controladas no backend.

### 11.1 Novos cadastros

Para novos estudantes, o Admins deverá permitir que a credencial simplificada seja emitida após a criação e validação do cadastro.

A decisão entre emissão automática e emissão manual deverá considerar a operação escolar, a qualidade dos dados recebidos e a distribuição das carteirinhas.

Independentemente do modelo escolhido, o estudante deverá ser criado uma única vez. A emissão da credencial não deverá depender da criação de um segundo usuário.

### 11.2 Cadastros existentes

Para estudantes já cadastrados, deverá existir um processo de habilitação gradual.

A migração deverá:

- Identificar os estudantes elegíveis.
- Preservar os identificadores atuais.
- Evitar duplicação de registros.
- Permitir a emissão da credencial simplificada.
- Preservar o login por e-mail e senha.
- Registrar o status da nova credencial.
- Permitir que a operação seja retomada caso haja falha parcial.

A habilitação de uma credencial simplificada não deverá obrigar o estudante a utilizar imediatamente esse método.

### 11.3 Cadastros em massa

Se o Admins permitir importação ou atualização de estudantes em massa, o fluxo deverá ser avaliado para incluir a nova estrutura.

O sistema deverá distinguir a importação do estudante da emissão de sua credencial. A existência de um registro importado não deverá significar, por si só, que uma credencial válida foi emitida ou que o cartão foi distribuído.

O processamento em lote deverá gerar um resultado por estudante, permitindo identificar registros criados, atualizados, ignorados ou rejeitados e eventuais falhas de emissão.

## 12. Impactos técnicos e arquitetura

A solução deverá reutilizar a infraestrutura de autenticação existente sempre que tecnicamente viável, evitando a criação de mecanismos concorrentes.

O desenho técnico deverá separar quatro responsabilidades:

1. Cadastro e vínculos do estudante.
2. Emissão e gerenciamento de credenciais.
3. Validação de autenticação e criação de sessão.
4. Autorização de acesso às plataformas.

O Exploradores não deverá ser responsável por decidir isoladamente se uma credencial está válida. A decisão deverá ocorrer no backend.

### 12.1 QR Code

O QR Code deverá conter uma referência opaca ou um token aleatório de alta entropia, sem expor o identificador cadastral do estudante ou dados pessoais.

O backend deverá manter a associação entre a credencial e o estudante, com capacidade de validar o estado atual e invalidar credenciais substituídas.

A solução deverá considerar:

- Entropia adequada do token.
- Armazenamento seguro.
- Comunicação protegida.
- Limitação de tentativas indevidas.
- Revogação efetiva.
- Controle de sessões.
- Risco de fotografia e compartilhamento do cartão.

O QR Code impresso será uma credencial de acesso reutilizável enquanto permanecer válido. Essa característica deverá ser considerada na análise de risco, especialmente em dispositivos domésticos ou ambientes sem supervisão.

### 12.2 Código visual espacial

A sequência de ícones deverá ser tratada como um segredo de autenticação, e não apenas como uma preferência visual.

O sistema deverá definir o conjunto de símbolos, o comprimento da sequência, as regras de validação, o armazenamento protegido e os limites de tentativas.

A quantidade de símbolos disponíveis e o comprimento da sequência deverão oferecer um espaço de combinações suficiente para o risco previsto. O refinamento técnico deverá considerar também a facilidade de observação por terceiros, a previsibilidade das sequências e a possibilidade de ataques automatizados.

Não será suficiente validar a sequência somente no cliente. A validação deverá ocorrer no servidor.

### 12.3 Sessões e troca de estudantes

A arquitetura deverá considerar que tablets e computadores podem ser compartilhados por diversos estudantes.

A experiência deverá impedir que o estudante seguinte herde inadvertidamente a sessão anterior. Será necessário definir o comportamento de saída, troca de usuário, expiração da sessão e encerramento de sessões após bloqueio ou alteração de credencial.

### 12.4 Integração entre plataformas

A emissão de uma credencial no Admins deverá produzir um estado reconhecido pelo serviço de autenticação e pelo Exploradores.

O fluxo deverá ser consistente, com contratos de API definidos entre os componentes envolvidos.

A implantação deverá considerar ambientes de desenvolvimento, homologação e produção, além de observabilidade suficiente para diagnosticar falhas sem registrar segredos.

## 13. Permissões e governança no Admins

A implementação deverá respeitar os níveis de permissionamento existentes no Admins: **Administrador**, **Editor** e **Leitor**, bem como a hierarquia **Rede > Escola > Turma > Estudantes/Educadores**.

A matriz abaixo é uma proposta inicial, que deverá ser compatibilizada com a política atual de permissões antes da implementação.

> _A matriz de permissões não foi incluída na versão em texto recebida deste documento. Complete esta seção a partir do documento original._

O acesso deverá respeitar a abrangência organizacional do usuário. Um operador vinculado a uma escola não poderá gerenciar credenciais de estudantes fora de seu escopo autorizado.

A permissão para imprimir cartões merece atenção específica, pois o material contém credenciais que podem permitir o acesso ao Exploradores.

## 14. Segurança, privacidade e proteção de dados

A iniciativa envolve dados de crianças e credenciais de autenticação. O projeto deverá ser revisado pelas áreas responsáveis por segurança e privacidade antes da disponibilização em produção.

Requisitos mínimos:

- Não incluir dados pessoais desnecessários no QR Code.
- Não armazenar senhas ou segredos de autenticação em texto puro.
- Não registrar credenciais completas em logs.
- Aplicar limites de tentativas e controles contra automação.
- Proteger endpoints de emissão, reemissão, revogação e autenticação.
- Registrar ações administrativas com autoria e horário.
- Controlar a geração, exportação e distribuição de carteirinhas.
- Definir retenção e acesso aos registros de autenticação.
- Garantir que o bloqueio seja respeitado por todos os métodos.
- Avaliar riscos de observação e compartilhamento do código visual.
- Definir política para sessões ativas após revogação ou bloqueio.
- Considerar os princípios de proteção de dados aplicáveis a crianças, incluindo minimização e acesso restrito.

O uso de QR Code e código visual não deve ser considerado automaticamente seguro por ser simples para a criança. A segurança deverá ser demonstrada pelo desenho da credencial, pelas regras de validação e pelos controles do backend.

## 15. Métricas e instrumentação

A iniciativa deverá ser acompanhada por métricas de adoção, sucesso de autenticação, autonomia e impacto operacional.

### 15.1 Métrica principal proposta

**Taxa de acesso simplificado bem-sucedido**

Percentual de tentativas iniciadas pelos métodos simplificados que resultam em uma sessão autenticada válida.

```text
Taxa de sucesso = (Autenticações simplificadas bem-sucedidas ÷ Tentativas de autenticação simplificada) × 100
```

A métrica deverá ser acompanhada por método, plataforma e contexto de uso, respeitando a minimização de dados.

### 15.2 Indicadores complementares

- Tempo mediano entre o início do fluxo e a autenticação.
- Taxa de falha por método.
- Taxa de abandono antes da conclusão.
- Proporção de estudantes elegíveis com credencial emitida.
- Adoção do QR Code em relação ao código visual.
- Adoção do login convencional entre os estudantes elegíveis.
- Frequência de reemissão de credenciais.
- Volume de tentativas recusadas por credencial inválida ou revogada.
- Volume de chamados relacionados ao login.
- Proporção de acessos que exigem intervenção do professor.

A autonomia do estudante deverá ser avaliada por testes de usabilidade ou observação em contexto escolar. Não deverá ser inferida exclusivamente a partir dos eventos técnicos de autenticação.

### 15.3 Eventos sugeridos

Os nomes abaixo são referências para instrumentação e deverão ser compatibilizados com o padrão analítico adotado pela Jovens Gênios.

> _A tabela de eventos sugeridos não foi incluída na versão em texto recebida deste documento. Complete esta seção a partir do documento original._

Os eventos não deverão conter senhas, sequências visuais completas, tokens de QR Code ou dados pessoais desnecessários.

## 16. Critérios de aceite

### Cadastro e gestão

- [ ] O Admins permite emitir uma credencial simplificada para um estudante já cadastrado.
- [ ] A emissão não cria um novo registro de estudante.
- [ ] O cadastro mantém os vínculos existentes com rede, escola e turma.
- [ ] A listagem permite identificar o status da credencial e da permissão de acesso.
- [ ] O detalhe do estudante apresenta os métodos de acesso habilitados.
- [ ] A reemissão invalida a credencial anterior.
- [ ] A revogação invalida a credencial simplificada sem excluir a conta.
- [ ] O bloqueio de acesso impede a autenticação por todos os métodos.
- [ ] A reemissão e as alterações de permissão geram registros de auditoria.
- [ ] Usuários sem permissão não conseguem executar ações administrativas restritas.
- [ ] A emissão e a impressão de cartões respeitam as permissões aplicáveis.

### Acesso por QR Code

- [ ] O Exploradores permite iniciar a leitura do QR Code.
- [ ] Uma credencial válida e autorizada permite acesso à conta correta.
- [ ] Uma credencial revogada não permite autenticação.
- [ ] Uma conta bloqueada não permite autenticação, mesmo com QR Code válido.
- [ ] O fluxo apresenta alternativa quando a câmera está indisponível.
- [ ] O QR Code não expõe dados pessoais desnecessários.
- [ ] A validação e a autorização são executadas no servidor.

### Acesso por código visual

- [ ] O estudante consegue selecionar os ícones na ordem correta.
- [ ] O botão de entrada respeita a quantidade de símbolos definida.
- [ ] O estudante consegue limpar e refazer a sequência.
- [ ] Uma sequência válida e autorizada permite acesso à conta correta.
- [ ] Uma sequência inválida não cria uma sessão.
- [ ] A sequência completa não é registrada em logs ou eventos analíticos.
- [ ] Tentativas repetidas estão sujeitas aos controles de segurança definidos.

### Login convencional e continuidade

- [ ] O acesso por e-mail e senha permanece disponível.
- [ ] A emissão de credencial simplificada não altera automaticamente a senha existente.
- [ ] Estudantes existentes podem ser habilitados sem duplicação de cadastro.
- [ ] Novos cadastros seguem o fluxo administrativo vigente, acrescido das regras aprovadas para emissão.
- [ ] O histórico de aprendizagem permanece associado à identidade original.
- [ ] A troca de estudante em dispositivo compartilhado não reutiliza indevidamente a sessão anterior.

### Observabilidade

- [ ] Os eventos essenciais são registrados.
- [ ] As métricas distinguem os métodos de acesso.
- [ ] Falhas de autenticação podem ser investigadas sem expor credenciais.
- [ ] Os indicadores de sucesso e falha podem ser acompanhados após o lançamento.

## 17. Dependências

A execução da iniciativa depende de:

- Levantamento do fluxo atual de autenticação do Exploradores.
- Mapeamento do modelo de usuário e das relações cadastrais do Admins.
- Identificação dos endpoints de autenticação existentes.
- Definição do modelo de armazenamento e validação das credenciais.
- Revisão da matriz de permissões do Admins.
- Definição do processo de geração e impressão de carteirinhas.
- Validação de UX com estudantes e professores.
- Revisão de segurança e privacidade.
- Instrumentação dos eventos analíticos.
- Plano de migração e ativação gradual dos métodos simplificados.

## 18. Riscos e mitigações

| Risco | Descrição | Mitigação |
| --- | --- | --- |
| Compartilhamento do cartão | O QR Code impresso pode ser fotografado ou emprestado. | Credenciais revogáveis, controles de sessão, análise de risco e regras de uso adequadas ao contexto escolar. |
| Baixa segurança do código visual | Sequências curtas podem ser adivinhadas ou observadas. | Dimensionar o conjunto de ícones e o comprimento da sequência, aplicar limites de tentativa e validar a solução em análise de segurança. |
| Duplicação de estudantes | A implementação pode criar novos registros ao associar credenciais. | Utilizar o identificador existente e separar identidade de credencial. |
| Falhas de distribuição | Cartões podem ser entregues ao estudante errado ou continuar em circulação após reemissão. | Identificação operacional clara, invalidação da credencial anterior e processo escolar de distribuição. |
| Inconsistência entre plataformas | O Admins pode indicar credencial ativa enquanto o serviço de autenticação a considera inválida. | Fonte central de validação, contratos de API e observabilidade. |
| Impacto em usuários existentes | Mudanças de autenticação podem interromper acessos atuais. | Preservar o login convencional e realizar ativação gradual. |
| Complexidade operacional | A emissão em massa pode gerar cartões sem distribuição efetiva. | Separar status de emissão do status de entrega e definir responsabilidades operacionais. |

## 19. Plano de implantação sugerido

O cronograma abaixo é uma proposta de planejamento para 2027 e deverá ser ajustado conforme a capacidade técnica e os resultados de discovery.

### Q1 — Descoberta e definição

- Mapear a autenticação atual e os cadastros existentes.
- Definir o modelo de credencial.
- Validar a experiência visual com estudantes.
- Especificar os contratos de integração.
- Definir baseline de métricas e critérios de segurança.

### Q2 — Construção do MVP

- Evoluir o cadastro e a gestão de credenciais no Admins.
- Implementar emissão, reemissão, revogação e controle de acesso.
- Implementar QR Code e código visual no Exploradores.
- Preservar o login convencional.
- Instrumentar eventos e preparar homologação.

### Q3 — Piloto e validação

- Selecionar escolas e turmas para o piloto.
- Validar distribuição das carteirinhas.
- Medir sucesso, tempo, falhas e autonomia.
- Corrigir problemas de segurança e usabilidade.
- Decidir sobre expansão com base em critérios definidos previamente.

### Q4 — Expansão progressiva

- Ampliar a disponibilização para escolas elegíveis.
- Ajustar os processos operacionais de emissão e distribuição.
- Acompanhar indicadores de adoção e suporte.
- Priorizar melhorias conforme os resultados do piloto.

## 20. Decisões pendentes para refinamento

Antes de fechar o escopo de desenvolvimento, deverão ser resolvidas as seguintes decisões:

1. **Emissão automática ou manual:** novos estudantes receberão credencial automaticamente após o cadastro ou dependerão de uma ação explícita no Admins?
2. **Emissão em lote:** será requisito do MVP gerar carteirinhas para uma turma inteira ou essa capacidade poderá ser adicionada após o piloto?
3. **Código visual:** qual será o comprimento da sequência e o conjunto definitivo de ícones?
4. **QR Code:** qual será a política de validade, reemissão e proteção contra uso indevido?
5. **Bloqueio:** como as sessões já ativas deverão se comportar quando o acesso for bloqueado?
6. **Permissões:** quais perfis atuais do Admins poderão emitir, reemitir, revogar e bloquear, em cada nível da hierarquia?
7. **Cadastro existente:** qual será o mecanismo de habilitação dos estudantes atuais e como a operação será monitorada?
8. **Dispositivos compartilhados:** qual será a política de saída e troca de estudante?
9. **Impressão:** qual formato será adotado para a carteirinha e quais dados poderão aparecer nela?
10. **Métricas:** quais ferramentas e padrões existentes serão utilizados para instrumentação e análise?

## 21. Definição de sucesso

A iniciativa será considerada bem-sucedida quando o acesso simplificado estiver integrado ao Admins e ao Exploradores, os estudantes elegíveis conseguirem entrar com QR Code ou código visual, as contas existentes permanecerem íntegras e a operação escolar conseguir gerenciar as credenciais sem depender de processos manuais fora da plataforma.

O sucesso não será medido apenas pela disponibilização dos novos métodos, mas pela melhoria efetiva da experiência de acesso, pela redução das dificuldades operacionais e pela manutenção dos níveis de segurança e continuidade do serviço.

**Diretriz final:** o Admins continuará sendo responsável pelo cadastro e gerenciamento dos estudantes; a autenticação será uma capacidade integrada ao ecossistema; e o Exploradores oferecerá uma experiência de entrada adequada à idade do estudante. A iniciativa deverá evoluir o acesso sem fragmentar a identidade do usuário ou comprometer os fluxos existentes.
