# PRD: Batalhas Solo e Versus (VS) | Geniex

**Produto:** Geniex (Jovens Gênios)  
**Funcionalidade:** Batalhas Solo e Versus  
**Versão:** 2.0  
**Status:** Proposta consolidada para refinamento com Produto, Design e Engenharia  
**Data:** Outubro de 2026  
**Público-alvo:** Estudantes da plataforma Geniex  
**Plataforma:** Experiência do estudante  
**Personagem oficial do modo Solo:** Nexo

---

# 1. Propósito, objetivos e estratégia

## 1.1. Contexto e visão do produto

A funcionalidade de Batalhas da Geniex tem como objetivo transformar a resolução de questões educacionais em uma experiência competitiva, divertida e recorrente, incentivando os estudantes a praticarem seus conhecimentos por meio de desafios individuais ou disputas com outros estudantes.

A experiência será dividida em duas modalidades:

- **Batalha Solo:** o estudante enfrenta o Nexo, personagem oficial das Batalhas da Geniex, em uma sequência de 10 questões. O resultado é determinado pela quantidade de respostas corretas.
- **Batalha Versus (VS):** o estudante desafia outro estudante elegível, da mesma sala ou escola e do mesmo ano escolar. Cada participante responde às suas 10 questões, e o resultado é definido pela comparação das notas.

Em ambas as modalidades, antes de iniciar o quiz, o estudante deverá selecionar de uma a três disciplinas e, obrigatoriamente, um único tópico para cada disciplina selecionada.

Independentemente da quantidade de disciplinas escolhidas, cada rodada será composta por exatamente 10 questões, com limite máximo de 10 minutos para conclusão.

A distribuição das questões deverá respeitar os tópicos selecionados, garantindo pelo menos três questões de cada tópico escolhido. A ordem e a quantidade de questões por tópico poderão variar aleatoriamente, respeitando essa regra.

Ao concluir a rodada ou atingir o limite de tempo, o estudante receberá sua nota e poderá consultar o gabarito, identificando suas respostas corretas e incorretas.

No modo VS, o resultado competitivo definitivo dependerá da conclusão das duas rodadas ou do encerramento por W.O. O estudante desafiado terá até 24 horas para responder ao desafio.

A funcionalidade também contemplará revanche e histórico das disputas, incentivando a continuidade da experiência e a recorrência de uso.

## 1.2. Problema do usuário

A resolução tradicional de questões pode ser percebida como repetitiva, individual e pouco estimulante. O estudante nem sempre encontra motivos para continuar praticando conteúdos além das atividades obrigatórias propostas pela escola ou pelo professor.

Além disso, a ausência de desafios entre colegas reduz as oportunidades de transformar a prática educacional em uma experiência social e competitiva.

As Batalhas buscam resolver esses problemas por meio de:

- Prática de conteúdos escolhidos pelo próprio estudante.
- Disputas individuais e entre colegas.
- Limite de tempo que adiciona dinamismo à experiência.
- Feedback imediato sobre o desempenho individual.
- Gabarito para apoiar a aprendizagem após a rodada.
- Revanche e histórico para incentivar a continuidade das disputas.

## 1.3. Objetivos de negócio

1. Aumentar o engajamento dos estudantes na Geniex.
2. Incentivar a frequência de acesso e a recorrência de uso.
3. Aumentar o volume de questões respondidas voluntariamente.
4. Estimular a competição saudável entre estudantes.
5. Incentivar a prática de diferentes disciplinas e tópicos.
6. Ampliar a percepção da Geniex como uma plataforma de aprendizagem interativa.
7. Criar uma base para futuras mecânicas de gamificação e reconhecimento.

## 1.4. Objetivos do usuário

- Iniciar uma batalha sem depender de um professor.
- Escolher as disciplinas e os tópicos que deseja praticar.
- Testar seus conhecimentos em uma experiência de até 10 minutos.
- Desafiar colegas da mesma etapa escolar.
- Conhecer sua nota ao concluir a rodada.
- Descobrir o resultado final da disputa.
- Consultar o gabarito para compreender seus erros e acertos.
- Solicitar revanche após o encerramento de uma disputa.

## 1.5. Métricas de sucesso

| Indicador | Definição |
|---|---|
| Taxa de adesão | Percentual de estudantes elegíveis que iniciam pelo menos uma batalha. |
| Batalhas iniciadas | Quantidade de batalhas iniciadas por período. |
| Taxa de conclusão | Percentual de rodadas finalizadas dentro do prazo ou concluídas antecipadamente. |
| Taxa de estouro de tempo | Percentual de rodadas encerradas pelo limite de 10 minutos. |
| Taxa de resposta aos desafios | Percentual de desafios VS respondidos dentro de 24 horas. |
| Taxa de W.O. | Percentual de desafios VS encerrados por ausência de resposta. |
| Taxa de revanche | Percentual de disputas elegíveis que geram uma nova batalha. |
| Diversidade de conteúdos | Distribuição de batalhas entre disciplinas e tópicos disponíveis. |
| Taxa de acerto | Percentual de respostas corretas nas rodadas. |
| Uso do gabarito | Percentual de estudantes que consultam o gabarito após a rodada. |
| Recorrência | Percentual de estudantes que participam de batalhas em mais de um dia ou período de análise. |

As metas quantitativas deverão ser definidas após o levantamento da linha de base.

---

# 2. Discovery: premissas, critérios e restrições

## 2.1. Premissas do produto

1. A funcionalidade estará disponível para estudantes autenticados na Geniex.
2. Cada batalha terá exatamente 10 questões por participante.
3. O estudante deverá selecionar no mínimo uma e no máximo três disciplinas.
4. Cada disciplina selecionada deverá possuir exatamente um tópico escolhido pelo estudante.
5. Não será permitido iniciar uma batalha sem ao menos uma disciplina e seu respectivo tópico.
6. Cada rodada terá duração máxima de 10 minutos.
7. O cronômetro começará quando o estudante iniciar efetivamente a rodada de questões.
8. Ao atingir o limite de tempo, a rodada será encerrada automaticamente.
9. Questões não respondidas no encerramento serão contabilizadas como incorretas.
10. A nota corresponderá à quantidade de respostas corretas, variando de 0 a 10.
11. No modo Solo, o adversário será o Nexo, personagem oficial da Geniex.
12. No modo VS, o resultado definitivo dependerá da comparação das notas ou do encerramento por W.O.
13. O desafiado terá até 24 horas para concluir sua rodada.
14. O gabarito ficará disponível após a conclusão ou o encerramento por tempo da rodada individual.
15. Os resultados deverão ser calculados e persistidos no servidor.

