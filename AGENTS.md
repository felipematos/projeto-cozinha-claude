# Projeto Cozinha & Copa — Área Coberta

Projeto arquitetônico para transformar a **"ÁREA COBERTA"** da casa (fundos) numa **cozinha + copa semi-aberta**, em estilo **rústico com madeira de demolição**. A cozinha sai da área da sala e passa para a área coberta externa.

## Estrutura de pastas

| Pasta | Conteúdo |
|---|---|
| `projeto/` | `Projeto casa Paulo-Quarto e sala rev03.pdf` (planta AutoCAD, A4, escala ~1:200 — ambiente correto = "ÁREA COBERTA"); `detalhe paredes e pia.jpeg` (croqui com persiana de vidro, meia-parede + janelão, parede completa e pia); `medidas dos móveis.jpg` (L × A × P em metros) |
| `móveis/` | Fotos dos móveis existentes |
| `ambiente/` | Fotos do ambiente atual (só colunas, sem paredes) |
| `app/` | **Aplicação web** (planta baixa interativa + 3D detalhado; a aba 3D simples foi removida a pedido do usuário) — three.js via CDN, sem build |
| `app/assets/tex/` | Texturas recortadas/retificadas das fotos (geladeira, fogão, buffet, lava-louças, textura da parede) |

Rodar: `python3 -m http.server 8765 --directory app` e abrir `http://localhost:8765` (config em `.Codex/launch.json`, nome `cozinha`). Precisa de servidor HTTP (texturas não carregam via `file://`).

## Requisitos do usuário (fonte da verdade)

**Envoltória**
- Laterais: meias-paredes com **janelões de vidro**.
- Frente (lado do quintal): **parede retrátil de vidro** ("persiana de vidro"), que também dobra na lateral direita até o 2º pilar (vão livre de **1,71 m**, medido com trena). O **triângulo** entre o topo do vidro e o telhado é fechado com **madeira**.
- Lado direito, a partir do fundo: **parede completa** (onde fica a bancada em L) → **meia-parede com janelão** → persiana de vidro.
- Lado esquerdo: parede existente da Suíte 2 (cheia, com textura/grafiato bege).

