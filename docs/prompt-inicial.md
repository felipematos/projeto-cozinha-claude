# Prompt inicial

Texto usado para iniciar este projeto no Claude Code, em 8 de novembro de 2026. Está reproduzido literalmente, como foi enviado; os requisitos foram refinados depois em conversa e a versão atual está em [`CLAUDE.md`](../CLAUDE.md).

> *Initial prompt used to start this project with Claude Code (November 8, 2026), kept verbatim in Portuguese. The current requirements are in [`CLAUDE.md`](../CLAUDE.md).*

---

Esta pasta tem o objetivo de fazer o projeto arquitetônico da cozinha da minha casa. Nela, há três sub-pastas:

* projeto - tem o projeto e planta da casa. O ambiente correto está identificado como "ÁREA COBERTA". Estou movendo a cozinha da área da sala para a área coberta externa. Um outro arquivo mostra o detalhe desse cômodo com marcações de onde eu quero fazer bancada e pia, parede e meia-parede com janelão. Há também um arquivo com as medidas dos móveis
* moveis: tem fotos de todos os móveis
* ambiente: tem fotos do ambiente em diferentes ângulos. Esse ambiente hoje não tem paredes, só colunas, mas meu objetivo é fechá-lo com parede, meia parede con janelão ou "paredes de vidro" móveis, também chamadas de persianas de vidro.


Eu quero criar 3 visualizações interativas do projeto, no formato de página web: planta baixa, 3D de baixa fidelidade navegável, e 3D detalhado (renderizado de forma mais detalhada a partir das fotos e das especificações do projeto), usando three.js ou similar.

Quero poder clicar e arrastar os móveis e redispô-los (mover e girar) na planta baixa, alterando então o modelo 3D. Deve ser possível salvar e exportar a planta em PDF e imagens estáticas de determinadas visões em 3D.

Recapitulando tudo o que eu preciso:

Transformar á area coberta em uma cozinha e copa semi-aberta. Nas laterais, a ideia é levantar meias-paredes e terminarei com janelões de vidro. Na parte da frente, farei uma parede retrátil de vidro, sendo a conexão com o telhado e dentro do triângulo cobertos com madeira.

Na parte interna, preciso de uma planta que comporte:
Na parte da cozinha (mais perto do fundo):

* 1 fogão de 6 bocas (modelo a gás, tradicional)
* 1 geladeira grande
* 1 freezer vertical*
* 1 fogão à lenha com 1 forno e 1 tremp*
* 1 filtro de pedra antigo (esse da foto, ao lado da geladeira. Ele é formado por toda a estrutura de metal e pedra, mais o filtro de barro).
* Uma bancada em L em granilite avermelhado, com uma pia grande*
* Lava-louças grande (em local alto)
* Armários em baixo da bancada e suspensos, sempre que possível*


Na parte da copa (mais na parte da frente, próxima à parede de vidro):

* 1 mesa de 8 lugares
* Um buffet de madeira de 1,80m
* 1 cadeira de balanço
* 1 parede com pratos decorativos*
* Armários suspensos sempre que possível para cristaleira*


Itens marcados com um "*" não existem hoje, portanto, não estão nas fotos de móveis e nem tem medidas. Eles devem ser imaginados por você e adicionados ao projeto.

Existem móveis que estão hoje no ambiente, mas não devem aparecer no projeto, como a estante branca, dentre outros. Considere apenas os móveis listados aqui.

Quero um aspecto arquitetônico mais rústico, com madeira de demolição.

Caso precise gerar imagens, utilize o conector Muitto. Ele também pode gerar elementos 3D a partir de imagens ou comandos de prompt.

As medidas do projeto devem ser rigorosamente proporcionais às medidas reais, conforme planta e arquivos do projeto.

Sugiro criar um arquivo CLAUDE.md inicializando o projeto e documentando essas instruções.
