# Arquitetura técnica — etapas 1 e 2

| Módulo | Responsabilidade |
| --- | --- |
| config.js | Constantes de movimento, volumes, velocidade e pool |
| simulation.js | Estado, relógio fixo, gerador determinístico e colisão varrida |
| input.js | Reconhecimento de swipe e teclado; cancelamento/captura de ponteiro |
| renderer.js | Babylon Engine/Scene, câmera fixa, meshes reciclados, interpolação |
| performance.js | Janela circular de 600 quadros e latência de comando até render |
| main.js | Ciclo de vida, estados, DOM e pausa/recuperação |

Fluxo: entrada altera intenção → simulação calcula posição a 120 Hz → render interpolado → UI a 5 Hz. A câmera fica atrás da personagem e não recebe controles de navegação. O mundo se move em direção à câmera, mantendo coordenadas locais limitadas.

## Parâmetros iniciais

- Faixas espaçadas 2,25 m; troca de uma faixa em ~141 ms. Permite enfileirar a segunda faixa.
- Velocidade 12 a 20 m/s, aceleração 0,12 m/s².
- Salto com velocidade vertical 8,8 m/s, gravidade 24 m/s²; duração ~0,733 s, altura ~1,61 m.
- Obstáculo baixo 0,8 m e alto 3,1 m. Hitbox da personagem: 0,64 × 1,4 × 0,64 m.
- Colisão por segmento relativo contra AABB expandido; considera x, y e z e impede atravessamento em quedas de FPS.
- Linhas a cada 26 m (mínimo 1,3 s na velocidade máxima). Sempre sobra uma faixa; duas trocas levam ~0,282 s. Primeira linha a 60 m.
- 24 slots permanentes de obstáculos. Nenhuma criação de mesh no loop. Pista e marcas recicladas, materiais congelados, sem física externa.
- DPR efetivo máximo inicial 1,5. Duas janelas lentas reduzem resolução em passos de 0,25 até 0,75; sem oscilação automática.
- Pausa por blur, visibilitychange, pagehide e perda de WebGL. Retorno exige Continuar e zera acumulador, sem salto temporal.
- Intervalo recebido pelo relógio é limitado a 100 ms para evitar espiral de atualizações. Em stalls maiores o jogo desacelera; isso é proteção, não prova de fluidez.

`qa.html` e cenários de teste só em desenvolvimento. `?debug=1` disponível no build para medição no aparelho. A métrica comando→quadro mede software até término do render, não latência física da tela. Medições com diagnóstico devem ser complementadas por corrida sem painel.

## Dependências

Babylon.js 9.27.1 e Vite 8.3.0 fixados; lockfile incluído. Build inicial: entrada JS aproximadamente 1,03 MB / 246 kB gzip, mais shaders sob demanda. Aviso de chunk grande do bundler permanece registrado; não implica sozinho FPS baixo, mas tempo de carregamento deve ser medido no celular.

Referência de otimização consultada: https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/scene/optimize_your_scene.md