**Cozinha (fundo, perto da parede da casa)**
- Fogão 6 bocas a gás (existe — 0,76 × 0,97 × 0,66) — **sem coifa** (removida pelo usuário)
- Geladeira grande (existe — 0,82 × 1,90 × 0,82)
- Freezer vertical\* (novo)
- Fogão a lenha\* (novo) — **layout do croqui do usuário**: coluna de alvenaria contínua do lado da chaminé com o **forno elevado** (chaminé saindo de cima) e a **lenha guardada embaixo**; do outro lado, chapa de ferro com **apenas 1 trempe** e, logo abaixo dela, o **alimentador** (fornalha) + cinzeiro. **Fluxo do calor**: fornalha → chama direto na trempe → canal sob a chapa → por baixo, fundo e topo da câmara do forno → chaminé; **registro** (abafador) na frente do bloco desvia direto para a chaminé; porta de limpeza da fuligem sob o forno
- Filtro de pedra antigo (existe — estrutura de ferro + pedra + talha de barro; 0,54 × 1,50 × 0,54), **ao lado da geladeira**
- Bancada em **L** em **granilite avermelhado**, com **pia grande**\*
- Lava-louças grande **em local alto** (existe — 0,59 × 0,85 × 0,59) → torre com **topo alinhado à janela (2,69 m)**
- Armários sob a bancada e suspensos sempre que possível\*
- Armário suspenso em **L** do canto até a janela, **rente à janela e com o topo alinhado ao topo dela (2,69 m)** (base 1,60–1,70 m), com **nicho aberto** em parte dele (`nichos: [índices]` em `suspenso`)
- **Nichos de temperos** (20 cm de profundidade) **só no trecho lateral (parede direita), até a parede do fundo, e só a fileira de cima** — pendurados logo abaixo do armário, bancada livre embaixo (kind `nicho`, `niveis: 1`)
- **Interfone** na parede da suíte, ao lado do filtro (h 1,40 m)
- **Ganchos**: panos de prato/toalha na lateral da torre; barra de utensílios (colheres, concha, espátula) — kind `ganchos`, `variante: 'panos' | 'utensilios'`
- **Acessórios** (kind `acessorios`, `variante: 'bancada' | 'ervas' | 'mesa'`) + chaleira/panela automáticas sobre os fogões (`acessorios: false` desliga)
- Torneira **de parede** (latão, registro em cruzeta) sobre a cuba, a ~1,10 m — abaixo do peitoril da janela (1,20 m)
- **Rebaixo de 1,5 cm** no tampo em volta da cuba e na área do escorredor (contém a água; superfície lisa, sem sulcos) — `cuba.rebaixo = { prof, esq, dir, frente, fundo }` (cm); o tampo é montado por placas retangulares em `B.bancada`
- **Azulejos antigos sortidos 15 × 15 cm** na parede da pia, da bancada (0,90) até a altura dos armários/janela (2,69), de x 1,73 (depois da torre) a 4,28, contornando a janela — `ROOM.azulejos` em `data.js`, textura `T.azulejos()` (8 × 8 peças, desenhos variados, rotação aleatória, desgaste)
- **Sanduicheira** (28 × 26 × 11) e **liquidificador** (20 × 20 × 42) na bancada lateral direita, junto à tomada do janelão — kind `eletroportatil`, `variante: 'sanduicheira' | 'liquidificador'`; o fio vai sozinho até a tomada mais próxima na parede de trás (`caboTomada`)
- **Escorredor de louça e talheres** grande (42 × 32 × 16,5 cm) na bancada, ao lado da cuba (kind `escorredor`)
- Barra de utensílios na parede do fundo, **sob o armário suspenso com nicho** (não sobre o fogão)
- **Armários**: madeira com textura tirada da foto de referência `referencias/armario_referencia.jpg` (`assets/tex/madeira_armario_v/h.jpg`), **puxadores-flor de ferro preto**; frentes de base em **módulos de ~90 cm** alternando gaveteiro (2 gavetas sobrepostas) e par de portas, sob a cuba sempre portas (`baseFronts`)
- **Rodabanca** de granilite (10 cm) automática em todo lado do tampo que encosta numa parede (`sidesOnWall`)
- **Canto cego**: portas/gavetas só no trecho visível da frente (`frontFreeSpans`); trecho atrás de outro móvel fica fechado
- **Ganchos** sob o armário com nicho: barra de colheres curta (perto do canto) + ganchos de panos/toalhas (em direção à janela)
- **Tomadas duplas 4×2** (kind `tomada`): parede direita sobre o fogão (acendimento) e sobre a bancada lateral; parede da pia **colada à moldura da janela** (longe dos panos)
- Sem prateleira decorativa sobre a janela (removida pelo usuário)
- Regra de segurança: não pendurar armário sobre o fogão a gás a menos de ~70 cm das bocas

**Copa (frente, perto da parede de vidro)**
- Mesa de 8 lugares (existe — 2,00 × 0,83 × 0,88; cadeiras de compensado curvado claro como as reais — `chairProto` em `models.js`: encosto em lâmina bem curvada em planta, mais larga que os montantes na faixa de cima, parafusada na frente dos montantes roliços, recorte central em "feijão" e dois recortes laterais por onde aparecem os montantes; assento grosso (3 cm) sem saia, com relevo ergonômico (cavidades das coxas + crista central); pernas cônicas abertas; **sem aro redondo** — arco de madeira curvada entre as pernas da frente e um arco de cada lado (perna da frente → traseira); malha subdividida (`TessellateModifier`) no encosto e no assento)
- Buffet de madeira ~1,80 m (existe — 1,75 × 0,86 × 0,56)
- Armário baixo de madeira de demolição ao lado do buffet, entre ele e a persiana (1,20 × 0,86 × 0,56, folga de 5 cm do vidro) — kind `armarioBaixo`
- ~~Cadeira de balanço~~ — **removida do projeto pelo usuário** (o modelo 3D Thonet continua disponível em `models.js`)
- Parede com pratos decorativos\* — arranjo e peças copiados da foto de referência do usuário (`PRATOS_FOTO` em `models.js`: 21 pratos, perfil real por revolução, louça esmaltada com verniz, vidro prensado, alumínio canelado, suportes de arame) — **sobre o buffet, na largura dele (175 cm), h 1,50–2,65 m, topo alinhado ao do armário suspenso sobre a geladeira**
- ~~Armários suspensos tipo cristaleira~~ — **removidos pelo usuário** (a parede de pratos ocupa o lugar)

