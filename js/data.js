/**
 * Mini-ITSM — Dados Iniciais Realistas (Seed Data)
 * Simula ambiente corporativo híbrido (Provedor/NOC, Infraestrutura On-Premise e Cloud AWS)
 */

window.MINI_ITSM_SEED = {
  tickets: [
    {
      id: "INC-2026-1041",
      title: "Degradação de sinal óptico (Rx -28.4 dBm) na PON 0/3 - OLT Core",
      category: "Redes & Conectividade",
      priority: "P1",
      queue: "Redes & NOC",
      status: "Em Atendimento",
      requester: "Monitoramento Zabbix / NOC",
      assignee: "Glauco Guedes",
      assetId: "AST-002",
      createdAt: "2026-11-25T13:10:00",
      slaDeadline: "2026-11-25T15:10:00",
      slaStatus: "Em Risco",
      description: "Alarme disparado pelo Zabbix/Grafana indicando atenuação abrupta de -28.4 dBm em 18 ONUs vinculadas à CTO-14 após manutenção preventiva na rede externa.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: true,
        logs: true
      },
      notes: [
        {
          author: "Glauco Guedes",
          timestamp: "2026-11-25 13:22",
          internal: true,
          text: "Triagem N2 concluída: potência Tx da OLT normal (+3.5 dBm). Queda concentrada exclusivamente na derivação da CTO-14. Acionada equipe de fusão óptica."
        }
      ]
    },
    {
      id: "INC-2026-1040",
      title: "Falha de replicação SYSVOL entre Controladores de Domínio AD",
      category: "Sistemas & Active Directory",
      priority: "P1",
      queue: "Sistemas & AD",
      status: "Em Triagem",
      requester: "Auditoria Interna",
      assignee: "Rafael Andrade",
      assetId: "AST-001",
      createdAt: "2026-11-25T13:45:00",
      slaDeadline: "2026-11-25T15:45:00",
      slaStatus: "No Prazo",
      description: "Novas GPOs aplicadas no SRV-AD-01 não estão propagando para o servidor secundário SRV-AD-02. Diagnóstico dcdiag aponta erro DFSR 4012.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: false,
        logs: true
      },
      notes: [
        {
          author: "Rafael Andrade",
          timestamp: "2026-11-25 14:00",
          internal: true,
          text: "Verificando sincronização NTP e zonas DNS reversas entre os dois controladores."
        }
      ]
    },
    {
      id: "INC-2026-1039",
      title: "Latência elevada e perda de pacotes (12%) no link de saída BGP",
      category: "Redes & Conectividade",
      priority: "P2",
      queue: "Redes & NOC",
      status: "Em Atendimento",
      requester: "Operações Corporativas",
      assignee: "Glauco Guedes",
      assetId: "AST-003",
      createdAt: "2026-11-25T11:30:00",
      slaDeadline: "2026-11-25T15:30:00",
      slaStatus: "Em Risco",
      description: "Usuários relatam lentidão em sistemas SaaS e chamadas VoIP. Testes WinMTR mostram perda de pacotes a partir do salto 4 na operadora de trânsito.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: true,
        logs: true
      },
      notes: [
        {
          author: "Glauco Guedes",
          timestamp: "2026-11-25 12:05",
          internal: false,
          text: "Tráfego redirecionado temporariamente via rota secundária BGP enquanto aguardamos normalização da operadora."
        }
      ]
    },
    {
      id: "INC-2026-1038",
      title: "Instância EC2 de homologação com disco raiz em 94% de ocupação",
      category: "Infraestrutura & Servidores",
      priority: "P2",
      queue: "Infraestrutura & Cloud",
      status: "Aberto",
      requester: "CloudWatch Alarm (AWS)",
      assignee: "Camila Nogueira",
      assetId: "AST-004",
      createdAt: "2026-11-25T12:15:00",
      slaDeadline: "2026-11-25T16:15:00",
      slaStatus: "No Prazo",
      description: "Volume EBS /dev/xvda1 da instância aws-ec2-erp-stage atingiu 94% devido ao acúmulo de logs de containers Docker não rotacionados.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: false,
        logs: false
      },
      notes: []
    },
    {
      id: "INC-2026-1037",
      title: "Bloqueio recorrente de conta corporativa no Active Directory",
      category: "Segurança da Informação",
      priority: "P3",
      queue: "Service Desk N1",
      status: "Aguardando Terceiro",
      requester: "Fernanda Lima (Contabilidade)",
      assignee: "Lucas Ferreira",
      assetId: "AST-006",
      createdAt: "2026-11-25T09:10:00",
      slaDeadline: "2026-11-25T21:10:00",
      slaStatus: "No Prazo",
      description: "Conta bloqueada a cada 30 minutos após troca de senha. Suspeita de credencial em cache no dispositivo móvel corporativo ou sessão RDP antiga.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: true,
        logs: true
      },
      notes: [
        {
          author: "Lucas Ferreira",
          timestamp: "2026-11-25 09:45",
          internal: false,
          text: "Event ID 4740 identificado originando do notebook antigo da usuária. Aguardando confirmação de desligamento da máquina."
        }
      ]
    },
    {
      id: "INC-2026-1036",
      title: "Substituição de fonte redundante com falha no Switch Core L3",
      category: "Hardware & Ativos",
      priority: "P2",
      queue: "Field Service",
      status: "Resolvido",
      requester: "NOC Matriz",
      assignee: "Glauco Guedes",
      assetId: "AST-005",
      createdAt: "2026-11-24T14:00:00",
      slaDeadline: "2026-11-24T18:00:00",
      slaStatus: "Cumprido",
      description: "PSU-2 apresentou falha de ventoinha e alerta SNMP. Realizada substituição hot-swap sem interrupção dos serviços.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: true,
        logs: true
      },
      notes: [
        {
          author: "Glauco Guedes",
          timestamp: "2026-11-24 16:30",
          internal: false,
          text: "Módulo PSU substituído com sucesso. Sensores térmicos e redundância validados via SNMP e CLI."
        }
      ]
    },
    {
      id: "INC-2026-1035",
      title: "Provisionamento de VPN SSL e permissões de rede para novo analista",
      category: "Sistemas & Active Directory",
      priority: "P4",
      queue: "Service Desk N1",
      status: "Resolvido",
      requester: "Recursos Humanos",
      assignee: "Lucas Ferreira",
      assetId: "AST-001",
      createdAt: "2026-11-24T08:30:00",
      slaDeadline: "2026-11-25T08:30:00",
      slaStatus: "Cumprido",
      description: "Criação de usuário no AD, inclusão no grupo VPN-Remote-Users e envio de certificado MFA.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: true,
        logs: true
      },
      notes: [
        {
          author: "Lucas Ferreira",
          timestamp: "2026-11-24 10:15",
          internal: false,
          text: "Acesso testado remotamente com o colaborador."
        }
      ]
    },
    {
      id: "INC-2026-1034",
      title: "Ajuste de VLAN de voz (QoS) no setor de Atendimento",
      category: "Redes & Conectividade",
      priority: "P3",
      queue: "Redes & NOC",
      status: "Resolvido",
      requester: "Coordenação Call Center",
      assignee: "Glauco Guedes",
      assetId: "AST-005",
      createdAt: "2026-11-23T15:00:00",
      slaDeadline: "2026-11-24T03:00:00",
      slaStatus: "Cumprido",
      description: "Priorização DSCP EF (46) aplicada nas portas de acesso para eliminar picotes de áudio em horários de pico.",
      triageChecklist: {
        icmp: true,
        link: true,
        dns: true,
        logs: true
      },
      notes: []
    }
  ],

  assets: [
    {
      id: "AST-001",
      hostname: "SRV-AD-01.corp.local",
      type: "Servidor",
      ip: "10.10.0.10",
      location: "Rack 01 - Datacenter Matriz",
      os: "Windows Server 2022 Datacenter",
      status: "Alerta"
    },
    {
      id: "AST-002",
      hostname: "OLT-GPON-CORE-01",
      type: "OLT / Fibra",
      ip: "10.20.1.1",
      location: "POP Central - Bastidor Óptico",
      os: "Huawei MA5800-X7 (V800R021)",
      status: "Alerta"
    },
    {
      id: "AST-003",
      hostname: "BGP-BORDER-RTR01",
      type: "Roteador / Core",
      ip: "172.16.254.1",
      location: "POP Central - Core Routing",
      os: "MikroTik CCR2216 (RouterOS 7.15)",
      status: "Online"
    },
    {
      id: "AST-004",
      hostname: "aws-ec2-erp-stage",
      type: "Cloud AWS",
      ip: "54.232.118.42",
      location: "AWS sa-east-1 (São Paulo)",
      os: "Ubuntu Server 24.04 LTS",
      status: "Alerta"
    },
    {
      id: "AST-005",
      hostname: "SW-CORE-L3-DIST01",
      type: "Switch Gerenciável",
      ip: "10.10.0.2",
      location: "Rack 01 - Datacenter Matriz",
      os: "Cisco Catalyst 9300 (IOS-XE 17.9)",
      status: "Online"
    },
    {
      id: "AST-006",
      hostname: "WKS-FIN-014",
      type: "Estação de Trabalho",
      ip: "10.10.20.114",
      location: "2º Andar - Setor Contábil",
      os: "Windows 11 Pro 23H2",
      status: "Online"
    },
    {
      id: "AST-007",
      hostname: "SRV-MON-ZABBIX01",
      type: "Servidor",
      ip: "10.10.0.25",
      location: "Rack 02 - NOC",
      os: "Debian 12 + Zabbix 7.0 / Grafana",
      status: "Online"
    }
  ],

  kbArticles: [
    {
      id: "KB-001",
      title: "POP-01: Diagnóstico de Atenuação Óptica e Queda PPPoE em Clientes FTTH",
      category: "Redes & Fibra",
      tags: ["ftth", "onu", "olt", "pppoe", "sinal"],
      updatedAt: "2026-11-20",
      steps: [
        "Consultar nível de sinal Rx/Tx da ONU diretamente na OLT (faixa ideal: -14 dBm a -24 dBm).",
        "Verificar se a queda é isolada (drop/conector APC) ou massiva na mesma porta PON / CTO.",
        "Checar logs de autenticação PPPoE no concentrador (erros de PADT, timeout ou MAC duplicado).",
        "Caso sinal esteja abaixo de -27 dBm, abrir OS para equipe de campo com medição OTDR."
      ],
      command: "display ont optical-info 0 all | include -27|-28|-29"
    },
    {
      id: "KB-002",
      title: "POP-02: Troubleshooting de Replicação Active Directory e DNS Interno",
      category: "Windows Server & AD",
      tags: ["active directory", "dns", "windows server", "gpo", "dfsr"],
      updatedAt: "2026-11-18",
      steps: [
        "Validar sincronia de relógio (NTP) entre todos os Controladores de Domínio (diferença máxima de 5 minutos para Kerberos).",
        "Executar diagnóstico completo de saúde dos controladores com dcdiag e repadmin.",
        "Confirmar se os apontamentos DNS primários das estações apontam exclusivamente para os DCs internos.",
        "Forçar sincronização de políticas e verificar logs Directory Service no Event Viewer."
      ],
      command: "repadmin /syncall /AdeP && dcdiag /test:dns"
    },
    {
      id: "KB-003",
      title: "POP-03: Contenção de Disco Cheio em Instâncias Linux / Docker na AWS",
      category: "Linux & Cloud AWS",
      tags: ["linux", "aws", "ec2", "docker", "disco"],
      updatedAt: "2026-11-22",
      steps: [
        "Identificar partições críticas e diretórios com maior consumo utilizando df -h e du.",
        "Limpar imagens, volumes órfãos e logs antigos de containers Docker sem afetar containers ativos.",
        "Configurar logrotate ou driver json-file com max-size no daemon.json do Docker.",
        "Se necessário, expandir volume EBS no console AWS e estender o sistema de arquivos com growpart/resize2fs."
      ],
      command: "df -h && docker system df && journalctl --vacuum-time=7d"
    },
    {
      id: "KB-004",
      title: "POP-04: Resposta Inicial a Bloqueio Recorrente de Conta (Brute Force / Cache)",
      category: "Segurança & Acesso",
      tags: ["segurança", "event 4740", "bloqueio", "ad"],
      updatedAt: "2026-11-15",
      steps: [
        "Consultar o Event ID 4740 no Controlador de Domínio PDC Emulator para identificar o Caller Computer Name.",
        "Verificar tarefas agendadas, serviços rodando com credencial nominal ou sessões RDP desconectadas na estação de origem.",
        "Limpar o Gerenciador de Credenciais do Windows e reconectar perfis Wi-Fi corporativos (802.1X).",
        "Caso a origem seja externa (VPN/OWA), analisar IP no firewall e aplicar bloqueio GeoIP/Fail2Ban."
      ],
      command: "Get-WinEvent -FilterHashtable @{LogName='Security';Id=4740} -MaxEvents 5"
    }
  ],

  activities: [
    {
      text: "Glauco Guedes atualizou a triagem técnica do incidente INC-2026-1041 (OLT Core)",
      time: "Hoje, 13:22",
      type: "info"
    },
    {
      text: "Alarme automático vinculou AST-004 (aws-ec2-erp-stage) ao chamado INC-2026-1038",
      time: "Hoje, 12:15",
      type: "warning"
    },
    {
      text: "Rota BGP secundária ativada para mitigar perda de pacotes no INC-2026-1039",
      time: "Hoje, 12:05",
      type: "info"
    },
    {
      text: "Incidente INC-2026-1036 encerrado dentro do SLA com troca de PSU no Switch Core",
      time: "Ontem, 16:30",
      type: "success"
    }
  ]
};