## 2.2. Seleção de disciplinas e tópicos

A seleção de conteúdo será uma etapa obrigatória antes do início do quiz, tanto na Batalha Solo quanto na Batalha VS.

### Regras de seleção

| Regra | Comportamento esperado |
|---|---|
| Mínimo de disciplinas | 1 |
| Máximo de disciplinas | 3 |
| Tópicos por disciplina | Exatamente 1 |
| Início sem disciplina | Não permitido |
| Disciplina sem tópico | Não permitido |
| Quantidade total de questões | Sempre 10 por participante |
| Questões mínimas por tópico selecionado | 3 |
| Ordem das questões | Aleatória |
| Distribuição por tópico | Aleatória, respeitando o mínimo de 3 questões por tópico |

A seleção deverá apresentar apenas disciplinas e tópicos disponíveis para o estudante conforme o catálogo de conteúdos da Geniex e os critérios de elegibilidade pedagógica.

### Exemplo de configuração

O estudante seleciona:

- Artes → Movimentos artísticos contemporâneos.
- História → República no Brasil (1889–1930).
- Matemática → Funções do 1º grau.

A plataforma deverá gerar 10 questões distribuídas entre os três tópicos, garantindo pelo menos três questões de cada um.

A configuração será considerada válida somente quando todas as disciplinas selecionadas tiverem um tópico associado.

## 2.3. Regra de distribuição das questões

Independentemente de o estudante selecionar uma, duas ou três disciplinas, o total será sempre de 10 questões.

A distribuição deverá seguir as seguintes regras:

- Com uma disciplina selecionada, as 10 questões deverão pertencer ao único tópico escolhido.
- Com duas disciplinas selecionadas, cada tópico deverá receber pelo menos três questões, e as quatro questões restantes poderão ser distribuídas entre os tópicos.
- Com três disciplinas selecionadas, cada tópico deverá receber pelo menos três questões. As questões restantes poderão ser distribuídas entre os tópicos.
- A quantidade de questões por tópico poderá variar entre batalhas.
- A ordem das questões deverá ser aleatória.
- A geração deverá garantir que o total seja exatamente 10.
- Nenhum tópico selecionado poderá receber menos de três questões.

A aleatoriedade não poderá violar os limites mínimos ou produzir uma rodada com quantidade diferente de 10 questões.

**Premissa de implementação:** a geração da rodada deverá validar previamente a disponibilidade de questões suficientes para atender à distribuição. Se não houver questões suficientes para uma configuração válida, a plataforma deverá informar a indisponibilidade e orientar o estudante a alterar a seleção, sem iniciar uma batalha inválida.

## 2.4. Regra de tempo

Cada estudante terá no máximo 10 minutos para responder às 10 questões da própria rodada.

O tempo será individual: no modo VS, o cronômetro de um participante não dependerá do cronômetro do outro.

Ao atingir 10 minutos:

1. A rodada será encerrada automaticamente.
2. As respostas já registradas serão preservadas.
3. As questões não respondidas serão classificadas como incorretas.
4. A nota será calculada com base nas respostas registradas.
5. O estudante será direcionado para o resultado individual.
6. O gabarito da rodada será disponibilizado.

Não haverá extensão automática do tempo. O comportamento em caso de falha de conexão deverá ser tratado pelas regras técnicas de persistência e retomada definidas neste PRD.

## 2.5. Regras de pontuação

Cada questão terá o mesmo peso.

- Resposta correta: 1 ponto.
- Resposta incorreta: 0 pontos.
- Questão não respondida: 0 pontos.
- Nota mínima: 0.
- Nota máxima: 10.

A nota representa o número de respostas corretas, e não um percentual. O percentual de aproveitamento poderá ser exibido como informação complementar, calculado sobre as 10 questões.

## 2.6. Batalha Solo: critérios de resultado

| Acertos | Resultado |
|---:|---|
| 7 a 10 | Vitória do estudante |
| 5 a 6 | Empate |
| 0 a 4 | Derrota do estudante |

O resultado será apresentado imediatamente após a conclusão ou o encerramento automático da rodada.

## 2.7. Batalha Versus: critérios de resultado

- O estudante seleciona um oponente elegível.
- O desafio é registrado.
- O desafiante realiza sua rodada.
- O desafiado realiza sua própria rodada dentro do prazo de 24 horas.
- Cada participante terá seu próprio limite de 10 minutos.
- Quando ambos concluírem, as notas serão comparadas.
- Maior nota: vitória do participante com melhor desempenho.
- Notas iguais: empate.
- Se o desafiado não concluir no prazo de 24 horas, o desafiante vence por W.O.

O prazo de 24 horas do desafio e o limite de 10 minutos da rodada são regras distintas. O primeiro controla a disponibilidade do desafio; o segundo controla a duração da participação individual.

## 2.8. Justiça competitiva e equivalência das questões

Para garantir uma comparação justa no modo VS, recomenda-se que os participantes recebam conjuntos distintos, mas equivalentes em conteúdo e dificuldade, dentro dos tópicos selecionados.

Os dois participantes deverão competir com base na mesma configuração de disciplinas e tópicos definida para a disputa.

A composição deverá respeitar:

- Exatamente 10 questões por participante.
- Os mesmos tópicos selecionados para a batalha.
- Pelo menos três questões por tópico.
- Distribuição e ordem potencialmente diferentes.
- Critérios de pontuação idênticos.

Como o gabarito ficará disponível após a rodada individual, a plataforma não deverá reutilizar automaticamente as mesmas questões e respostas na rodada ainda pendente do oponente.

A estratégia de equivalência pedagógica deverá ser validada com Produto e a área pedagógica antes do desenvolvimento.

## 2.9. Elegibilidade dos oponentes

A seleção de oponentes deverá considerar:

- Estudantes da mesma sala ou escola, conforme a regra de vínculo validada.
- Estudantes do mesmo ano escolar.
- Estudantes autorizados a utilizar a funcionalidade.
- Estudantes que possam ser identificados por nome de exibição e avatar ou representação visual permitida.

O sistema deverá validar a elegibilidade no momento da criação do desafio.

---

# 3. Funcionalidades

