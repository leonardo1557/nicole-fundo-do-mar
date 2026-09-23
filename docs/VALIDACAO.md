# Validação — mecânica aprovada pelo usuário; etapa visual em avaliação

## Evidência automatizada

- `npm test`: 8 testes aprovados.
- Simulação equivalente com render a 30/60/120 Hz.
- Limites das faixas, troca <150 ms e troca durante salto.
- Salto/aterrissagem, ausência de salto duplo e buffer.
- Colisão com bloco baixo no chão, salto por cima e colisão com bloco alto.
- Desvio, posição real em troca de faixa e colisão varrida sem atravessamento.
- Pausa/resume sem avanço oculto; reinício limpo.
- 10 minutos simulados para cada uma de 10 sementes, com controlador de teste escolhendo a faixa livre: sem colisões; pool de 24 objetos estável. Isso não é benchmark de GPU nem prova de dificuldade adequada para uma pessoa.
- Swipe antecipado, um comando por gesto, ignorar segundo ponteiro e cancelar gesto.
- `npm run build`: aprovado, com aviso de chunk JS >500 kB. QA não incluído na saída de produção.

## Navegador

A tentativa inicial de abrir o servidor local no navegador remoto retornou `net::ERR_BLOCKED_BY_CLIENT`. A abertura direta da cópia compartilhada também foi rejeitada pela política do navegador (somente HTTP/HTTPS). Não foram tentados contornos dessa restrição. Inspeção visual e testes de interação ainda pendentes; não inferir sucesso do build como sucesso de execução WebGL.

## Publicação autorizada e teste da URL pública

Após autorização explícita do usuário, o PR #1 foi integrado e publicado em GitHub Pages. Workflow `35914033793`: sucesso; commit publicado `e581419f49b00e5fd205f041a31f0bebcab0843c`. Os checks de teste/build do commit anterior também passaram no GitHub Actions.

URL aberta no navegador remoto: https://leonardo1557.github.io/nicole-fundo-do-mar/?debug=1

A página e o JavaScript carregaram, mas a criação do Babylon Engine retornou `Error: WebGL not supported`. A interface exibiu corretamente a mensagem de falha e o botão Recarregar. Esse ambiente não permitiu executar/renderizar a cena; não houve teste de gameplay, FPS ou gestos no navegador. Não atribuir o problema ao aparelho do usuário sem testá-lo. Não alterar configurações de segurança para contornar a restrição.

A publicação não representa aprovação das etapas 1 e 2. É necessário abrir o link em navegador com WebGL e realizar o checklist abaixo.

## Checklist para aceite no aparelho

1. Abrir a prévia com `?debug=1` e anotar aparelho, SO, navegador e orientação.
2. Jogar por pelo menos 3 minutos, reiniciando após colisões; repetir sem diagnóstico.
3. Fazer 20 swipes para cada lado, 20 saltos e alternâncias durante o salto. Conferir resposta imediata, um comando por gesto, nenhuma rolagem/zoom acidental.
4. Tocar com segundo dedo, interromper um gesto e sair/voltar do app. Não pode ficar movendo, saltar sozinho ou avançar enquanto pausado.
5. Conferir salto sobre bloco baixo, colisão no alto, desvio e game over sem falsos positivos.
6. Girar retrato/paisagem e voltar; todas as faixas e botões devem continuar visíveis; respeitar notch e barra do navegador.
7. Anotar FPS, p95, quadros >50 ms, latência e escala após aquecimento. Meta proposta: 60 FPS aproximados, p95 ≤25 ms, latência software <50 ms, sem travamentos perceptíveis.
8. Repetir em Android Chrome e iPhone Safari antes de declarar compatibilidade ampla.

| Ambiente | Resultado |
| --- | --- |
| Node 24 — simulação e controles puros | 8/8 aprovados |
| Build Vite | Aprovado com aviso de tamanho |
| Navegador remoto — URL pública | Página carregada; Engine impedido por WebGL indisponível |
| Jogabilidade no navegador com WebGL | Pendente |
| Celular físico | Pendente — gate de conclusão aberto |


## Revisão após teste do usuário — salto e agachamento

O usuário relatou boa jogabilidade geral no aparelho, mas mortes durante saltos que pareciam possíveis. Modelo do aparelho, navegador e métricas não informados. Isso é evidência positiva de uso real, não aprovação da revisão abaixo.

Hipótese encontrada no código: janela curta de passagem sobre o bloco baixo. Salto passou de ~0,733 s para ~0,873 s; altura de ~1,61 m para ~2,09 m; tolerância superior de 3 cm para 10 cm. Blocos altos continuam exigindo desvio. Sem vídeo do caso original, não se afirma ter reproduzido cada morte relatada.

