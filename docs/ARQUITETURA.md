# Arquitetura técnica — etapas 1 e 2

| Módulo | Responsabilidade |
| --- | --- |
| config.js | Constantes de movimento, volumes, velocidade e pool |
| simulation.js | Estado, relógio fixo, gerador determinístico e colisão varrida |
| input.js | Reconhecimento de swipe e teclado; cancelamento/captura de ponteiro |
| underwater.js | Modelo original da Nicole, materiais e decoração instanciada/reciclada |
| renderer.js | Babylon Engine/Scene, câmera fixa, meshes reciclados, interpolação |
| viewport.js | Adia redimensionamento e mudança de resolução até antes do desenho |
| performance.js | Janela circular de 600 quadros e latência de comando até render |
| main.js | Ciclo de vida, estados, DOM e pausa/recuperação |

Fluxo: entrada altera intenção → simulação calcula posição a 120 Hz → render interpolado → UI a 5 Hz. A câmera fica atrás da personagem e não recebe controles de navegação. O mundo se move em direção à câmera, mantendo coordenadas locais limitadas.

## Parâmetros iniciais

- Faixas espaçadas 2,25 m; troca de uma faixa em ~141 ms. Permite enfileirar a segunda faixa.
- Velocidade 12 a 20 m/s, aceleração 0,12 m/s².
- Salto com velocidade vertical 9,6 m/s, gravidade 22 m/s²; duração ~0,873 s, altura ~2,09 m. Tolerância de 0,10 m no topo dos blocos apoiados no chão.
- Agachamento de 0,8 s e altura 0,65 m, com retorno automático após a barra que já está sobre a personagem liberar passagem. Swipe para baixo durante salto prepara agachamento ao pousar. Barras verdes começam a 1 m do chão, com 1 m de altura; primeira na segunda linha (86 m), central; seguintes a cada três linhas e reutilizam o mesmo pool.
- Obstáculo baixo 0,8 m e alto 3,1 m. Hitbox da personagem: 0,64 × 1,4 × 0,64 m.
- Colisão por segmento relativo contra AABB expandido; considera x, y e z e impede atravessamento em quedas de FPS.
- Linhas a cada 26 m (mínimo 1,3 s na velocidade máxima). Sempre sobra uma faixa; duas trocas levam ~0,282 s. Primeira linha a 60 m.
- 24 slots permanentes de obstáculos. Nenhuma criação de mesh no loop. Pista e marcas recicladas, materiais congelados, sem física externa.
- DPR efetivo máximo inicial 1,5. Duas janelas lentas reduzem resolução em passos de 0,25 até 0,75; sem oscilação automática. Redimensionamento solicitado por desempenho ou ResizeObserver só é aplicado imediatamente antes de renderizar, para não limpar um quadro já pronto.
- Pausa por blur, visibilitychange, pagehide e perda de WebGL. Retorno exige Continuar e zera acumulador, sem salto temporal.
- Intervalo recebido pelo relógio é limitado a 100 ms para evitar espiral de atualizações. Em stalls maiores o jogo desacelera; isso é proteção, não prova de fluidez.

`qa.html` e cenários de teste só em desenvolvimento. `?debug=1` disponível no build para medição no aparelho. A métrica comando→quadro mede software até término do render, não latência física da tela. Medições com diagnóstico devem ser complementadas por corrida sem painel.

## Dependências

Babylon.js 9.27.1 e Vite 8.3.0 fixados; lockfile incluído. Build inicial: entrada JS aproximadamente 1,03 MB / 246 kB gzip, mais shaders sob demanda. Aviso de chunk grande do bundler permanece registrado; não implica sozinho FPS baixo, mas tempo de carregamento deve ser medido no celular.

Referência de otimização consultada: https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/scene/optimize_your_scene.md


## Etapa 3 — visual

`NicoleModel` usa pivôs hierárquicos e geometria simples. A animação deriva da distância simulada, portanto congela na pausa. Altura visual acompanha imediatamente o agachamento. `UnderwaterWorld` instancia 36 elementos laterais e 10 bolhas, reciclando-os sem criar meshes no loop. A geometria decorativa permanece fora das faixas. Modelo + decoração usam 66 meshes (incluindo fontes invisíveis), 20 geometrias, 11 materiais e zero texturas. São 116 meshes na cena completa, incluindo 24 slots de obstáculos e 20 marcas da pista. Contagem de meshes não equivale a draw calls, porque os elementos repetidos são instâncias.

Câmera, simulação, volumes de colisão, geração de obstáculos, entrada e política de resolução preservados. O desenho mantém o ajuste de canvas antes de renderizar, corrigido na base aprovada.


## Etapa 3 aprofundada — revisão vigente

A descrição acima documenta a primeira versão visual. A revisão vigente substitui `NicoleModel` por `nicole.js`, com superfícies contínuas (`art-geometry.js`), rig hierárquico e deformação da cauda usando buffers reutilizados. Há poses distintas de subida, queda, aterrissagem e mergulho; o mergulho não achata o modelo por escala global. Não se trata de animação capturada nem de um personagem de um catálogo comercial.

`obstacle-art.js` prepara três modelos-base e três instâncias por slot, habilitando só a variante ativa. Volumes visuais se mantêm próximos às hitboxes; testes verificam os limites. `seafloor.js` usa oito segmentos de areia contíguos com cor por vértice, relevos fora das faixas e reciclagem. `sea-life.js` mantém 12 peixes articulados, com corpo/cauda/olhos instanciados; 28 bolhas de aro sobem em plumas laterais. Efeitos acompanham a distância simulada, portanto param na pausa. Quando o escalonamento cai a 1 ou menos, reduz-se a densidade de decoração, peixes e bolhas; mecânica e obstáculos permanecem completos.

A câmera passa de (0,5.6,-10) a (0,3.8,-7), mirando (0,1,12), para aproximar a personagem; conserva FOV e três faixas visíveis. Luz direcional suave complementa a hemisférica, sem sombras/pós-processamento/texturas. 248 meshes nos módulos de arte (incluindo fontes e variantes desabilitadas), mais quatro guias de faixa; 56 geometrias antes das guias e 25 materiais. Contagem não equivale a draw calls. Sem novas dependências ou arquivos externos. A física, configuração de movimentos, gestos e correção de resize seguem iguais à mecânica aprovada.