## 3.1. Entrada na área de Batalhas

**Descrição:** disponibilizar uma área dedicada às Batalhas, apresentando as modalidades Solo e VS.

**Prioridade:** P0.

**Critérios de aceite:**

- A área apresenta as duas modalidades.
- A Batalha Solo identifica o Nexo como adversário oficial.
- A Batalha VS comunica a possibilidade de desafiar outro estudante.
- Cada modalidade possui uma ação clara de entrada.
- A interface apresenta estados de carregamento, erro e indisponibilidade.
- O layout respeita o design system vigente da Geniex.

## 3.2. Seleção da modalidade

**Descrição:** permitir que o estudante escolha entre Batalha Solo e Batalha VS.

**Prioridade:** P0.

**Critérios de aceite:**

- A seleção da modalidade direciona o estudante ao fluxo correspondente.
- Ambas as modalidades utilizam a mesma regra de seleção de disciplinas e tópicos.
- O modo Solo apresenta o Nexo como adversário.
- O modo VS direciona à seleção de oponente e à criação do desafio.

## 3.3. Seleção de disciplinas e tópicos

**Descrição:** permitir que o estudante configure os conteúdos que deseja praticar antes de iniciar a batalha.

**Prioridade:** P0.

**Critérios de aceite:**

- O estudante consegue selecionar de uma a três disciplinas.
- A interface indica visualmente quais disciplinas estão selecionadas.
- Ao selecionar uma disciplina, o estudante deve escolher um tópico correspondente.
- A plataforma permite somente um tópico por disciplina.
- O estudante consegue alterar o tópico selecionado antes de iniciar.
- O estudante consegue remover uma disciplina e seu tópico correspondente.
- A interface informa a quantidade máxima de três disciplinas.
- A ação de iniciar permanece indisponível enquanto não houver ao menos uma disciplina com tópico válido.
- A plataforma informa que serão geradas 10 questões no total, independentemente da quantidade de disciplinas.
- A interface informa que cada tópico selecionado terá pelo menos três questões.
- A configuração é validada novamente no servidor antes da geração da rodada.

## 3.4. Geração da rodada de questões

**Descrição:** gerar as 10 questões da batalha de acordo com as disciplinas e os tópicos selecionados.

**Prioridade:** P0.

**Critérios de aceite:**

- A rodada possui exatamente 10 questões.
- Todas as questões pertencem aos tópicos selecionados.
- Cada tópico recebe pelo menos três questões.
- A ordem das questões é aleatória.
- A quantidade de questões por tópico pode variar entre rodadas válidas.
- A distribuição nunca viola a quantidade mínima por tópico.
- A plataforma não inicia uma rodada se não conseguir atender às regras de composição.
- A configuração e o conjunto de questões são persistidos para garantir consistência durante a rodada.

## 3.5. Batalha Solo: personagem oficial Nexo

**Descrição:** permitir que o estudante enfrente o Nexo em uma rodada de 10 questões.

**Prioridade:** P0.

**Critérios de aceite:**

- O Nexo é apresentado como adversário oficial do modo Solo.
- O estudante recebe as questões conforme os tópicos escolhidos.
- A rodada possui cronômetro de até 10 minutos.
- A plataforma registra as respostas.
- Ao concluir as 10 questões ou atingir o limite de tempo, a plataforma calcula a nota.
- O resultado é apresentado imediatamente.
- O estudante consegue consultar o gabarito.
- A rodada não pode ser finalizada mais de uma vez.

## 3.6. Cronômetro e encerramento automático

**Descrição:** controlar o tempo disponível para cada rodada.

**Prioridade:** P0.

**Critérios de aceite:**

- O cronômetro começa quando o estudante inicia a rodada.
- O tempo máximo é de 10 minutos.
- O cronômetro é individual para cada participante.
- O sistema encerra a rodada ao atingir o limite.
- As respostas registradas são preservadas.
- As questões não respondidas são consideradas incorretas.
- A nota é calculada após o encerramento.
- A plataforma apresenta o resultado individual e libera o gabarito.
- O encerramento não depende de uma ação manual do estudante.
- O controle de tempo é validado no servidor, não apenas no navegador.

## 3.7. Apuração do resultado Solo

**Descrição:** determinar o resultado individual com base no total de acertos.

**Prioridade:** P0.

**Critérios de aceite:**

- De 7 a 10 acertos: vitória.
- De 5 a 6 acertos: empate.
- De 0 a 4 acertos: derrota.
- Questões não respondidas são contabilizadas como erradas.
- A nota e o resultado são consistentes entre a tela de conclusão e o histórico.

## 3.8. Seleção de oponente para Batalha VS

**Descrição:** apresentar uma lista de estudantes elegíveis para receber desafios.

**Prioridade:** P0.

**Critérios de aceite:**

- São exibidos apenas estudantes elegíveis.
- O oponente deve pertencer à mesma sala ou escola, conforme a regra validada.
- O oponente deve estar no mesmo ano escolar.
- A interface apresenta cards com informações visuais permitidas.
- A seleção direciona à confirmação do desafio.
- A plataforma apresenta um estado vazio quando não houver oponentes disponíveis.
- A lista contempla estados de carregamento e erro.

## 3.9. Criação e envio do desafio VS

**Descrição:** permitir que o estudante selecione um oponente e envie um desafio.

**Prioridade:** P0.

**Critérios de aceite:**

- O estudante consegue confirmar o oponente escolhido.
- O desafio registra os participantes, a configuração de disciplinas e tópicos e a data/hora de criação.
- O prazo de 24 horas começa após o registro válido do desafio.
- A plataforma confirma o envio ao desafiante.
- O desafiado consegue identificar a batalha pendente.
- O sistema impede duplicações acidentais causadas por requisições repetidas.
- O desafio mantém a configuração de conteúdos definida para aquela disputa.

## 3.10. Rodada VS do desafiante

**Descrição:** permitir que o desafiante realize sua participação.

**Prioridade:** P0.

**Critérios de aceite:**

- O desafiante responde a 10 questões.
- A rodada respeita os tópicos definidos para a batalha.
- O estudante tem até 10 minutos.
- A nota é apresentada ao concluir a rodada ou ao atingir o limite.
- O gabarito fica disponível após o encerramento individual.
- Se o oponente ainda não concluiu, o resultado competitivo aparece como pendente.
- A conclusão é persistida no servidor.

## 3.11. Rodada VS do desafiado

