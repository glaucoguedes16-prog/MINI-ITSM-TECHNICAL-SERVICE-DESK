/**
 * Mini-ITSM — Utilitários Técnicos NetOps & SysAdmin
 * 1. Calculadora IPv4 / CIDR
 * 2. Orçamento Óptico PON / FTTH
 * 3. Analisador de Logs MTR / Traceroute
 * 4. Gerador de Scripts PowerShell (AD) e Bash (Linux)
 */

(function () {
  function ipToInt(ip) {
    const parts = ip.trim().split(".");
    if (parts.length !== 4) return null;
    let num = 0;
    for (const p of parts) {
      if (!/^\d+$/.test(p)) return null;
      const n = Number(p);
      if (n < 0 || n > 255) return null;
      num = (num << 8) | n;
    }
    return num >>> 0;
  }

  function intToIp(int) {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join(".");
  }

  function calculateCIDR(ipStr, prefix) {
    const ipInt = ipToInt(ipStr);
    const cidr = Number(prefix);
    if (ipInt === null || isNaN(cidr) || cidr < 1 || cidr > 32) {
      return { error: "Endereço IPv4 ou prefixo CIDR (/1 a /32) inválido." };
    }
    const maskInt = cidr === 32 ? 0xffffffff : (~((1 << (32 - cidr)) - 1)) >>> 0;
    const wildcardInt = (~maskInt) >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;

    const totalAddresses = Math.pow(2, 32 - cidr);
    let usableHosts = totalAddresses - 2;
    let firstHost = intToIp((networkInt + 1) >>> 0);
    let lastHost = intToIp((broadcastInt - 1) >>> 0);

    if (cidr === 31) {
      usableHosts = 2;
      firstHost = intToIp(networkInt);
      lastHost = intToIp(broadcastInt);
    } else if (cidr === 32) {
      usableHosts = 1;
      firstHost = intToIp(networkInt);
      lastHost = intToIp(networkInt);
    }

    return {
      network: `${intToIp(networkInt)}/${cidr}`,
      mask: intToIp(maskInt),
      wildcard: intToIp(wildcardInt),
      broadcast: intToIp(broadcastInt),
      firstHost,
      lastHost,
      usableHosts: usableHosts.toLocaleString("pt-BR")
    };
  }

  function calculateOpticalBudget({ oltTx, fiberKm, splitter1Db, splitter2Db, splices }) {
    const fiberLoss = Number(fiberKm) * 0.35; // 0.35 dB/km padrão 1310/1490nm
    const spliceLoss = Number(splices) * 0.25; // média fusão + conector APC
    const totalAttenuation = fiberLoss + Number(splitter1Db) + Number(splitter2Db) + spliceLoss;
    const rxPower = Number(oltTx) - totalAttenuation;

    let status = "Excelente (Operação Ideal)";
    let badgeClass = "badge-success";
    if (rxPower < -27.5) {
      status = "Crítico (Risco de Queda / Atenuação Alta)";
      badgeClass = "badge-danger";
    } else if (rxPower < -24.5) {
      status = "Alerta (Margem Óptica Reduzida)";
      badgeClass = "badge-warning";
    }

    return {
      rxPower: rxPower.toFixed(2),
      totalAttenuation: totalAttenuation.toFixed(2),
      fiberLoss: fiberLoss.toFixed(2),
      status,
      badgeClass
    };
  }

  const SAMPLE_MTR_LOG = `Start: 2026-11-25T14:05:10-0300
HOST: noc-probe-pb01.corp.local        Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 10.10.0.1 (gw-lan-matriz)       0.0%   100    0.4   0.5   0.3   1.8   0.2
  2.|-- 172.16.254.1 (bgp-border-01)    0.0%   100    1.2   1.4   1.0   4.1   0.4
  3.|-- 187.45.112.1 (peering-ix-sp)    0.0%   100   18.4  19.1  17.9  25.3   1.1
  4.|-- 200.142.88.19 (transit-carrier) 14.0%  100   98.5 112.4  42.0 245.8  48.2
  5.|-- 54.232.118.42 (aws-sa-east-1)   13.0%  100  101.2 115.0  44.1 251.0  49.5`;

  function analyzeMtrLog(rawText) {
    const lines = rawText.split("
").map((l) => l.trim()).filter(Boolean);
    const hops = [];

    for (const line of lines) {
      // Match lines starting with hop number e.g. "4.|-- host 14.0% 100 98.5 112.4..."
      const match = line.match(/^(\d+)\.\|--\s+(\S+(?:\s+\([^)]+\))?)\s+(\d+(?:\.\d+)?)%\s+\d+\s+\S+\s+(\d+(?:\.\d+)?)/);
      if (match) {
        hops.push({
          hop: Number(match[1]),
          host: match[2],
          loss: Number(match[3]),
          avgMs: Number(match[4])
        });
      }
    }

    if (!hops.length) {
      return {
        error: "Não foi possível identificar saltos no formato MTR padrão. Clique em 'Carregar Exemplo' para testar."
      };
    }

    const bottleneck = hops.find((h) => h.loss >= 3 || h.avgMs >= 80);
    let diagnosis = "Rota estável sem perda relevante de pacotes ou jitter crítico.";
    let severity = "badge-success";

    if (bottleneck) {
      severity = bottleneck.loss >= 10 || bottleneck.avgMs >= 100 ? "badge-danger" : "badge-warning";
      const segment = bottleneck.hop <= 2 ? "Rede Interna / Borda Local" : "Backbone / Operadora de Trânsito";
      diagnosis = `Anomalia detectada a partir do Salto #${bottleneck.hop} (${bottleneck.host}) — Perda: ${bottleneck.loss}% | Latência Média: ${bottleneck.avgMs} ms. Escopo provável: ${segment}.`;
    }

    const reportText = [
      "=== LAUDO DE TRIAGEM DE ROTA (MINI-ITSM NOC) ===",
      `Saltos analisados: ${hops.length}`,
      `Diagnóstico: ${diagnosis}`,
      "Detalhamento crítico:",
      ...hops.map((h) => `  Salto ${h.hop}: ${h.host} | Loss: ${h.loss}% | Avg: ${h.avgMs}ms`)
    ].join("
");

    return {
      hops,
      diagnosis,
      severity,
      reportText
    };
  }

  function generateSysAdminScript(type, param) {
    const cleanParam = (param || "usuario.padrao").trim();
    if (type === "ad_user") {
      return `# PowerShell - Provisionamento Padronizado Active Directory
# Gerado via Mini-ITSM SysAdmin Lab
Import-Module ActiveDirectory

$SamAccount = "${cleanParam}"
$Domain     = "corp.local"
$OUPath     = "OU=Colaboradores,OU=Matriz,DC=corp,DC=local"
$Password   = ConvertTo-SecureString "Mudar@2026!" -AsPlainText -Force

New-ADUser \`
  -Name $SamAccount \`
  -SamAccountName $SamAccount \`
  -UserPrincipalName "$SamAccount@$Domain" \`
  -Path $OUPath \`
  -AccountPassword $Password \`
  -ChangePasswordAtLogon $true \`
  -Enabled $true

Add-ADGroupMember -Identity "GRP-VPN-Corporativa" -Members $SamAccount
Write-Host "[OK] Usuário $SamAccount provisionado e adicionado ao grupo VPN." -ForegroundColor Green`;
    }

    if (type === "linux_hardening") {
      const sshPort = /^\d+$/.test(cleanParam) ? cleanParam : "2222";
      return `#!/usr/bin/env bash
# Hardening Inicial SSH & Firewall UFW (Ubuntu/Debian)
set -euo pipefail

SSH_PORT="${sshPort}"
echo "[1/3] Aplicando backup de segurança em /etc/ssh/sshd_config..."
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F)

echo "[2/3] Configurando porta SSH $SSH_PORT e bloqueando login root..."
sudo sed -i "s/^#\?Port .*/Port $SSH_PORT/" /etc/ssh/sshd_config
sudo sed -i "s/^#\?PermitRootLogin .*/PermitRootLogin no/" /etc/ssh/sshd_config
sudo sed -i "s/^#\?PasswordAuthentication .*/PasswordAuthentication no/" /etc/ssh/sshd_config

echo "[3/3] Aplicando regras de firewall UFW..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow "$SSH_PORT"/tcp comment 'SSH Admin Seguro'
sudo ufw --force enable
sudo systemctl restart ssh
echo "[OK] Hardening aplicado com sucesso na porta $SSH_PORT."`;
    }

    return `# PowerShell - Coleta Rápida de Diagnóstico de Rede & DNS
$Target = "${cleanParam || "8.8.8.8"}"
Write-Output "=== ADAPTADORES ATIVOS ==="
Get-NetAdapter | Where-Object Status -eq "Up" | Select-Object Name, InterfaceDescription, LinkSpeed

Write-Output "\`n=== TESTE DE CONECTIVIDADE E ROTA ($Target) ==="
Test-NetConnection -ComputerName $Target -TraceRoute

Write-Output "\`n=== CACHE E SERVIDORES DNS CONFIGURADOS ==="
Get-DnsClientServerAddress -AddressFamily IPv4`;
  }

  window.ITSMDiagnostic = {
    calculateCIDR,
    calculateOpticalBudget,
    SAMPLE_MTR_LOG,
    analyzeMtrLog,
    generateSysAdminScript
  };
})();