\* = não existe hoje; dimensões e desenho inventados no projeto (ver `app/js/data.js`).

**Não incluir** móveis que estão hoje no ambiente mas não estão na lista acima (estante branca, armários brancos, micro-ondas, máquina de lavar roupas, aparador escuro etc.).

## Medidas extraídas da planta (cm) — devem ser respeitadas rigorosamente

Sistema de coordenadas usado no app (planta vista com a **frente/quintal em cima**):
- `x` = 0 na face da parede da Suíte 2 (esquerda) → 460 na borda do piso (lado direito aberto)
- `y` = 0 na borda da frente (persiana de vidro) → 640 na face da parede da casa (fundo/cozinha atual)
- `z` = altura a partir do piso

| Item | Valor | Origem |
|---|---|---|
| Área coberta (piso) | 460 × 640 | PDF medido a 1200 dpi (escala 2,135 px/cm, conferida com cotas 400/440/20) |
| Pé-direito paredes | 300 | Corte A-A |
| Telhado | 1 água, da parede da suíte (~433) caindo para o lado direito (300), inclinação ~29% | Corte A-A (cumeeira sobre a parede da suíte) |
| Beiral | ~70 | Corte B-B / projeção beiral |
| Porta para a casa | parede do fundo, vão x 20–103 (folha 80×210 + batentes); parede recomeça em 108 | **trena**: 3,20 m de parede do batente até a face direita |
| Janela existente (para a antiga cozinha) | parede do fundo, **1,37 × 1,49 m** (medida real), x 168,5–305,5 (centro 237), peitoril 120, topo 269 | **trena** (largura/altura) + Corte A-A (peitoril) |
| Face interna do lado direito | x = 428 (pilares e paredes novas de 428 a 458) → **vão interno 4,28 m** | **trena** (frente: 4,28 m da parede da suíte ao pilar) |
| Persiana lateral | trecho 0–216 (vidro entre pilares: 30–201) | **trena** |
| Meia-parede + janelão | trecho 216–437 (janelão entre pilares: 231–422), meia-parede h=110, janelão até 280 | **trena** |
| Parede completa | trecho 437–640 (452–640 livre) | **trena** |
| Pilares existentes | **30×30**, em y 0–30, 201–231, 422–452 (x 428–458) → vãos livres **1,71 · 1,91 · 1,88 m** (30+171+30+191+30+188 = 640) | **trena** (a planta PDF não desenha os pilares) |
| Faixa lateral até o muro | ~140 (muro h=200) | planta |

## Arquitetura do app (`app/`)

| Arquivo | Papel |
|---|---|
| `js/data.js` | `ROOM` (geometria medida), `DEFAULT_ITEMS` (layout proposto), `KINDS`, `CATALOG` — **editar medidas aqui** |
| `js/state.js` | store (eventos `change`/`drag`/`select`), localStorage, versões, colisões (SAT + faixa de altura), passagem da porta |
| `js/plan2d.js` | planta SVG: `roomMarkup`/`itemMarkup` (reaproveitados no PDF) + `PlanEditor` (arrastar, girar, ímã, cotas dinâmicas, zoom/pan) |
| `js/models.js` | materiais (simples × detalhado) e construção 3D de cada `kind` + ambiente (paredes, persianas, janelões, telhado, entorno) |
| `js/textures.js` | texturas procedurais (madeira de demolição, granilite, porcelanato, tijolo, palhinha, pratos) + fotos |
| `js/viewer3d.js` | `Viewer` three.js: órbita, vistas (`VIEWS`), modo caminhar, clique-seleciona, `snapshot()` |
| `js/export.js` | PDF (jsPDF + svg2pdf, planta vetorial 1:50 + quadro de móveis + páginas 3D) e PNG |
| `js/main.js` | abas, painel lateral, histórico (desfazer/refazer), menus salvar/exportar, atalhos |

Navegação 3D por teclado (fora do modo caminhar, `Viewer.orbitKeysStep`): `↑`/`↓` anda, `←`/`→` gira, `W`/`S` sobe/desce, `A`/`D` lateral, `Z` aproxima, `⇧Z` ou `X` afasta, `⇧` acelera.