**Descrição:** permitir que o desafiado responda às suas 10 questões dentro das 24 horas disponíveis.

**Prioridade:** P0.

**Critérios de aceite:**

- O desafio pendente identifica o desafiante e o prazo.
- O desafiado recebe a mesma configuração de disciplinas e tópicos da batalha.
- A plataforma gera uma rodada compatível com as regras de distribuição e equivalência.
- O desafiado tem até 10 minutos para concluir.
- A nota e o gabarito são disponibilizados após o encerramento individual.
- A plataforma compara as notas após a conclusão das duas rodadas.
- Após o encerramento definitivo por W.O., o estudante não consegue alterar o resultado concluindo uma rodada tardia.

## 3.12. Apuração do resultado VS

**Descrição:** comparar as notas dos participantes após a conclusão das duas rodadas.

**Prioridade:** P0.

**Critérios de aceite:**

- A comparação ocorre somente quando as duas rodadas estiverem encerradas.
- Maior nota: vitória do participante com melhor desempenho.
- Notas iguais: empate.
- O resultado é disponibilizado aos dois participantes.
- O resultado permanece consistente no histórico.
- Resultados definitivos não podem ser alterados por novas requisições de conclusão.

## 3.13. Encerramento por W.O.

**Descrição:** encerrar automaticamente o desafio quando o desafiado não concluir sua rodada dentro de 24 horas.

**Prioridade:** P0.

**Critérios de aceite:**

- O prazo é calculado a partir do registro válido do desafio.
- Se o desafiado não concluir dentro do prazo, o sistema encerra a disputa.
- O desafiante recebe vitória por W.O., independentemente de sua nota.
- O motivo é identificado explicitamente como W.O.
- O desafiado não consegue iniciar ou finalizar uma rodada que altere o resultado encerrado.
- O mecanismo de expiração funciona mesmo quando nenhum participante está conectado.
- O histórico registra o horário e o motivo do encerramento.

## 3.14. Exibição do gabarito

**Descrição:** disponibilizar as questões, as respostas selecionadas e as respostas corretas após o encerramento individual da rodada.

**Prioridade:** P0.

**Critérios de aceite:**

- O gabarito fica disponível após a conclusão das 10 questões ou o encerramento por tempo.
- As 10 questões são apresentadas.
- Cada questão identifica se foi respondida corretamente ou incorretamente.
- A resposta selecionada pelo estudante é exibida quando houver uma resposta registrada.
- A resposta correta é identificada claramente.
- Questões não respondidas são identificadas como não respondidas e contabilizadas como incorretas.
- O gabarito não depende da conclusão da rodada do oponente.
- A consulta ao gabarito de um participante não revela as respostas da rodada ainda pendente do outro.
- O gabarito permanece acessível pelo histórico, conforme as regras de retenção definidas.

## 3.15. Revanche

**Descrição:** permitir que os participantes iniciem uma nova disputa após o encerramento da batalha anterior.

**Prioridade:** P1, a confirmar no planejamento do MVP.

**Critérios de aceite:**

- A opção é apresentada após um resultado definitivo.
- A revanche cria uma nova batalha.
- O histórico anterior permanece intacto.
- O estudante realiza uma nova seleção de disciplinas e tópicos.
- A nova rodada respeita o limite de 10 minutos.
- O novo desafio possui prazo próprio de 24 horas para resposta.
- A revanche respeita os critérios de elegibilidade vigentes.

## 3.16. Histórico de batalhas

**Descrição:** permitir consultar desafios pendentes e disputas anteriores.

**Prioridade:** P1, a confirmar no planejamento do MVP.

**Critérios de aceite:**

- O estudante visualiza batalhas pendentes.
- O estudante consulta batalhas concluídas.
- Cada registro apresenta modalidade, oponente ou personagem, disciplinas, nota e resultado quando disponíveis.
- Resultados pendentes são identificados como tal.
- Resultados por W.O. são diferenciados dos resultados por comparação de notas.
- O histórico permite acessar os gabaritos das rodadas encerradas.

---

# 4. User flow: fluxos de navegação

## 4.1. Fluxo geral

1. O estudante acessa a Geniex.
2. Entra na área de Batalhas.
3. Escolhe Batalha Solo ou Batalha VS.
4. Segue o fluxo específico da modalidade.
5. Seleciona as disciplinas e os tópicos.
6. Inicia a rodada de questões.
7. Responde às questões dentro do limite de 10 minutos.
8. Recebe a nota individual.
9. Consulta o gabarito.
10. Visualiza o resultado competitivo quando disponível.
11. Pode solicitar revanche após o encerramento definitivo.

## 4.2. Fluxo da Batalha Solo

1. O estudante seleciona Batalha Solo.
2. Visualiza a introdução da disputa com o Nexo.
3. Seleciona de uma a três disciplinas.
4. Escolhe um tópico para cada disciplina.
5. Confirma a configuração.
6. A plataforma valida a disponibilidade e gera as 10 questões.
7. O estudante inicia a rodada.
8. O cronômetro de 10 minutos começa.
9. O estudante responde às questões.
10. Ao responder à décima questão ou atingir o limite de tempo, a rodada é encerrada.
11. As respostas registradas são corrigidas.
12. Questões não respondidas são contabilizadas como erradas.
13. A plataforma apresenta a nota de 0 a 10.
14. O resultado é calculado:
    - 7 a 10 acertos: vitória.
    - 5 a 6 acertos: empate.
    - 0 a 4 acertos: derrota.
15. O estudante consulta o gabarito.
16. Retorna à área de Batalhas ou inicia outra disputa.

## 4.3. Fluxo da Batalha VS: desafiante

1. O estudante seleciona Batalha VS.
2. Visualiza os oponentes elegíveis.
3. Seleciona um colega.
4. Seleciona de uma a três disciplinas.
5. Escolhe um tópico para cada disciplina.
6. Confirma o desafio.
7. A plataforma registra o desafio e inicia o prazo de 24 horas.
8. O desafiante inicia sua rodada, quando disponível no fluxo.
9. O cronômetro de 10 minutos começa.
10. O estudante responde às 10 questões ou tem sua rodada encerrada pelo limite de tempo.
11. A plataforma calcula e apresenta a nota.
12. O estudante consulta o gabarito.
13. Se o oponente ainda não concluiu, o resultado competitivo aparece como pendente.
14. Quando o oponente concluir, a plataforma compara as notas e apresenta o resultado definitivo.
15. Caso o prazo expire sem conclusão do desafiado, o desafiante recebe vitória por W.O.
16. Após o encerramento, o estudante pode solicitar revanche.

