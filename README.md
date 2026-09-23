# Nicole no Fundo do Mar · runner 3D

Runner mobile em Babylon.js. **Etapas 1 e 2 aprovadas pelo usuário no aparelho**. Etapa 3 em avaliação: Nicole como sereia estilizada, cenário submarino e interface em cores suaves. Castelo, pérolas/missão e áudio seguem para etapas posteriores.

**Status: visual da etapa 3 implementado; aguardando avaliação no celular.** A aprovação anterior é do teste do usuário, não certificação em todos os aparelhos.

## Executar

Node 24 e npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Deslize para os lados para trocar de faixa para cima para saltar e para baixo para agachar. No computador: setas ou A/D, espaço para pular e S para agachar. Blocos amarelos baixos permitem salto; blocos roxos altos exigem desvio; barras verdes suspensas permitem passagem agachada. A colisão encerra a corrida. Pausar/continuar não reinicia o percurso. Trocar de aba pausa automaticamente.

- `?debug=1`: métricas locais de FPS, p95, comandos e meshes; nenhum envio de telemetria.
- `/qa.html` no servidor de desenvolvimento: viewports 390×844, 360×640 e 844×390. É apenas tamanho de tela, não emulação de hardware ou toque.
- `?qa=1` em desenvolvimento: cenários controlados (vazio, bloco baixo, bloco alto e barra suspensa). Excluídos do build de produção.
- `npm run dev -- --host 127.0.0.1`: alternativa para ambientes que não permitem enumerar interfaces de rede.

A saída de produção fica em `dist/`. Vercel está configurado em `vercel.json`; GitHub Pages compila antes de publicar. O build usa caminhos relativos, incluindo hospedagem em subdiretórios. O protótipo 2D está preservado no histórico Git.

[Contexto e plano de execução](docs/PLANO_MESTRE.md) · [Arquitetura](docs/ARQUITETURA.md) · [Validação](docs/VALIDACAO.md)