Ferramentas de visualização (canto superior direito da vista): **📏 Medir** (`M`) — trena por clique-e-arraste na planta (`PlanEditor.snapMeasure`, ímã em cantos/bordas de paredes, pilares e móveis) e no 3D (`Viewer.setupMeasure`, raycast com ímã em vértices); `⇧` trava eixo, `Alt` sem ímã, `⌫` apaga a última, `Esc` sai. Medidas ficam só na sessão (por vista) e entram no PNG do 3D. **⛶ Tela cheia** (`F`; cai para "janela inteira" `body.pseudo-full` se o navegador recusar a Fullscreen API). **⟩ Painel** (`\`) recolhe a lateral (lembrado em `localStorage`).

**Projeto dos armários (marcenaria)**: botão "🪚 Projeto dos armários" (e Exportar → PDF) gera PDF para o marceneiro (`js/projeto_marcenaria.js`): planta com armários numerados + quadro-resumo e especificações gerais; uma folha por armário (vista frontal cotada, corte lateral, lista de frentes, observações); lista de corte das frentes e caixas; tampos de granilite para o marmorista; vistas 3D. A especificação de portas/gavetas/nichos vem de `js/marcenaria.js` (`cabinetSpec`), a mesma usada pelo 3D — mudar a regra ali muda os dois.

Fogão a lenha: a chaminé (30×30, até acima do telhado) se alinha automaticamente ao pilar que estiver logo atrás do fogão (`lenhaChimney` em `data.js`), e a fornalha é espelhada para ficar sob ela — assim a chaminé nunca tampa o janelão.

Para adicionar um novo tipo de móvel: entrada em `KINDS` (data.js) → símbolo em `itemMarkup` (plan2d.js) → construtor `B.<kind>` (models.js).

## Convenções do app

- Unidades internas: **centímetros**; three.js usa metros (`cm / 100`).
- Estado do layout = lista de itens `{id, tipo, nome, x, y, rot, w, d, h, elev, ...}`; `x,y` = centro em planta, `w` ao longo do eixo local X, `d` profundidade (eixo local Y), `rot` em graus (horário, na planta).
- Itens suspensos (`elev > 0` e montados na parede) aparecem tracejados na planta (convenção de desenho).
- Layout salvo automaticamente em `localStorage` (`cozinha-layout-v1`); também exporta/importa JSON. `DEFAULT_ITEMS` (data.js) = layout que aparece na primeira abertura (sem nada salvo); foi atualizado em 2026-11-09 com o layout final do usuário (34 itens). O botão "restaurar proposta" volta a ele.
- Exportações: PDF da planta em **escala 1:50 (A4 paisagem)**; PNG das vistas 3D.
- Estilo: madeira de demolição (armários, vigas, triângulo da frente, molduras), granilite avermelhado, parede texturizada bege existente, piso porcelanato bege existente, telhado com caibros escuros aparentes.
- Geração de imagens / modelos 3D por IA: usar o conector **Muitto** (consome créditos — confirmar com o usuário antes).

## Premissas a confirmar com o usuário
- Altura da meia-parede (110) e topo do janelão (280).
- Dimensões dos itens novos (freezer 60×170×70, fogão a lenha 110×85×65 + chaminé, bancada prof. 62 / h 90).


## Histórico de geometria
- `GEOM` em `state.js` versiona a geometria; layouts salvos antigos são migrados em `migrateGeom` (v2: face direita 440→428, parede do fundo a partir de 108).

- Interface: abas **Planta baixa** e **3D** (detalhado). O modo de baixa fidelidade continua no código de `Viewer` (`hi=false`), mas não aparece mais na interface.
- Lava-louças: frente desenhada em canvas (`T.lavaLoucasFrente`), não usa mais a foto distorcida.
- Realismo do 3D detalhado: oclusão de ambiente (GTAO, `Viewer.setupComposer`; vidros não geram oclusão), relevo (bump) em tijolo, ferro fundido, madeiras e parede de grafiato.
- Vasos de ervas no peitoril: centralizados na faixa livre entre a borda e o caixilho (offset calculado em `B.acessorios`).