## 4.4. Fluxo da Batalha VS: desafiado

1. O estudante identifica um desafio pendente.
2. Visualiza o desafiante, as disciplinas, os tópicos e o prazo disponível.
3. Inicia a rodada dentro das 24 horas.
4. O cronômetro individual de 10 minutos começa.
5. O estudante responde às 10 questões ou tem a rodada encerrada automaticamente.
6. A plataforma calcula a nota.
7. O estudante consulta o gabarito.
8. A plataforma compara as notas dos participantes.
9. O resultado definitivo é apresentado.
10. O estudante pode solicitar revanche após o encerramento.

## 4.5. Fluxo de encerramento por tempo

1. O estudante inicia a rodada.
2. O cronômetro começa.
3. O tempo atinge 10 minutos antes de todas as questões serem respondidas.
4. A plataforma encerra a rodada automaticamente.
5. As respostas registradas são preservadas.
6. As questões sem resposta são classificadas como incorretas.
7. A nota é calculada.
8. O resultado individual é apresentado.
9. O gabarito fica disponível.

## 4.6. Fluxo de W.O.

1. Um estudante envia um desafio VS.
2. O desafiado não conclui sua rodada dentro de 24 horas.
3. O prazo expira.
4. A plataforma encerra a disputa.
5. O desafiante recebe vitória por W.O.
6. O histórico registra o motivo e o horário.
7. Os participantes podem iniciar uma nova disputa se continuarem elegíveis.

## 4.7. Estados da batalha VS

| Estado | Descrição |
|---|---|
| Aguardando participação | Desafio criado e aguardando a rodada do desafiado. |
| Rodada do desafiante em andamento | O desafiante está respondendo às questões. |
| Rodada do desafiado em andamento | O desafiado está respondendo às questões. |
| Aguardando resultado | Uma rodada foi encerrada, mas a outra ainda está pendente. |
| Concluída: vitória | Um participante obteve a maior nota. |
| Concluída: derrota | O participante obteve a menor nota. |
| Concluída: empate | Ambos obtiveram a mesma nota. |
| Concluída: W.O. | O desafiado não concluiu dentro do prazo. |
| Indisponível ou cancelada | Estado excepcional sujeito a regras adicionais. |

Os estados da batalha e os estados das rodadas individuais deverão ser modelados separadamente quando necessário, evitando combinações contraditórias.

---

# 5. Delivery: requisitos funcionais e técnicos

## 5.1. Requisitos funcionais

**RF-01 (Acesso):** disponibilizar a área de Batalhas para estudantes autorizados.

**RF-02 (Modalidade):** permitir selecionar Solo ou VS.

**RF-03 (Seleção de disciplinas):** exigir de uma a três disciplinas por batalha.

**RF-04 (Seleção de tópicos):** exigir exatamente um tópico para cada disciplina selecionada.

**RF-05 (Validação):** impedir o início sem disciplinas e tópicos válidos.

**RF-06 (Geração de questões):** gerar exatamente 10 questões por rodada, respeitando os tópicos selecionados e o mínimo de três questões por tópico.

**RF-07 (Aleatoriedade):** randomizar a ordem das questões e a distribuição válida entre os tópicos.

**RF-08 (Registro de respostas):** persistir as respostas fornecidas pelo estudante.

**RF-09 (Cronômetro):** limitar cada rodada a 10 minutos.

**RF-10 (Encerramento automático):** encerrar a rodada ao atingir o limite e contabilizar questões não respondidas como incorretas.

**RF-11 (Cálculo de nota):** calcular a nota de 0 a 10 no servidor.

**RF-12 (Resultado Solo):** aplicar os critérios de vitória, empate e derrota.

**RF-13 (Seleção de oponente):** listar estudantes elegíveis para o modo VS.

**RF-14 (Criação de desafio):** registrar participantes, disciplinas, tópicos, data/hora e prazo.

**RF-15 (Resultado VS):** comparar as notas após o encerramento das duas rodadas.

**RF-16 (W.O.):** encerrar desafios não respondidos em 24 horas.

**RF-17 (Gabarito):** disponibilizar respostas selecionadas, respostas corretas e situação de cada questão.

**RF-18 (Revanche):** permitir iniciar uma nova batalha após o encerramento, conforme as regras definidas.

**RF-19 (Histórico):** permitir consultar batalhas anteriores e pendentes.

**RF-20 (Persistência):** preservar notas, respostas, gabaritos e resultados após o encerramento.

## 5.2. Regras de geração e distribuição

O serviço responsável pela geração das rodadas deverá:

1. Receber a configuração validada de disciplinas e tópicos.
2. Verificar a disponibilidade de questões para cada tópico.
3. Garantir pelo menos três questões por tópico.
4. Gerar exatamente 10 questões.
5. Distribuir as questões restantes aleatoriamente.
6. Randomizar a ordem de apresentação.
7. Persistir o conjunto gerado para a rodada.
8. Garantir que a mesma rodada não receba uma composição diferente durante sua execução.

O mecanismo de aleatoriedade deverá respeitar os critérios de distribuição e não poderá depender exclusivamente de decisões tomadas no cliente.

## 5.3. Regras de tempo e persistência

O cronômetro deverá ser controlado com base em referências temporais confiáveis do servidor.

A plataforma deverá armazenar o início da rodada e calcular o encerramento com base no limite de 10 minutos.

As respostas deverão ser registradas de forma persistente ao longo da rodada, de modo que falhas temporárias não provoquem perda indevida de respostas já confirmadas.

A conclusão por tempo deverá ser idempotente: chamadas repetidas não poderão gerar notas ou resultados diferentes.

O comportamento para perda de conexão, retomada da sessão e troca de dispositivo deverá ser definido no refinamento técnico, preservando o limite máximo de tempo e a integridade das respostas.

## 5.4. Regras de consistência e integridade

- Notas não podem ser alteradas pelo cliente.
- O sistema não pode aceitar respostas após o encerramento definitivo da rodada.
- A mesma rodada não pode gerar múltiplos resultados.
- O resultado final da batalha não pode ser alterado após o encerramento.
- Requisições repetidas de envio ou conclusão devem ser tratadas de forma idempotente.
- O gabarito deve respeitar as permissões e o estado da rodada.
- Um estudante não pode responder em nome do oponente.
- A elegibilidade do oponente deve ser validada no servidor.
- A revanche deve criar uma nova batalha.
- A composição de questões de uma rodada deve permanecer consistente após sua geração.

