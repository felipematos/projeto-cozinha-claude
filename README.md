# Projeto Cozinha & Copa — Área Coberta

🇧🇷 Português · 🇺🇸 [English](README.en.md)

Projeto arquitetônico para transformar a área coberta dos fundos da casa numa **cozinha + copa semi-aberta**, em estilo rústico com madeira de demolição.

## 👉 [Abrir o projeto online](https://felipematos.github.io/projeto-cozinha-claude/)

https://felipematos.github.io/projeto-cozinha-claude/

## O que é

Aplicação web (sem build, three.js via CDN), disponível em **português e inglês** (seletor de idioma no topo), com:

- **Planta baixa interativa**: arrastar, girar e dimensionar móveis, com cotas dinâmicas, ímã, colisões, desfazer/refazer e ferramenta de medição.
- **Vista 3D detalhada**: órbita, modo caminhar, texturas procedurais, oclusão de ambiente e medição no 3D.
- **Exportação**: PDF da planta em escala 1:50, PNG das vistas 3D e PDF de marcenaria (planta numerada, uma folha por armário, lista de corte e tampos de granilite).

O layout é salvo no navegador (`localStorage`) e pode ser exportado/importado em JSON.

## Rodar localmente

Precisa de um servidor HTTP (as texturas não carregam via `file://`):

```bash
python3 -m http.server 8765 --directory app
```

Depois abra http://localhost:8765.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `app/` | Aplicação web (publicada no GitHub Pages) |
| `projeto/` | Planta em PDF, croqui e medidas dos móveis |
| `móveis/`, `ambiente/` | Fotos dos móveis existentes e do ambiente atual |
| `referencias/` | Imagens de referência (armários, pratos etc.) |
| `layouts-salos/` | Layouts salvos |
| `docs/` | Prompt inicial do projeto |

As medidas, os requisitos e a arquitetura do código estão documentados em [`CLAUDE.md`](CLAUDE.md). O texto do prompt que deu início ao projeto está em [`docs/prompt-inicial.md`](docs/prompt-inicial.md).

## Publicação

Cada push na branch `main` publica a pasta `app/` no GitHub Pages pelo workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
