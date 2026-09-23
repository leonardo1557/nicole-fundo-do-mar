# Nicole no Fundo do Mar · runner 3D

Implementação das **ETAPAS 1 e 2**, em Babylon.js. A cápsula é um marcador temporário da personagem. Arte final, castelo, pérolas, áudio e polimento não fazem parte desta entrega.

**Status: implementado, em validação. Não aprovado em celular real.**

## Executar

Node 24 e npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Deslize para os lados para trocar de faixa e para cima para saltar. No computador: setas ou A/D e espaço. Blocos amarelos baixos permitem salto; blocos roxos altos exigem desvio. A colisão encerra a corrida. Pausar/continuar não reinicia o percurso. Trocar de aba pausa automaticamente.

- `?debug=1`: métricas locais de FPS, p95, comandos e meshes; nenhum envio de telemetria.
- `/qa.html` no servidor de desenvolvimento: viewports 390×844, 360×640 e 844×390. É apenas tamanho de tela, não emulação de hardware ou toque.
- `?qa=1` em desenvolvimento: cenários controlados (vazio, bloco baixo, bloco alto). Excluídos do build de produção.
- `npm run dev -- --host 127.0.0.1`: alternativa para ambientes que não permitem enumerar interfaces de rede.

A saída de produção fica em `dist/`. Vercel está configurado em `vercel.json`; GitHub Pages compila antes de publicar. O build usa caminhos relativos, incluindo hospedagem em subdiretórios. O protótipo 2D está preservado no histórico Git.

[Contexto e plano de execução](docs/PLANO_MESTRE.md) · [Arquitetura](docs/ARQUITETURA.md) · [Validação](docs/VALIDACAO.md)