## 5.5. Requisitos não funcionais

### Desempenho

- A navegação entre as telas deverá ser responsiva.
- A nota individual deverá ser apresentada logo após o encerramento.
- A seleção de disciplinas e tópicos deverá suportar os catálogos disponíveis sem comprometer a experiência.
- O histórico deverá suportar paginação ou carregamento progressivo quando necessário.

### Disponibilidade e confiabilidade

- Respostas e resultados deverão ser persistidos de forma confiável.
- Falhas de conexão não deverão gerar confirmação falsa de conclusão.
- O controle de tempo e o W.O. deverão funcionar sem depender de o estudante estar conectado.

### Segurança

- A autorização para acessar e responder a uma batalha deverá ser validada no servidor.
- O cliente não poderá alterar notas, respostas corretas ou prazos.
- Dados pessoais deverão ser limitados ao necessário para a disputa.
- O acesso ao gabarito deverá respeitar as regras de autorização.

### Acessibilidade

- Acerto, erro, vitória e derrota não deverão ser comunicados apenas por cores.
- Os componentes deverão ser compatíveis com os recursos de acessibilidade aplicáveis à Geniex.
- Os textos deverão ser adequados à faixa etária dos estudantes.
- O cronômetro deverá ter uma apresentação visual clara.

### Compatibilidade

A experiência deverá respeitar os dispositivos, navegadores e breakpoints suportados pela Geniex.

## 5.6. Eventos e instrumentação analítica

Eventos recomendados:

- `battle_area_viewed`
- `battle_mode_selected`
- `battle_subject_selected`
- `battle_topic_selected`
- `battle_configuration_completed`
- `battle_configuration_invalid`
- `battle_questions_generated`
- `solo_battle_started`
- `versus_challenge_created`
- `versus_challenge_received`
- `battle_question_answered`
- `battle_timer_expired`
- `battle_round_completed`
- `battle_unanswered_questions_counted`
- `solo_battle_result_viewed`
- `versus_result_viewed`
- `versus_battle_expired`
- `versus_battle_wo_awarded`
- `battle_answer_key_viewed`
- `battle_rematch_started`

Os eventos deverão incluir atributos necessários para análise, como modalidade, disciplinas selecionadas, tópicos selecionados, duração da rodada, quantidade de respostas corretas, quantidade de questões não respondidas e resultado final, respeitando as políticas de privacidade e governança de dados.

## 5.7. Dependências

- Autenticação e identificação de estudantes.
- Dados de vínculo escolar, sala e ano escolar.
- Catálogo de disciplinas e tópicos.
- Banco de questões com gabaritos.
- Metadados para identificar a disciplina e o tópico de cada questão.
- Regras pedagógicas para distribuição e equivalência de questões.
- Infraestrutura de persistência de respostas.
- Controle de tempo e encerramento automático.
- Mecanismo de expiração de desafios e W.O.
- Sistema de notificações, caso disponível.
- Design system vigente da Geniex.

## 5.8. Orientações para Design

O Design deverá contemplar:

- Entrada da área de Batalhas.
- Cards de Solo e VS.
- Introdução à Batalha Solo com o Nexo.
- Seleção de oponentes para VS.
- Seleção de uma a três disciplinas.
- Seleção obrigatória de um tópico por disciplina.
- Estados de seleção, limite máximo e configuração inválida.
- Confirmação da configuração.
- Interface do quiz com cronômetro de 10 minutos.
- Indicador de progresso das 10 questões.
- Estados de questão respondida, não respondida e selecionada.
- Encerramento automático por tempo.
- Resultados de vitória, empate e derrota.
- Resultado pendente do modo VS.
- Resultado por W.O.
- Gabarito.
- Revanche.
- Histórico.
- Estados vazios, carregamento, indisponibilidade e erro.

A experiência deverá manter a identidade visual da Geniex, utilizando o Nexo como personagem oficial do modo Solo e preservando uma abordagem de competição saudável e educacional.

---

# 6. Roadmap e estratégia de entrega

## Fase 1: Validação de regras

**Objetivo:** validar as regras de negócio e as principais dependências.

Entregáveis:

- Validação da seleção de disciplinas e tópicos.
- Definição do algoritmo de distribuição das questões.
- Validação da equivalência pedagógica entre rodadas VS.
- Definição do início e do encerramento do cronômetro.
- Definição das regras para falhas de conexão.
- Validação dos critérios de W.O.
- Priorização final do MVP.

## Fase 2: UX/UI e especificação

**Objetivo:** transformar os requisitos em uma experiência pronta para implementação.

Entregáveis:

- Fluxos detalhados.
- Wireframes e interfaces de alta fidelidade.
- Protótipo navegável.
- Seleção de disciplinas e tópicos.
- Estados de cronômetro e progresso.
- Especificação das telas de resultado e gabarito.
- Critérios de aceite por tela.
- Handoff de Design para Engenharia.

## Fase 3: Núcleo da Batalha Solo

**Objetivo:** viabilizar a configuração e a execução de batalhas individuais.

Entregáveis:

- Entrada da área de Batalhas.
- Introdução ao Nexo.
- Seleção de disciplinas e tópicos.
- Geração das 10 questões.
- Distribuição e randomização.
- Cronômetro de 10 minutos.
- Registro de respostas.
- Cálculo de nota.
- Resultado Solo.
- Gabarito.

## Fase 4: Batalha Versus

**Objetivo:** habilitar disputas entre estudantes.

Entregáveis:

- Listagem de oponentes elegíveis.
- Criação de desafios.
- Configuração compartilhada de disciplinas e tópicos.
- Rodadas individuais dos participantes.
- Cronômetro independente para cada participante.
- Comparação de notas.
- Prazo de 24 horas.
- Encerramento automático por W.O.
- Gabarito individual.

## Fase 5: Revanche e histórico

**Objetivo:** ampliar a recorrência e a continuidade da experiência.

Entregáveis:

- Revanche.
- Histórico de disputas.
- Acompanhamento de desafios pendentes.
- Refinamentos de UX.
- Melhorias na instrumentação analítica.

## Fase 6: QA e lançamento

