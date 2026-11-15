(() => {
    const API = "http://localhost:5000";
    const DESCRIPTION_KEY = "cafezin.descricaoLoja";
    const token = () => localStorage.getItem("token");
    const headers = () => {
        const jwt = token();
        if (!jwt) throw new Error("Faça login como loja para visualizar e editar o perfil.");
        return { Authorization: `Bearer ${jwt}`, Accept: "application/json" };
    };
    const aviso = document.getElementById("aviso");

    async function request(path, options = {}) {
        const response = await fetch(API + path, { ...options, headers: { ...headers(), ...options.headers } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || data.message || `Falha (${response.status})`);
        return data;
    }
    function notify(text) {
        aviso.textContent = text;
        aviso.classList.add("visivel");
        clearTimeout(notify.timer);
        notify.timer = setTimeout(() => aviso.classList.remove("visivel"), 4000);
    }
    function setValue(key, value) {
        const node = document.querySelector(`[data-valor-para="${key}"]`);
        if (node) node.textContent = value || "Não informado";
    }
    async function loadProfile() {
        try {
            const p = await request("/loja/perfil");
            Object.entries({ nome: p.nome, cnpj: p.cnpj, email: p.email, telefone: p.telefone, foto_url: p.foto_url }).forEach(([k,v]) => setValue(k,v));
            const descricao = localStorage.getItem(DESCRIPTION_KEY) || "";
            setValue("descricao", descricao);
            const campoDescricao = document.getElementById("campoDescricaoLoja");
            if (campoDescricao) campoDescricao.value = descricao;
            Object.entries(p.endereco || {}).forEach(([k,v]) => setValue(k,v));
            document.getElementById("nomeLoja").textContent = p.nome || "Nome da loja";
            const url = p.foto_url ? (p.foto_url.startsWith("http") ? p.foto_url : API + p.foto_url) : "";
            [document.getElementById("fotoLoja"), document.getElementById("miniaturaFotoLoja")].forEach(img => {
                if (!img) return;
                img.hidden = !url;
                if (url) img.src = url;
            });
            setValue("horario_funcionamento", p.horario_abertura && p.horario_fecha ? `${p.horario_abertura} às ${p.horario_fecha}` : "Não informado");
            const resumo = document.getElementById("resumoHorario");
            if (resumo) resumo.textContent = p.horario_abertura && p.horario_fecha ? `Todos os dias: ${p.horario_abertura} às ${p.horario_fecha}` : "Não informado";
            // O endpoint guarda uma faixa geral, então a tela representa essa faixa em todos os dias.
            document.querySelectorAll(".horarioDia[data-dia]").forEach(row => {
                const aberto = row.querySelector("[data-aberto]");
                const inicio = row.querySelector("[data-abertura]");
                const fim = row.querySelector("[data-fechamento]");
                aberto.checked = Boolean(p.horario_abertura && p.horario_fecha);
                inicio.disabled = fim.disabled = !aberto.checked;
                inicio.value = p.horario_abertura || "";
                fim.value = p.horario_fecha || "";
                const status = row.querySelector("[data-status-dia]");
                if (status) status.textContent = aberto.checked ? "Aberto" : "Fechado";
            });
        } catch (error) { notify(error.message); }
    }
    function formDataFor(form) {
        const type = form.dataset.formulario;
        const value = name => (form.elements.namedItem(name)?.value || "").trim();
        if (type === "identificacao") return { nome: value("nome") };
        if (type === "contato") return { email: value("email"), telefone: value("telefone") };
        if (type === "endereco") return { endereco: { nome_logradouro: value("nome_logradouro"), numero: value("numero"), bairro: value("bairro"), cidade: value("cidade"), estado: value("estado").toUpperCase(), cep: value("cep").replace(/\D/g, "") } };
        if (type === "funcionamento") {
            const faixas = [...form.querySelectorAll(".horarioDia")].filter(row => row.querySelector("[data-aberto]").checked).map(row => ({ inicio: row.querySelector("[data-abertura]").value, fim: row.querySelector("[data-fechamento]").value }));
            if (!faixas.length) return { horario_abertura: null, horario_fecha: null };
            return { horario_abertura: faixas.map(x => x.inicio).sort()[0], horario_fecha: faixas.map(x => x.fim).sort().at(-1) };
        }
        return {};
    }
    async function uploadPhoto(file) {
        const body = new FormData(); body.append("foto", file);
        await request("/perfil/foto", { method: "POST", body });
    }
    document.addEventListener("change", async event => {
        const input = event.target;
        if (input.id !== "avatarFotoLoja" || !input.files?.[0]) return;
        const file = input.files[0];
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            notify("Selecione uma imagem de até 5 MB."); input.value = ""; return;
        }
        const avatar = document.getElementById("fotoLoja");
        const preview = URL.createObjectURL(file);
        avatar.src = preview; avatar.hidden = false;
        try { await uploadPhoto(file); notify("Foto da loja atualizada."); await loadProfile(); }
        catch (error) { notify(error.message || "Não foi possível enviar a foto."); await loadProfile(); }
        finally { URL.revokeObjectURL(preview); input.value = ""; }
    });
    document.addEventListener("submit", async event => {
        const form = event.target.closest("form[data-formulario]");
        if (!form) return;
        event.preventDefault(); event.stopImmediatePropagation();
        const button = form.querySelector('[type="submit"]');
        if (button) button.disabled = true;
        try {
            const body = formDataFor(form);
            if (form.dataset.formulario === "identificacao") localStorage.setItem(DESCRIPTION_KEY, form.querySelector("[name=descricao]").value.trim());
            if (Object.keys(body).length) await request("/loja/perfil", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            form.closest("dialog")?.close();
            notify(form.dataset.formulario === "identificacao" ? "Nome salvo no perfil. A descrição fica salva neste navegador até o back-end oferecer esse campo." : "Perfil atualizado com sucesso.");
            setTimeout(loadProfile, 150);
        } catch (error) { notify(error.message); }
        finally { if (button) button.disabled = false; }
    }, true);
    document.addEventListener("DOMContentLoaded", loadProfile);
    console.log(localStorage.getItem("token"))
})();