Incluído agachamento por swipe para baixo/seta para baixo/S, duração de 0,8 s e barras verdes suspensas. Cabe na arquitetura existente, sem motor físico, animações finais ou novas dependências. Mantém-se agachado enquanto a barra já sobre a personagem termina de passar, evitando morte por levantar automaticamente.

12 testes passaram e build aprovado. Novos testes: salto com chegada ao centro do obstáculo em 0,18/0,30/0,50/0,68 s nas velocidades 12/16/20 m/s; saltos muito tardios/antecipados continuam colidindo; barra colide em pé e permite agachamento; agachar não atravessa blocos no chão; pausa, troca de faixa, retorno automático, reset e swipe para baixo. Teste visual continua limitado pelo WebGL indisponível no navegador remoto. Requer reteste desta revisão no aparelho.


## Revisão após relato de piscada preta e ausência percebida de barras

Usuário confirmou que a jogabilidade/salto funcionam bem, mas não encontrou barras e observou breves telas pretas. O código anterior gerava a primeira barra a 138 m, em faixa aleatória. Agora a primeira fica a 86 m, no centro, e as seguintes a cada três linhas, mantendo faixa livre. Uma dica aparece quando há barra a menos de 24 m.

Encontrada causa plausível da piscada: `lowerResolution()` era executado após `scene.render()` e chamava `setHardwareScalingLevel()`, que no Babylon 9.27.1 chama `resize()` e altera width/height do canvas, limpando o buffer recém-renderizado. ResizeObserver também redimensionava fora do desenho. Ambas as operações agora só marcam pendência, aplicada imediatamente antes da próxima renderização. Sem reprodução visual no aparelho, esta é uma correção de uma condição real no código, não confirmação de que toda piscada tinha essa origem.

Diagnóstico opt-in inclui contadores de redimensionamentos e perdas de contexto WebGL, sem transmissão de dados. 14 testes e build aprovados: adicionadas garantia da barra central em 30 sementes e ordem adiada/coalescida dos ajustes de canvas com engine simulado. Navegador remoto permanece sem WebGL; validar se a piscada desapareceu no celular. Sem mudanças no salto aprovado pelo usuário.


## Etapa 3 — visual submarino

Base mecânica aceita pelo usuário em teste próprio (“Está ótimo”). Nova etapa autorizada na sequência. Foram mantidos sem alterações `simulation.js`, `config.js`, `input.js` e `viewport.js`; a câmera também mantém posição, alvo e FOV.

15 testes aprovados, incluindo construção dos modelos com Babylon NullEngine, instâncias visíveis, limites de decoração fora das faixas, envelope do agachamento e quantidade fixa de objetos ao percorrer distâncias até 1.000.000 m. NullEngine não usa GPU: isso verifica geometria e integração, não aparência de shaders, FPS ou renderização WebGL. Prévia geométrica da personagem frente/costas inspecionada por rasterização CPU auxiliar; não representa screenshot do jogo.

Build aprovado. Entrada JS ~1,05 MB / 252 kB gzip (antes ~246 kB gzip); sem modelos, fontes ou texturas baixados de servidores externos. Aviso de chunk >500 kB permanece. Foram adicionados 66 meshes à cena, incluindo fontes e instâncias; medir FPS no celular antes de aprovar a fase visual.

Navegador remoto anteriormente retornou WebGL indisponível; não apresentar esta implementação como visualmente validada naquele navegador. Conferir no aparelho: personagem legível de costas, cenário nas laterais, cores de obstáculos distintas, agachamento, nenhuma piscada e fluidez semelhante à base aprovada. Se necessário, reduzir densidade de cenário sem mudar mecânica.


## Aprofundamento visual solicitado após primeira versão

18 testes aprovados: regressões de mecânica, primeira barra, política de resize, construção e reaproveitamento da arte, poses distintas, mergulho com escala global 1 e cabeça abaixo de 0,68 m, envelopes dos obstáculos, uma variante ativa por slot, fauna fora das faixas e segmentos de areia contíguos. NullEngine verifica integração/geometria, não GPU/FPS. Prévia auxiliar CPU das vistas de frente/costas/mergulho inspecionada; não é screenshot do jogo nem validação da iluminação final.

A nova revisão inclui uma Nicole reconstruída, câmera mais próxima, obstáculos com relevo, piso com ondulações e cor por vértice, 12 peixes e 28 bolhas. O aumento visual eleva o custo de renderização. Densidade reduzida acompanha o ajuste automático de resolução; é indispensável comparar fluidez e legibilidade no celular. Ainda não se declara equivalência ao acabamento de Subway Surfers nem aprovação da etapa visual. O navegador remoto conhecido continua sem WebGL.

Verificar no aparelho: nado/cauda/hair sem rigidez ou saltos, distinção subida/queda, mergulho sem achatar, obstáculos legíveis, cardumes/bolhas laterais, piso sem emendas visíveis, ausência de piscadas e estabilidade de FPS. Castelo/missão/áudio continuam pendentes.