**Objetivo:** garantir a consistência da experiência antes e depois da disponibilização.

Entregáveis:

- Testes funcionais.
- Testes de integração.
- Testes da distribuição das questões.
- Testes de limite de tempo.
- Testes de encerramento automático.
- Testes de W.O.
- Testes de integridade das notas e resultados.
- Validação de permissões.
- Monitoramento das métricas após o lançamento.

O cronograma definitivo dependerá do esforço técnico, da disponibilidade do banco de questões e das dependências da plataforma.

---

# 7. Go to Market

## 7.1. Estratégia de lançamento

Recomenda-se iniciar com uma disponibilização controlada para uma amostra de estudantes ou escolas, permitindo validar a compreensão das regras, a estabilidade da experiência e a adesão dos usuários.

A comunicação deverá apresentar as Batalhas como uma forma divertida de praticar conteúdos e desafiar colegas, sem associar os resultados competitivos ao valor acadêmico do estudante.

## 7.2. Mensagens principais

- Escolha o que quer estudar e entre na batalha.
- Selecione até três disciplinas e desafie seus conhecimentos.
- Responda a 10 questões em até 10 minutos.
- Enfrente o Nexo na Batalha Solo.
- Desafie um colega da sua escola ou sala.
- Confira seus acertos e erros no gabarito.
- Peça revanche e tente superar seu oponente.

## 7.3. Canais de divulgação

- Destaque na área do estudante.
- Comunicação dentro da própria experiência.
- Mensagens para retorno aos desafios pendentes.
- Comunicação institucional com escolas, quando aplicável.

## 7.4. Critérios de avaliação do lançamento

O lançamento deverá ser acompanhado por:

- Adesão à funcionalidade.
- Taxa de conclusão das rodadas.
- Tempo médio de resposta.
- Percentual de rodadas encerradas por tempo.
- Quantidade média de questões não respondidas.
- Volume de desafios VS criados.
- Percentual de desafios respondidos.
- Taxa de W.O.
- Taxa de revanche.
- Uso do gabarito.
- Distribuição de uso por disciplina e tópico.
- Ocorrências técnicas relacionadas à geração das questões, ao cronômetro e à apuração dos resultados.

---

# 8. Futuro: oportunidades de evolução

As evoluções abaixo não fazem parte do escopo obrigatório do MVP.

## 8.1. Ranking de batalhas

Criar rankings por sala, escola ou período, utilizando regras transparentes e evitando que o número de partidas seja o único fator determinante.

## 8.2. Progressão do Nexo

Expandir o personagem com novas expressões, conquistas e variações visuais, preservando sua identidade como mascote oficial da Batalha Solo.

## 8.3. Histórico de desempenho

Apresentar evolução de notas, taxa de acerto e desempenho por disciplina e tópico, permitindo que o estudante acompanhe sua aprendizagem ao longo do tempo.

## 8.4. Categorias de desafio

Permitir experiências organizadas por disciplina, assunto ou habilidade, respeitando a disponibilidade de questões.

## 8.5. Conquistas e reconhecimento

Criar conquistas relacionadas à participação, persistência, melhoria de desempenho e aprendizagem, sem recompensar exclusivamente a vitória competitiva.

## 8.6. Convites e notificações

Ampliar os mecanismos de comunicação de desafios recebidos, prazos próximos do vencimento e resultados concluídos, respeitando as configurações de notificação.

## 8.7. Experiências síncronas

Avaliar futuramente a possibilidade de disputas em tempo real.

## 8.8. Personalização pedagógica

Avaliar a seleção de questões conforme o nível de conhecimento, os conteúdos estudados ou as habilidades que precisam ser reforçadas.

---

# 9. Q&A: perguntas e respostas

## Seleção de conteúdo

**1. Quantas disciplinas o estudante pode selecionar?**

No mínimo uma e no máximo três.

**2. É obrigatório escolher um tópico para cada disciplina?**

Sim. Cada disciplina selecionada deve ter exatamente um tópico associado.

**3. O estudante pode selecionar dois tópicos da mesma disciplina?**

Não. A regra é um único tópico por disciplina.

**4. Quantas questões a batalha terá se o estudante escolher apenas uma disciplina?**

Sempre 10 questões.

**5. E se selecionar duas ou três disciplinas?**

A batalha continuará tendo 10 questões no total, distribuídas entre os tópicos selecionados.

**6. Como as questões serão distribuídas?**

A ordem e a quantidade por tópico serão aleatórias, respeitando o mínimo de três questões por tópico e o total de 10 questões.

**7. Como funciona a distribuição com três disciplinas?**

Cada tópico receberá pelo menos três questões. As questões restantes serão distribuídas entre os tópicos, respeitando o total de 10.

**8. O que acontece se um tópico não tiver questões suficientes?**

A plataforma não deverá iniciar uma rodada inválida. Deverá informar a indisponibilidade e orientar o estudante a ajustar a seleção.

## Tempo e pontuação

**9. Quanto tempo o estudante tem para responder?**

Até 10 minutos para responder às 10 questões da rodada.

**10. O cronômetro começa durante a seleção de disciplinas?**

Não. Ele começa quando o estudante inicia efetivamente o quiz.

**11. O que acontece se o tempo acabar antes da décima questão?**

A rodada é encerrada automaticamente. As respostas já registradas são preservadas, e as questões não respondidas são consideradas incorretas.

**12. Questões não respondidas contam como erro?**

Sim. Elas recebem zero ponto e são contabilizadas como incorretas.

**13. O estudante pode continuar respondendo depois de 10 minutos?**

Não. Após o encerramento definitivo da rodada, não poderá alterar as respostas daquela participação.

**14. Como a nota é calculada?**

A nota corresponde ao número de respostas corretas, variando de 0 a 10.

## Batalha Solo

**15. Quem é o adversário do modo Solo?**

O Nexo, personagem oficial das Batalhas da Geniex.

**16. Como o estudante vence o Nexo?**

Com 7 ou mais acertos.

**17. O que acontece com 5 ou 6 acertos?**

O resultado é empate.

**18. O que acontece com 4 acertos ou menos?**

O estudante perde para o Nexo.

**19. Quando o resultado aparece?**

Após a conclusão das 10 questões ou o encerramento automático por tempo.

## Batalha Versus

**20. Quem pode ser desafiado?**

Estudantes elegíveis da mesma sala ou escola e do mesmo ano escolar, conforme as regras de vínculo definidas.

