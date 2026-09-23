# Contexto recuperado e plano de execução

## Procedência e limite da recuperação

Foram consultados o histórico de conversa e o repositório antes de alterar o projeto. O histórico recuperou decisões e um plano anterior em três fases, **não o texto integral de um plano mestre detalhado posterior**. A busca de arquivos ficou indisponível por erro do serviço. Este registro distingue o que foi recuperado do recorte explícito solicitado agora; não apresenta uma reconstrução como transcrição original.

Base do repositório: `a5f9a430e69f0d31ce34e206eaff3da8afa813e2`. Havia apenas HTML Canvas 2D, README e workflow Pages.

## Decisões recuperadas

- Nicole no Fundo do Mar: jogo para convite de aniversário, runner mobile inspirado na mecânica de Subway Surfers, sem copiar sua identidade visual.
- Protótipo 2D rejeitado por travamentos/interface; serve apenas de prova de conceito.
- Migração para Babylon.js, terceira pessoa, três faixas, swipe, geração de obstáculos e object pooling.
- Personagem futura representativa da Nicole, não realista, cabelo loiro escuro.
- Visão futura: primeira corrida com meta (30 ou 50 pérolas/distância foi discutido; protótipo adotou 30), chegada ao castelo, recado e modo infinito. Não implementar isso nesta fase.
- Plano anterior recuperado: base 3D jogável; visual submarino; polimento com som e extras. A numeração antiga não equivale às etapas solicitadas agora.

## Recorte inicial — etapas 1 e 2

### ETAPA 1 — arquitetura técnica 3D

1. Vite + módulos JavaScript e dependências fixadas no lockfile.
2. Separação entre simulação pura, entrada, renderização Babylon e UI.
3. Cena leve, pista, câmera de terceira pessoa, personagem provisória.
4. Simulação fixa de 120 Hz com interpolação; pausa em perda de foco.
5. Pool fixo de obstáculos, materiais compartilhados, sem sombras/texturas/pós-processamento.
6. Resolução inicial limitada e redução adaptativa; diagnóstico local opt-in.
7. Build compatível com Vercel e GitHub Pages.

### ETAPA 2 — mecânica do runner

1. Avanço automático por deslocamento do cenário.
2. Três faixas, troca contínua, comandos antecipados no início do swipe.
3. Salto balístico, bloqueio de salto duplo e pequeno buffer próximo da aterrissagem.
4. Blocos baixos saltáveis e altos desviáveis.
5. Geração com pelo menos uma faixa livre por linha e espaçamento para reação.
6. Colisão varrida por volume real, game over e reinício limpo.
7. Testes de lógica, inspeção no navegador e aceite em celular real.

## Gate obrigatório

**Não encerrar as etapas como aprovadas até validar fluidez em celular real.** Meta proposta de avaliação: próximo de 60 FPS sustentados, p95 de quadro até 25 ms, comando até primeiro quadro abaixo de 50 ms, sem travamentos perceptíveis, gestos perdidos ou colisões incorretas. São critérios de teste desta implementação, não números recuperados do plano original. Registrar aparelho, SO, navegador e duração. Android Chrome e iPhone Safari devem ser verificados antes de aprovação ampla mobile.

## Fora do recorte inicial

Não desenvolver arte final, castelo, áudio, pérolas/missão, power-ups, partículas, recordes ou polimento. Essas pendências seguem preservadas para fases futuras e não foram desenvolvidas na entrega inicial. Autorizações posteriores estão registradas abaixo.


## Aprovação e avanço autorizado — ETAPA 3

Após testar salto, agachamento e correção de piscada, o usuário respondeu “Está ótimo”. As etapas 1 e 2 foram aceitas no teste dele. Base estável: `7202a70488bce9e25e945b0fea3eceff30ba8b6c`. Não foram coletadas métricas nem confirmados modelo/navegador, portanto não se declara certificação mobile ampla.

Em seguida o usuário pediu “Qual a próxima fase? Vamos avançar”. Recorte adotado: identidade visual, personagem e cenário, preservando os controles aprovados.

1. Nicole em 3D estilizado, sereia com cabelo loiro escuro e animação simples.
2. Oceano de cores suaves, caminho de areia, corais/algas/pedras laterais e poucas bolhas geométricas recicladas.
3. Interface coerente com o tema; mesmas cores e volumes de obstáculos para legibilidade e previsibilidade.
4. Modelos originais gerados em código, sem arquivos externos, texturas, sombras ou pós-processamento.
5. Testes de geometria/alocações e regressão; validação visual/performance no celular após publicação.

A física, as hitboxes, a geração de obstáculos, a câmera e os gestos aprovados não mudam nesta etapa. Castelo e coleta de pérolas serão o próximo recorte proposto, depois de aprovar o visual e verificar que a fluidez foi preservada. Áudio/polimento ficam para depois.
