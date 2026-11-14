import re

UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}


def texto_opcional(dados, chave, limite):
    """Devolve (valor, erro) para texto opcional; vazio vira None."""
    valor = str(dados.get(chave) or "").strip()
    if len(valor) > limite:
        return None, f"{chave} deve ter no máximo {limite} caracteres"
    return (valor or None), None


def ler_uf(bruto):
    uf = str(bruto or "").strip().upper()
    if uf and uf not in UFS:
        return None, "estado inválido (use a sigla, ex.: MG)"
    return (uf or None), None


def ler_cep(bruto):
    cep = re.sub(r"\D", "", str(bruto or ""))
    if cep and len(cep) != 8:
        return None, "cep deve ter 8 dígitos"
    return (cep or None), None