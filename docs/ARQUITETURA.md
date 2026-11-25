# Documentação Técnica de Arquitetura — Mini-ITSM

## 1. Visão Geral

O **Mini-ITSM** foi arquitetado sob o padrão **Zero-Build Static SPA** (Single Page Application estática sem etapa de transpilação obrigatória). Essa decisão garante:

- **Compatibilidade imediata com GitHub Pages** sem necessidade de pipelines de build externos ou servidores Node/PHP em produção.
- **Portabilidade total:** funciona tanto via HTTPS (`github.io` ou domínio próprio) quanto localmente via servidor HTTP simples.
- **Persistência resiliente:** todas as operações de criação, edição, triagem e notas são gravadas em `localStorage` sob a chave versionada `mini_itsm_state_v2`.

## 2. Modelo de Dados (Entidades Principais)

### Ticket (Incidente / Solicitação)
- `id`: Identificador sequencial no formato `INC-YYYY-XXXX`.
- `priority`: `P1` (SLA 2h), `P2` (SLA 4h), `P3` (SLA 12h), `P4` (SLA 24h).
- `queue`: `Service Desk N1`, `Redes & NOC`, `Infraestrutura & Cloud`, `Sistemas & AD`, `Field Service`.
- `triageChecklist`: Objeto booleano (`icmp`, `link`, `dns`, `logs`) que documenta os testes técnicos obrigatórios antes do escalonamento.
- `notes`: Array cronológico de pareceres técnicos públicos ou internos (`internal: boolean`).

### Asset (Item de Configuração — CMDB)
- `id`: Tag patrimonial/lógica (`AST-XXX`).
- `type`: `Servidor`, `Roteador / Core`, `OLT / Fibra`, `Switch Gerenciável`, `Cloud AWS`, `Estação de Trabalho`.
- `status`: `Online`, `Alerta`, `Offline`.

## 3. Separação de Responsabilidades (`js/`)

| Módulo | Responsabilidade |
| :--- | :--- |
| `js/data.js` | Fornece a carga inicial (seed) com cenários realistas de NOC, Active Directory, Linux e AWS. |
| `js/storage.js` | Encapsula leitura/escrita no `localStorage`, exportação `.csv` com BOM UTF-8 (compatível com Excel PT-BR) e serialização `.json`. |
| `js/diagnostic.js` | Contém funções puras para cálculo de sub-redes IPv4, atenuação óptica GPON, parsing de saída `mtr` e geração de scripts `.ps1`/`.sh`. |
| `js/charts.js` | Gerencia ciclo de vida (criação e destruição segura) das instâncias `Chart.js`. |
| `js/app.js` | Orquestra navegação entre views, busca global instantânea (`/`), controle de perfil simulado (RBAC) e modais. |