**21. Os estudantes precisam estar conectados simultaneamente?**

Não. A disputa é assíncrona.

**22. Ambos respondem às mesmas 10 questões?**

Ambos respondem a 10 questões dentro da mesma configuração de disciplinas e tópicos. Recomenda-se que os conjuntos sejam diferentes, mas equivalentes em conteúdo e dificuldade.

**23. Cada estudante tem seu próprio cronômetro?**

Sim. Cada rodada tem um limite individual de 10 minutos.

**24. Quando o resultado final é definido?**

Após o encerramento das duas rodadas, quando as notas são comparadas, ou quando a disputa é encerrada por W.O.

**25. O que acontece se o desafiado não responder em 24 horas?**

O desafiante vence por W.O.

**26. O prazo de 24 horas substitui o limite de 10 minutos?**

Não. São regras diferentes. O prazo de 24 horas controla o período para responder ao desafio; os 10 minutos controlam a duração da rodada individual.

**27. Como o vencedor é definido no VS?**

Pela maior nota. Se ambos tiverem a mesma nota, ocorre empate.

## Gabarito e aprendizagem

**28. O estudante precisa esperar o oponente para consultar seu gabarito?**

Não. O gabarito fica disponível após o encerramento da rodada individual.

**29. O gabarito mostra questões não respondidas?**

Sim. Elas devem aparecer identificadas como não respondidas e contabilizadas como incorretas.

**30. O estudante poderá consultar o gabarito novamente?**

A proposta é permitir o acesso pelo histórico, conforme as regras de retenção e autorização.

## Revanche e histórico

**31. É possível pedir revanche após uma derrota?**

Sim, conforme as regras de elegibilidade e a priorização definida para a entrega.

**32. A revanche altera o resultado anterior?**

Não. A revanche cria uma nova batalha, com nova configuração, novas rodadas e novo resultado.

**33. É possível pedir revanche após empate ou W.O.?**

A proposta é permitir a revanche após qualquer resultado definitivo, desde que os participantes continuem elegíveis.

**34. O estudante poderá consultar batalhas anteriores?**

Sim. O histórico deverá apresentar as disputas concluídas e os desafios pendentes.

## Integridade e casos excepcionais

**35. O que acontece se houver falha de conexão durante a rodada?**

A plataforma deverá preservar as respostas já registradas e permitir a recuperação da experiência quando tecnicamente possível, sem ultrapassar o limite de tempo estabelecido.

**36. O que acontece se os dados escolares mudarem durante uma disputa?**

A proposta é validar a elegibilidade na criação do desafio e preservar a disputa registrada. Casos excepcionais deverão ser tratados conforme regras definidas antes do lançamento.

**37. O que acontece se a plataforma não conseguir gerar as 10 questões?**

A batalha não deverá começar. A plataforma deverá informar a indisponibilidade sem registrar uma rodada válida incompleta.

---

# 10. Decisões pendentes antes do desenvolvimento

| Decisão | Proposta inicial | Responsável |
|---|---|---|
| Distribuição aleatória | Garantir pelo menos três questões por tópico e distribuir as restantes aleatoriamente. | Produto + Pedagógico + Engenharia |
| Equivalência das rodadas VS | Conjuntos distintos, equivalentes em conteúdo e dificuldade. | Produto + Pedagógico |
| Início do cronômetro | Iniciar quando o estudante começar efetivamente o quiz. | Produto + Engenharia |
| Falha de conexão | Preservar respostas registradas e respeitar o limite de tempo. | Engenharia |
| Prazo de 24 horas | Contado a partir do registro válido do desafio. | Produto + Engenharia |
| Conclusão da rodada | Considerar concluída após a décima resposta ou encerramento automático por tempo. | Produto + Engenharia |
| Disponibilidade de questões | Impedir o início se a configuração não puder gerar uma rodada válida. | Engenharia + Pedagógico |
| Revanche e histórico | Confirmar inclusão no MVP ou em release subsequente. | Produto |
| Mudança de vínculo escolar | Preservar a disputa registrada e definir o tratamento de exceções. | Produto + Engenharia |

---

# 11. Definition of Done: critérios para lançamento

A funcionalidade poderá ser considerada pronta para lançamento quando:

- Os fluxos Solo e VS estiverem implementados e validados.
- O estudante conseguir selecionar de uma a três disciplinas.
- Cada disciplina selecionada exigir exatamente um tópico.
- O sistema impedir configurações inválidas.
- Cada rodada contiver exatamente 10 questões.
- A geração respeitar o mínimo de três questões por tópico.
- A ordem e a distribuição das questões forem aleatórias dentro das regras estabelecidas.
- Cada estudante tiver até 10 minutos por rodada.
- O encerramento automático funcionar corretamente.
- Questões não respondidas forem contabilizadas como incorretas.
- As notas forem calculadas no servidor.
- Os critérios de vitória, empate e derrota do Solo estiverem cobertos por testes.
- O resultado VS estiver condicionado ao encerramento das duas rodadas ou ao W.O.
- O prazo de 24 horas funcionar independentemente da sessão dos participantes.
- O gabarito estiver disponível após o encerramento individual.
- Os resultados forem persistidos e consistentes.
- Os critérios de elegibilidade forem validados no servidor.
- Os estados de carregamento, erro, indisponibilidade e desafio pendente estiverem cobertos.
- Revanche e histórico, caso incluídos no MVP, funcionarem sem alterar resultados anteriores.
- Os eventos analíticos prioritários estiverem instrumentados.
- Design, Produto e Engenharia tiverem validado os critérios de aceite.
- Os testes de qualidade, segurança e integridade tiverem sido concluídos.

---

## Resultado esperado

A funcionalidade de Batalhas da Geniex deverá oferecer uma experiência de aprendizagem competitiva, personalizada e dinâmica, permitindo que os estudantes escolham os conteúdos que desejam praticar, respondam a 10 questões em até 10 minutos e recebam feedback sobre seu desempenho.

A Batalha Solo terá o Nexo como personagem oficial e adversário educacional. A Batalha VS permitirá disputas assíncronas entre estudantes elegíveis, com comparação de notas, prazo de 24 horas, W.O. e revanche.

A seleção de disciplinas e tópicos, a distribuição controlada das questões, o cronômetro e o gabarito deverão funcionar de forma integrada para garantir uma experiência consistente, justa e pedagogicamente relevante.
