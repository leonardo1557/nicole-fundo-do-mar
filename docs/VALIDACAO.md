# Validação — em andamento, NÃO aprovada em celular

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

A tentativa inicial de abrir o servidor local no navegador remoto retornou `net::ERR_BLOCKED_BY_CLIENT`. Inspeção visual e testes de interação ainda pendentes; não inferir sucesso do build como sucesso de execução WebGL.

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
| Navegador com WebGL | Pendente |
| Celular físico | Pendente — gate de conclusão aberto |
