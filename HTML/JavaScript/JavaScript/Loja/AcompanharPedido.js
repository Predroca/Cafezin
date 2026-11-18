
        /*
         * O status vem de data-status no #cardPedido.
         * Ao integrar com o backend, basta chamar atualizarStatus("Em rota"), por exemplo.
         */
        const ETAPAS = ["Pendente", "Em preparo", "Aguardando retirada", "Em rota", "Entregue"];

        const TEXTOS = {
            "Pendente": {
                titulo: "Aguardando a loja confirmar",
                mensagem: "Enviamos seu pedido. Assim que a loja aceitar, o preparo começa.",
                badge: "aguardando"
            },
            "Em preparo": {
                titulo: "Seu pedido está em preparo",
                mensagem: "A loja já confirmou e está preparando seus itens.",
                badge: "preparo"
            },
            "Aguardando retirada": {
                titulo: "Pedido pronto!",
                mensagem: "Seu pedido está pronto e esperando o entregador na loja.",
                badge: "aguardando"
            },
            "Em rota": {
                titulo: "Seu pedido está a caminho",
                mensagem: "O entregador já saiu. Fique atento, logo ele chega.",
                badge: "rota"
            },
            "Entregue": {
                titulo: "Pedido entregue",
                mensagem: "Esperamos que você aproveite. Obrigado por pedir no Cafézin!",
                badge: "entregue"
            }
        };

        function atualizarStatus(status) {
            const indice = ETAPAS.indexOf(status);
            if (indice === -1) return;

            const card = document.getElementById("cardPedido");
            card.dataset.status = status;

            document.querySelectorAll("#linhaTempo .etapa").forEach((etapa, i) => {
                etapa.classList.toggle("concluida", i < indice);
                etapa.classList.toggle("atual", i === indice);
                etapa.classList.toggle("futura", i > indice);
            });

            const texto = TEXTOS[status];
            const badge = document.getElementById("badgeStatus");
            badge.textContent = status === "Aguardando retirada" ? "Pronto para retirada" : status;
            badge.className = "statusBadge " + texto.badge;

            document.getElementById("tituloStatus").textContent = texto.titulo;
            document.getElementById("mensagemStatus").textContent = texto.mensagem;

            const porcentagem = Math.round(((indice + 1) / ETAPAS.length) * 100);
            document.getElementById("barraPreenchida").style.width = porcentagem + "%";
            card.querySelector(".barraProgresso").setAttribute("aria-valuenow", porcentagem);

            /* Entregador só aparece depois que o pedido está pronto */
            const comEntregador = indice >= 2;
            document.getElementById("entregadorAtribuido").hidden = !comEntregador;
            document.getElementById("entregadorAguardo").hidden = comEntregador;

            /* Cancelamento só enquanto a loja ainda não terminou o preparo */
            document.getElementById("areaCancelar").hidden = indice >= 2;
        }

        atualizarStatus(document.getElementById("cardPedido").dataset.status);
