/**
 * Mini-ITSM — Controlador Principal da Aplicação
 * Roteamento SPA, Gestão de Chamados, Triagem Técnica N1/N2, CMDB, Runbooks e RBAC.
 */

(function () {
  let state = window.ITSMStorage.loadState();
  let currentView = "dashboard";
  let ticketDisplayMode = "list"; // 'list' | 'kanban'
  let currentRole = "manager"; // 'manager' | 'analyst_n2' | 'support_n1'

  const ROLE_DESCRIPTIONS = {
    manager: "Acesso total: gestão de filas, ativos, relatórios e exclusão",
    analyst_n2: "Analista N2: triagem avançada, escalonamento e gestão de CMDB",
    support_n1: "Suporte N1: abertura, checklist de triagem e atendimento inicial"
  };

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 220);
    }, 3200);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getPriorityBadge(priority) {
    const map = {
      P1: '<span class="badge badge-danger">P1 • Crítica</span>',
      P2: '<span class="badge badge-warning">P2 • Alta</span>',
      P3: '<span class="badge badge-info">P3 • Média</span>',
      P4: '<span class="badge badge-neutral">P4 • Baixa</span>'
    };
    return map[priority] || `<span class="badge badge-neutral">${escapeHtml(priority)}</span>`;
  }

  function getStatusBadge(status) {
    const map = {
      "Aberto": '<span class="badge badge-indigo">Aberto</span>',
      "Em Triagem": '<span class="badge badge-info">Em Triagem</span>',
      "Em Atendimento": '<span class="badge badge-warning">Em Atendimento</span>',
      "Aguardando Terceiro": '<span class="badge badge-neutral">Aguardando Terceiro</span>',
      "Resolvido": '<span class="badge badge-success">Resolvido</span>'
    };
    return map[status] || `<span class="badge badge-neutral">${escapeHtml(status)}</span>`;
  }

  function getSlaBadge(slaStatus) {
    const map = {
      "No Prazo": '<span class="badge badge-success">No Prazo</span>',
      "Cumprido": '<span class="badge badge-success">Cumprido</span>',
      "Em Risco": '<span class="badge badge-warning">Em Risco</span>',
      "Violado": '<span class="badge badge-danger">Violado</span>'
    };
    return map[slaStatus] || `<span class="badge badge-neutral">${escapeHtml(slaStatus)}</span>`;
  }

  function getAssetStatusBadge(status) {
    const map = {
      Online: '<span class="badge badge-success">Online</span>',
      Alerta: '<span class="badge badge-warning">Alerta</span>',
      Offline: '<span class="badge badge-danger">Offline</span>'
    };
    return map[status] || `<span class="badge badge-neutral">${escapeHtml(status)}</span>`;
  }

  // Navigation
  function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${viewName}`);
    });
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    // Close mobile sidebar
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarBackdrop").classList.remove("open");

    renderAll();
  }

  function updateSidebarCounters() {
    const openTickets = state.tickets.filter((t) => t.status !== "Resolvido");
    const alertAssets = state.assets.filter((a) => a.status !== "Online");
    document.getElementById("navOpenTicketsCount").textContent = openTickets.length;
    document.getElementById("navAlertAssetsCount").textContent = alertAssets.length;

    const total = state.tickets.length || 1;
    const withinSla = state.tickets.filter((t) => t.slaStatus !== "Violado").length;
    const slaPct = ((withinSla / total) * 100).toFixed(1) + "%";
    document.getElementById("topbarSlaValue").textContent = slaPct;

    // Notifications list
    const riskyTickets = openTickets.filter((t) => t.priority === "P1" || t.slaStatus === "Em Risco");
    const alertsCount = riskyTickets.length + alertAssets.length;
    document.getElementById("alertsCounterBadge").textContent = alertsCount;
    document.getElementById("notificationDot").style.display = alertsCount > 0 ? "block" : "none";

    const notifList = document.getElementById("notificationsList");
    if (!alertsCount) {
      notifList.innerHTML = `<div class="alert-item">Nenhum alerta crítico pendente no momento.</div>`;
    } else {
      notifList.innerHTML = [
        ...riskyTickets.map(
          (t) => `<div class="alert-item" data-open-ticket="${escapeHtml(t.id)}">
            <strong>${escapeHtml(t.id)} (${escapeHtml(t.priority)})</strong>
            <div>${escapeHtml(t.title)}</div>
          </div>`
        ),
        ...alertAssets.map(
          (a) => `<div class="alert-item" data-goto="assets">
            <strong>Ativo em ${escapeHtml(a.status)}: ${escapeHtml(a.hostname)}</strong>
            <div>IP ${escapeHtml(a.ip)} • ${escapeHtml(a.location)}</div>
          </div>`
        )
      ].join("");
    }
  }

  // Render Dashboard
  function renderDashboard() {
    const openCount = state.tickets.filter((t) => t.status !== "Resolvido").length;
    const criticalCount = state.tickets.filter((t) => t.status !== "Resolvido" && t.priority === "P1").length;
    const resolvedCount = state.tickets.filter((t) => t.status === "Resolvido").length;
    const withinSla = state.tickets.filter((t) => t.slaStatus !== "Violado").length;
    const slaRate = ((withinSla / (state.tickets.length || 1)) * 100).toFixed(1);

    const kpiGrid = document.getElementById("dashboardKpiGrid");
    kpiGrid.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Chamados em Aberto</span>
          <div class="kpi-icon"><i data-lucide="inbox"></i></div>
        </div>
        <div class="kpi-value">${openCount}</div>
        <div class="kpi-trend">${resolvedCount} resolvidos no ciclo atual</div>
      </div>
      <div class="kpi-card accent-green">
        <div class="kpi-top">
          <span class="kpi-label">Conformidade de SLA</span>
          <div class="kpi-icon"><i data-lucide="check-circle-2"></i></div>
        </div>
        <div class="kpi-value">${slaRate}%</div>
        <div class="kpi-trend">Meta corporativa ITIL: &ge; 92.0%</div>
      </div>
      <div class="kpi-card accent-orange">
        <div class="kpi-top">
          <span class="kpi-label">MTTR Médio (Resolução)</span>
          <div class="kpi-icon"><i data-lucide="timer"></i></div>
        </div>
        <div class="kpi-value">2h 18m</div>
        <div class="kpi-trend">-14 min vs. semana anterior</div>
      </div>
      <div class="kpi-card accent-red">
        <div class="kpi-top">
          <span class="kpi-label">Incidentes Críticos (P1)</span>
          <div class="kpi-icon"><i data-lucide="alert-triangle"></i></div>
        </div>
        <div class="kpi-value">${criticalCount}</div>
        <div class="kpi-trend">Atuação prioritária NOC / Infra</div>
      </div>
    `;

    // Critical Tickets Table
    const criticalList = state.tickets
      .filter((t) => t.status !== "Resolvido")
      .sort((a, b) => a.priority.localeCompare(b.priority))
      .slice(0, 5);

    const tbody = document.getElementById("criticalTicketsBody");
    tbody.innerHTML = criticalList
      .map(
        (t) => `
      <tr>
        <td class="ticket-id-cell">${escapeHtml(t.id)}</td>
        <td>
          <strong>${escapeHtml(t.title)}</strong>
          <div class="card-subtitle">${escapeHtml(t.category)}</div>
        </td>
        <td>${getPriorityBadge(t.priority)}</td>
        <td>${escapeHtml(t.queue)}</td>
        <td>${getSlaBadge(t.slaStatus)}</td>
        <td>
          <button class="btn btn-outline btn-sm" data-open-ticket="${escapeHtml(t.id)}">Triar</button>
        </td>
      </tr>
    `
      )
      .join("");

    // Activity Feed
    const feed = document.getElementById("dashboardActivityFeed");
    feed.innerHTML = state.activities
      .slice(0, 6)
      .map(
        (act) => `
      <div class="activity-item">
        <span class="activity-dot"></span>
        <div class="activity-content">
          <div>${escapeHtml(act.text)}</div>
          <div class="activity-time">${escapeHtml(act.time)}</div>
        </div>
      </div>
    `
      )
      .join("");

    if (currentView === "dashboard") {
      window.ITSMCharts.renderDashboardCharts(state);
    }
  }

  // Render Tickets (Table & Kanban)
  function getFilteredTickets() {
    const q = document.getElementById("filterTicketSearch").value.toLowerCase().trim();
    const status = document.getElementById("filterTicketStatus").value;
    const priority = document.getElementById("filterTicketPriority").value;
    const queue = document.getElementById("filterTicketQueue").value;

    return state.tickets.filter((t) => {
      const matchQuery =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.requester.toLowerCase().includes(q) ||
        (t.assetId && t.assetId.toLowerCase().includes(q));
      const matchStatus = status === "all" || t.status === status;
      const matchPriority = priority === "all" || t.priority === priority;
      const matchQueue = queue === "all" || t.queue === queue;
      return matchQuery && matchStatus && matchPriority && matchQueue;
    });
  }

  function renderTickets() {
    const filtered = getFilteredTickets();
    const listContainer = document.getElementById("ticketsListContainer");
    const kanbanContainer = document.getElementById("ticketsKanbanContainer");

    if (ticketDisplayMode === "list") {
      listContainer.classList.remove("hidden");
      kanbanContainer.classList.add("hidden");

      const tbody = document.getElementById("ticketsTableBody");
      if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--slate-500);">Nenhum chamado encontrado com os filtros selecionados.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered
        .map((t) => {
          const asset = state.assets.find((a) => a.id === t.assetId);
          return `
          <tr>
            <td class="ticket-id-cell">${escapeHtml(t.id)}</td>
            <td>
              <strong>${escapeHtml(t.title)}</strong>
              <div class="card-subtitle">${escapeHtml(t.category)}${asset ? ` • Ativo: ${escapeHtml(asset.hostname)}` : ""}</div>
            </td>
            <td>${escapeHtml(t.requester)}</td>
            <td>${getPriorityBadge(t.priority)}</td>
            <td>
              <div>${escapeHtml(t.queue)}</div>
              <div class="card-subtitle">${escapeHtml(t.assignee)}</div>
            </td>
            <td>${getStatusBadge(t.status)}</td>
            <td>${getSlaBadge(t.slaStatus)}</td>
            <td>
              <button class="btn btn-outline btn-sm" data-open-ticket="${escapeHtml(t.id)}">Detalhes</button>
            </td>
          </tr>
        `;
        })
        .join("");
    } else {
      listContainer.classList.add("hidden");
      kanbanContainer.classList.remove("hidden");

      const statuses = ["Aberto", "Em Triagem", "Em Atendimento", "Aguardando Terceiro", "Resolvido"];
      kanbanContainer.innerHTML = statuses
        .map((st) => {
          const items = filtered.filter((t) => t.status === st);
          return `
          <div class="kanban-column">
            <div class="kanban-col-header">
              <span>${escapeHtml(st)}</span>
              <span class="badge badge-neutral">${items.length}</span>
            </div>
            ${items
              .map(
                (t) => `
              <div class="kanban-card" data-open-ticket="${escapeHtml(t.id)}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="ticket-id-cell">${escapeHtml(t.id)}</span>
                  ${getPriorityBadge(t.priority)}
                </div>
                <div class="kanban-card-title">${escapeHtml(t.title)}</div>
                <div class="kanban-card-meta">
                  <span>${escapeHtml(t.queue)}</span>
                  <span>${escapeHtml(t.assignee.split(" ")[0])}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `;
        })
        .join("");
    }
  }

  // Ticket Detail & Triage Modal
  function openTicketDetailModal(ticketId) {
    const ticket = state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const asset = state.assets.find((a) => a.id === ticket.assetId);
    const checklist = ticket.triageChecklist || { icmp: false, link: false, dns: false, logs: false };
    const checkedCount = Object.values(checklist).filter(Boolean).length;

    document.getElementById("detailTicketBadges").innerHTML = `
      <span class="ticket-id-cell" style="margin-right:8px;">${escapeHtml(ticket.id)}</span>
      ${getPriorityBadge(ticket.priority)}
      ${getStatusBadge(ticket.status)}
      ${getSlaBadge(ticket.slaStatus)}
    `;
    document.getElementById("detailTicketTitle").textContent = ticket.title;

    const canDelete = currentRole === "manager";

    document.getElementById("ticketDetailBody").innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px;background:var(--slate-50);padding:12px;border-radius:8px;">
        <div><label>Solicitante</label><div>${escapeHtml(ticket.requester)}</div></div>
        <div><label>Categoria</label><div>${escapeHtml(ticket.category)}</div></div>
        <div><label>Ativo CMDB</label><div>${asset ? `${escapeHtml(asset.hostname)} (${escapeHtml(asset.ip)})` : "Não vinculado"}</div></div>
        <div><label>Analista Atual</label><div>${escapeHtml(ticket.assignee)}</div></div>
      </div>

      <div class="form-group">
        <label>Descrição Técnica do Incidente</label>
        <p style="font-size:0.88rem;color:var(--slate-700);background:var(--white);border:1px solid var(--slate-200);padding:12px;border-radius:6px;">
          ${escapeHtml(ticket.description)}
        </p>
      </div>

      <!-- Mandatory N1 -> N2 Technical Triage Checklist -->
      <div class="triage-box">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:0.88rem;color:var(--navy-900);">Protocolo de Triagem Técnica N1 &rarr; N2</strong>
          <span class="badge ${checkedCount === 4 ? "badge-success" : "badge-info"}">${checkedCount}/4 verificados</span>
        </div>
        <div class="triage-checklist">
          <label class="check-item">
            <input type="checkbox" data-triage-key="icmp" ${checklist.icmp ? "checked" : ""} />
            <span>Teste ICMP / Latência & Perda de Pacotes</span>
          </label>
          <label class="check-item">
            <input type="checkbox" data-triage-key="link" ${checklist.link ? "checked" : ""} />
            <span>Status Físico / Porta Switch / Sinal ONU</span>
          </label>
          <label class="check-item">
            <input type="checkbox" data-triage-key="dns" ${checklist.dns ? "checked" : ""} />
            <span>Resolução DNS / Gateway / Roteamento</span>
          </label>
          <label class="check-item">
            <input type="checkbox" data-triage-key="logs" ${checklist.logs ? "checked" : ""} />
            <span>Coleta de Logs (Event Viewer / Syslog / MTR)</span>
          </label>
        </div>
      </div>

      <!-- Workflow Controls -->
      <div class="form-row">
        <div class="form-group">
          <label for="detailStatusSelect">Atualizar Status</label>
          <select id="detailStatusSelect">
            ${["Aberto", "Em Triagem", "Em Atendimento", "Aguardando Terceiro", "Resolvido"]
              .map((s) => `<option value="${s}" ${ticket.status === s ? "selected" : ""}>${s}</option>`)
              .join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="detailQueueSelect">Escalonar Fila</label>
          <select id="detailQueueSelect">
            ${["Service Desk N1", "Redes & NOC", "Infraestrutura & Cloud", "Sistemas & AD", "Field Service"]
              .map((q) => `<option value="${q}" ${ticket.queue === q ? "selected" : ""}>${q}</option>`)
              .join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="detailAssigneeSelect">Responsável</label>
          <select id="detailAssigneeSelect">
            ${["Glauco Guedes", "Rafael Andrade", "Camila Nogueira", "Lucas Ferreira"]
              .map((a) => `<option value="${a}" ${ticket.assignee === a ? "selected" : ""}>${a}</option>`)
              .join("")}
          </select>
        </div>
      </div>

      <div class="btn-row" style="justify-content:space-between;margin-bottom:18px;">
        <button type="button" class="btn btn-primary" id="saveTicketChangesBtn">Salvar Alterações</button>
        ${canDelete ? `<button type="button" class="btn btn-danger btn-sm" id="deleteTicketBtn">Excluir Chamado</button>` : ""}
      </div>

      <!-- Technical Notes Timeline -->
      <div style="border-top:1px solid var(--slate-200);padding-top:16px;">
        <label>Histórico de Atendimento & Notas Técnicas (${ticket.notes.length})</label>
        <div class="notes-list">
          ${
            ticket.notes.length
              ? ticket.notes
                  .map(
                    (n) => `
              <div class="note-card ${n.internal ? "internal" : ""}">
                <div class="note-meta">
                  <strong>${escapeHtml(n.author)} ${n.internal ? "(Nota Interna N2)" : "(Atualização Pública)"}</strong>
                  <span>${escapeHtml(n.timestamp)}</span>
                </div>
                <div>${escapeHtml(n.text)}</div>
              </div>
            `
                  )
                  .join("")
              : `<div style="font-size:0.83rem;color:var(--slate-500);">Nenhuma nota técnica registrada ainda.</div>`
          }
        </div>

        <div class="form-group mt-16">
          <textarea id="newTicketNoteInput" rows="2" placeholder="Registrar diagnóstico técnico, comando executado ou parecer de resolução..."></textarea>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <label class="check-item">
            <input type="checkbox" id="newNoteInternalCheck" checked />
            <span>Nota técnica interna (equipe TI)</span>
          </label>
          <button type="button" class="btn btn-outline btn-sm" id="addTicketNoteBtn">Adicionar Nota</button>
        </div>
      </div>
    `;

    // Bind checklist updates
    document.querySelectorAll("[data-triage-key]").forEach((cb) => {
      cb.addEventListener("change", () => {
        ticket.triageChecklist = ticket.triageChecklist || {};
        ticket.triageChecklist[cb.dataset.triageKey] = cb.checked;
        window.ITSMStorage.saveState(state);
        openTicketDetailModal(ticketId);
      });
    });

    document.getElementById("saveTicketChangesBtn").addEventListener("click", () => {
      const prevStatus = ticket.status;
      ticket.status = document.getElementById("detailStatusSelect").value;
      ticket.queue = document.getElementById("detailQueueSelect").value;
      ticket.assignee = document.getElementById("detailAssigneeSelect").value;

      if (ticket.status === "Resolvido") {
        ticket.slaStatus = "Cumprido";
      }

      window.ITSMStorage.logActivity(
        state,
        `Chamado ${ticket.id} atualizado (${prevStatus} → ${ticket.status}) na fila ${ticket.queue}`
      );
      window.ITSMStorage.saveState(state);
      closeModal("ticketDetailModal");
      renderAll();
      showToast(`Chamado ${ticket.id} atualizado com sucesso!`, "success");
    });

    document.getElementById("addTicketNoteBtn").addEventListener("click", () => {
      const text = document.getElementById("newTicketNoteInput").value.trim();
      if (!text) return;
      const internal = document.getElementById("newNoteInternalCheck").checked;
      const now = new Date();
      const stamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      ticket.notes.push({
        author: ticket.assignee,
        timestamp: stamp,
        internal,
        text
      });
      window.ITSMStorage.logActivity(state, `Nova nota técnica adicionada ao chamado ${ticket.id}`);
      window.ITSMStorage.saveState(state);
      openTicketDetailModal(ticketId);
      showToast("Nota técnica registrada!", "success");
    });

    const delBtn = document.getElementById("deleteTicketBtn");
    if (delBtn) {
      delBtn.addEventListener("click", () => {
        state.tickets = state.tickets.filter((t) => t.id !== ticketId);
        window.ITSMStorage.logActivity(state, `Chamado ${ticketId} removido pelo Gestor`);
        window.ITSMStorage.saveState(state);
        closeModal("ticketDetailModal");
        renderAll();
        showToast(`Chamado ${ticketId} excluído.`, "warning");
      });
    }

    openModal("ticketDetailModal");
  }

  // Render Assets & CMDB
  function renderAssets() {
    const total = state.assets.length;
    const online = state.assets.filter((a) => a.status === "Online").length;
    const alert = state.assets.filter((a) => a.status === "Alerta").length;
    const offline = state.assets.filter((a) => a.status === "Offline").length;

    document.getElementById("assetsSummaryGrid").innerHTML = `
      <div class="kpi-card">
        <div class="kpi-top"><span class="kpi-label">Total de Ativos CMDB</span></div>
        <div class="kpi-value">${total}</div>
      </div>
      <div class="kpi-card accent-green">
        <div class="kpi-top"><span class="kpi-label">Operacionais (Online)</span></div>
        <div class="kpi-value">${online}</div>
      </div>
      <div class="kpi-card accent-orange">
        <div class="kpi-top"><span class="kpi-label">Em Alerta / Degradados</span></div>
        <div class="kpi-value">${alert}</div>
      </div>
      <div class="kpi-card accent-red">
        <div class="kpi-top"><span class="kpi-label">Offline / Indisponíveis</span></div>
        <div class="kpi-value">${offline}</div>
      </div>
    `;

    const q = document.getElementById("filterAssetSearch").value.toLowerCase().trim();
    const typeFilter = document.getElementById("filterAssetType").value;
    const statusFilter = document.getElementById("filterAssetStatus").value;

    const filtered = state.assets.filter((a) => {
      const matchQ =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.hostname.toLowerCase().includes(q) ||
        a.ip.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || a.type === typeFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchQ && matchType && matchStatus;
    });

    const tbody = document.getElementById("assetsTableBody");
    tbody.innerHTML = filtered
      .map((a) => {
        const linkedCount = state.tickets.filter((t) => t.assetId === a.id && t.status !== "Resolvido").length;
        return `
        <tr>
          <td class="ticket-id-cell">${escapeHtml(a.id)}</td>
          <td>
            <strong>${escapeHtml(a.hostname)}</strong>
            <div class="card-subtitle">${escapeHtml(a.type)}</div>
          </td>
          <td class="mono">${escapeHtml(a.ip)}</td>
          <td>${escapeHtml(a.location)}</td>
          <td>${escapeHtml(a.os)}</td>
          <td>${getAssetStatusBadge(a.status)}</td>
          <td><span class="badge ${linkedCount > 0 ? "badge-warning" : "badge-neutral"}">${linkedCount} aberto(s)</span></td>
          <td>
            <div class="btn-row">
              <button class="btn btn-outline btn-sm" data-edit-asset="${escapeHtml(a.id)}">Editar</button>
              <button class="btn btn-ghost btn-sm" data-ticket-for-asset="${escapeHtml(a.id)}">+ Incidente</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  // Render Knowledge Base
  function renderKnowledgeBase() {
    const q = document.getElementById("kbSearchInput").value.toLowerCase().trim();
    const cat = document.getElementById("kbCategoryFilter").value;

    const filtered = state.kbArticles.filter((kb) => {
      const matchQ =
        !q ||
        kb.title.toLowerCase().includes(q) ||
        kb.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        kb.steps.some((s) => s.toLowerCase().includes(q));
      const matchCat = cat === "all" || kb.category === cat;
      return matchQ && matchCat;
    });

    const grid = document.getElementById("kbArticlesGrid");
    grid.innerHTML = filtered
      .map(
        (kb) => `
      <article class="card kb-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="badge badge-info">${escapeHtml(kb.category)}</span>
            <span class="card-subtitle">${escapeHtml(kb.id)} • Atualizado em ${escapeHtml(kb.updatedAt)}</span>
          </div>
          <h3 class="card-title">${escapeHtml(kb.title)}</h3>
          <ol class="kb-steps">
            ${kb.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ol>
        </div>
        ${
          kb.command
            ? `<div class="kb-cmd-box">
                <code>${escapeHtml(kb.command)}</code>
                <button class="btn btn-sm btn-outline" data-copy-cmd="${escapeHtml(kb.command)}">Copiar</button>
              </div>`
            : ""
        }
      </article>
    `
      )
      .join("");
  }

  // Render Reports Table
  function renderReportsSummary() {
    const categories = [...new Set(state.tickets.map((t) => t.category))];
    const tbody = document.getElementById("summaryReportTableBody");
    tbody.innerHTML = categories
      .map((cat) => {
        const items = state.tickets.filter((t) => t.category === cat);
        const resolved = items.filter((t) => t.status === "Resolvido").length;
        const open = items.length - resolved;
        const rate = ((resolved / (items.length || 1)) * 100).toFixed(0) + "%";
        return `
        <tr>
          <td><strong>${escapeHtml(cat)}</strong></td>
          <td>${items.length}</td>
          <td>${open}</td>
          <td>${resolved}</td>
          <td><span class="badge badge-success">${rate}</span></td>
        </tr>
      `;
      })
      .join("");
  }

  // Modal helpers
  function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
  }

  function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
  }

  function populateAssetSelectInTicketModal(preselectAssetId = "") {
    const select = document.getElementById("ticketAssetInput");
    select.innerHTML =
      `<option value="">Nenhum ativo específico</option>` +
      state.assets
        .map(
          (a) =>
            `<option value="${escapeHtml(a.id)}" ${a.id === preselectAssetId ? "selected" : ""}>${escapeHtml(
              a.id
            )} — ${escapeHtml(a.hostname)} (${escapeHtml(a.ip)})</option>`
        )
        .join("");
  }

  function openNewTicketModal(preselectAssetId = "") {
    document.getElementById("newTicketForm").reset();
    populateAssetSelectInTicketModal(preselectAssetId);
    openModal("newTicketModal");
  }

  function openAssetModal(assetId = "") {
    const form = document.getElementById("assetForm");
    form.reset();
    document.getElementById("assetEditId").value = assetId;
    if (assetId) {
      const asset = state.assets.find((a) => a.id === assetId);
      if (asset) {
        document.getElementById("assetModalTitle").textContent = `Editar Ativo ${asset.id}`;
        document.getElementById("assetHostnameInput").value = asset.hostname;
        document.getElementById("assetTypeInput").value = asset.type;
        document.getElementById("assetIpInput").value = asset.ip;
        document.getElementById("assetStatusInput").value = asset.status;
        document.getElementById("assetLocationInput").value = asset.location;
        document.getElementById("assetOsInput").value = asset.os;
      }
    } else {
      document.getElementById("assetModalTitle").textContent = "Cadastrar Ativo no CMDB";
    }
    openModal("assetModal");
  }

  // Global Search
  function handleGlobalSearch(query) {
    const dropdown = document.getElementById("globalSearchDropdown");
    const q = query.toLowerCase().trim();
    if (!q) {
      dropdown.classList.add("hidden");
      return;
    }

    const matchedTickets = state.tickets
      .filter((t) => t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q))
      .slice(0, 4);
    const matchedAssets = state.assets
      .filter((a) => a.hostname.toLowerCase().includes(q) || a.ip.includes(q) || a.id.toLowerCase().includes(q))
      .slice(0, 3);
    const matchedKbs = state.kbArticles
      .filter((k) => k.title.toLowerCase().includes(q) || k.tags.some((t) => t.includes(q)))
      .slice(0, 2);

    if (!matchedTickets.length && !matchedAssets.length && !matchedKbs.length) {
      dropdown.innerHTML = `<div class="search-result-item"><span>Nenhum resultado para "${escapeHtml(query)}"</span></div>`;
      dropdown.classList.remove("hidden");
      return;
    }

    dropdown.innerHTML = [
      ...matchedTickets.map(
        (t) => `<div class="search-result-item" data-open-ticket="${escapeHtml(t.id)}">
          <div><strong>${escapeHtml(t.id)}</strong> — ${escapeHtml(t.title)}</div>
          <span class="badge badge-info">Chamado</span>
        </div>`
      ),
      ...matchedAssets.map(
        (a) => `<div class="search-result-item" data-goto="assets">
          <div><strong>${escapeHtml(a.hostname)}</strong> (${escapeHtml(a.ip)})</div>
          <span class="badge badge-neutral">Ativo</span>
        </div>`
      ),
      ...matchedKbs.map(
        (k) => `<div class="search-result-item" data-goto="kb">
          <div><strong>${escapeHtml(k.title)}</strong></div>
          <span class="badge badge-success">Runbook</span>
        </div>`
      )
    ].join("");
    dropdown.classList.remove("hidden");
  }

  // Initialize Diagnostic Tools
  function initDiagnosticTools() {
    const runCidr = () => {
      const ip = document.getElementById("cidrIpInput").value;
      const prefix = document.getElementById("cidrPrefixInput").value;
      const res = window.ITSMDiagnostic.calculateCIDR(ip, prefix);
      const out = document.getElementById("cidrOutput");
      if (res.error) {
        out.innerHTML = `<span class="badge badge-danger">${escapeHtml(res.error)}</span>`;
        return;
      }
      out.innerHTML = `
        <div class="output-grid">
          <div class="output-metric"><span>Rede / CIDR</span><strong>${res.network}</strong></div>
          <div class="output-metric"><span>Máscara de Sub-rede</span><strong>${res.mask}</strong></div>
          <div class="output-metric"><span>Primeiro Host Útil</span><strong>${res.firstHost}</strong></div>
          <div class="output-metric"><span>Último Host Útil</span><strong>${res.lastHost}</strong></div>
          <div class="output-metric"><span>Broadcast</span><strong>${res.broadcast}</strong></div>
          <div class="output-metric"><span>Hosts Utilizáveis</span><strong>${res.usableHosts}</strong></div>
        </div>
      `;
    };
    document.getElementById("calcCidrBtn").addEventListener("click", runCidr);
    runCidr();

    const runOptical = () => {
      const res = window.ITSMDiagnostic.calculateOpticalBudget({
        oltTx: document.getElementById("oltTxInput").value,
        fiberKm: document.getElementById("fiberKmInput").value,
        splitter1Db: document.getElementById("splitter1Select").value,
        splitter2Db: document.getElementById("splitter2Select").value,
        splices: document.getElementById("splicesInput").value
      });
      document.getElementById("opticalOutput").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span>Potência Estimada na ONU: <strong class="mono">${res.rxPower} dBm</strong></span>
          <span class="badge ${res.badgeClass}">${res.status}</span>
        </div>
        <div class="output-grid">
          <div class="output-metric"><span>Atenuação Total</span><strong>${res.totalAttenuation} dB</strong></div>
          <div class="output-metric"><span>Perda na Fibra</span><strong>${res.fiberLoss} dB</strong></div>
        </div>
      `;
    };
    document.getElementById("calcOpticalBtn").addEventListener("click", runOptical);
    runOptical();

    let lastMtrReport = "";
    document.getElementById("loadSampleMtrBtn").addEventListener("click", () => {
      document.getElementById("mtrLogInput").value = window.ITSMDiagnostic.SAMPLE_MTR_LOG;
      document.getElementById("analyzeMtrBtn").click();
    });

    document.getElementById("analyzeMtrBtn").addEventListener("click", () => {
      const raw = document.getElementById("mtrLogInput").value;
      const res = window.ITSMDiagnostic.analyzeMtrLog(raw);
      const out = document.getElementById("mtrOutput");
      if (res.error) {
        out.innerHTML = `<span class="badge badge-warning">${escapeHtml(res.error)}</span>`;
        return;
      }
      lastMtrReport = res.reportText;
      out.innerHTML = `
        <div style="margin-bottom:8px;"><span class="badge ${res.severity}">Diagnóstico Automatizado</span></div>
        <p style="font-weight:600;color:var(--navy-900);margin-bottom:8px;">${escapeHtml(res.diagnosis)}</p>
        <div style="font-size:0.78rem;color:var(--slate-600);">
          ${res.hops
            .map(
              (h) =>
                `<div>Salto #${h.hop}: <span class="mono">${escapeHtml(h.host)}</span> — Loss: <strong>${h.loss}%</strong> | Avg: <strong>${h.avgMs} ms</strong></div>`
            )
            .join("")}
        </div>
      `;
    });

    document.getElementById("copyMtrReportBtn").addEventListener("click", () => {
      if (!lastMtrReport) {
        showToast("Execute o diagnóstico de rota primeiro.", "warning");
        return;
      }
      navigator.clipboard?.writeText(lastMtrReport);
      showToast("Laudo técnico MTR copiado para a área de transferência!", "success");
    });

    const runScriptGen = () => {
      const type = document.getElementById("scriptTypeSelect").value;
      const param = document.getElementById("scriptParamInput").value;
      document.getElementById("scriptPreviewOutput").textContent = window.ITSMDiagnostic.generateSysAdminScript(
        type,
        param
      );
    };
    document.getElementById("generateScriptBtn").addEventListener("click", runScriptGen);
    document.getElementById("scriptTypeSelect").addEventListener("change", runScriptGen);
    document.getElementById("copyScriptBtn").addEventListener("click", () => {
      const code = document.getElementById("scriptPreviewOutput").textContent;
      navigator.clipboard?.writeText(code);
      showToast("Script copiado com sucesso!", "success");
    });
    runScriptGen();
  }

  function renderAll() {
    updateSidebarCounters();
    renderDashboard();
    renderTickets();
    renderAssets();
    renderKnowledgeBase();
    renderReportsSummary();
    refreshIcons();
  }

  // Event Wiring
  document.addEventListener("DOMContentLoaded", () => {
    // Sidebar Navigation
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    // Mobile Sidebar
    document.getElementById("openSidebarBtn").addEventListener("click", () => {
      document.getElementById("sidebar").classList.add("open");
      document.getElementById("sidebarBackdrop").classList.add("open");
    });
    document.getElementById("closeSidebarBtn").addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("sidebarBackdrop").classList.remove("open");
    });
    document.getElementById("sidebarBackdrop").addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("sidebarBackdrop").classList.remove("open");
    });

    // Role Switcher
    document.getElementById("roleSelector").addEventListener("change", (e) => {
      currentRole = e.target.value;
      document.getElementById("roleHint").textContent = ROLE_DESCRIPTIONS[currentRole];
      showToast(`Perfil alterado para: ${e.target.options[e.target.selectedIndex].text}`, "info");
    });

    // Notifications Popover
    const notifBtn = document.getElementById("notificationsBtn");
    const notifPopover = document.getElementById("notificationsPopover");
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifPopover.classList.toggle("hidden");
    });

    // Global Search
    const searchInput = document.getElementById("globalSearchInput");
    searchInput.addEventListener("input", (e) => handleGlobalSearch(e.target.value));
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInput.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notification-wrapper")) {
        notifPopover.classList.add("hidden");
      }
      if (!e.target.closest(".global-search")) {
        document.getElementById("globalSearchDropdown").classList.add("hidden");
      }

      const openTicketTarget = e.target.closest("[data-open-ticket]");
      if (openTicketTarget) {
        document.getElementById("globalSearchDropdown").classList.add("hidden");
        notifPopover.classList.add("hidden");
        openTicketDetailModal(openTicketTarget.dataset.openTicket);
        return;
      }

      const gotoTarget = e.target.closest("[data-goto]");
      if (gotoTarget) {
        document.getElementById("globalSearchDropdown").classList.add("hidden");
        notifPopover.classList.add("hidden");
        switchView(gotoTarget.dataset.goto);
        return;
      }

      const closeModalTarget = e.target.closest("[data-close-modal]");
      if (closeModalTarget) {
        closeModal(closeModalTarget.dataset.closeModal);
        return;
      }

      const editAssetTarget = e.target.closest("[data-edit-asset]");
      if (editAssetTarget) {
        openAssetModal(editAssetTarget.dataset.editAsset);
        return;
      }

      const ticketAssetTarget = e.target.closest("[data-ticket-for-asset]");
      if (ticketAssetTarget) {
        openNewTicketModal(ticketAssetTarget.dataset.ticketForAsset);
        return;
      }

      const copyCmdTarget = e.target.closest("[data-copy-cmd]");
      if (copyCmdTarget) {
        navigator.clipboard?.writeText(copyCmdTarget.dataset.copyCmd);
        showToast("Comando copiado!", "success");
      }
    });

    // Ticket View Mode Toggle
    document.getElementById("ticketListModeBtn").addEventListener("click", () => {
      ticketDisplayMode = "list";
      document.getElementById("ticketListModeBtn").classList.add("active");
      document.getElementById("ticketKanbanModeBtn").classList.remove("active");
      renderTickets();
    });
    document.getElementById("ticketKanbanModeBtn").addEventListener("click", () => {
      ticketDisplayMode = "kanban";
      document.getElementById("ticketKanbanModeBtn").classList.add("active");
      document.getElementById("ticketListModeBtn").classList.remove("active");
      renderTickets();
    });

    // Ticket Filters
    ["filterTicketSearch", "filterTicketStatus", "filterTicketPriority", "filterTicketQueue"].forEach((id) => {
      document.getElementById(id).addEventListener("input", renderTickets);
      document.getElementById(id).addEventListener("change", renderTickets);
    });
    document.getElementById("clearTicketFiltersBtn").addEventListener("click", () => {
      document.getElementById("filterTicketSearch").value = "";
      document.getElementById("filterTicketStatus").value = "all";
      document.getElementById("filterTicketPriority").value = "all";
      document.getElementById("filterTicketQueue").value = "all";
      renderTickets();
    });

    // New Ticket Triggers
    document.getElementById("newTicketGlobalBtn").addEventListener("click", () => openNewTicketModal());
    document.getElementById("newTicketSectionBtn").addEventListener("click", () => openNewTicketModal());

    // Submit New Ticket
    document.getElementById("newTicketForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const nextNum = 1042 + state.tickets.length;
      const newId = `INC-2026-${nextNum}`;
      const priority = document.getElementById("ticketPriorityInput").value;
      const slaHours = { P1: 2, P2: 4, P3: 12, P4: 24 }[priority] || 12;
      const now = new Date();
      const deadline = new Date(now.getTime() + slaHours * 3600000);

      const newTicket = {
        id: newId,
        title: document.getElementById("ticketTitleInput").value.trim(),
        category: document.getElementById("ticketCategoryInput").value,
        priority,
        queue: document.getElementById("ticketQueueInput").value,
        status: "Aberto",
        requester: document.getElementById("ticketRequesterInput").value.trim(),
        assignee: document.getElementById("ticketAssigneeInput").value,
        assetId: document.getElementById("ticketAssetInput").value,
        createdAt: now.toISOString(),
        slaDeadline: deadline.toISOString(),
        slaStatus: "No Prazo",
        description: document.getElementById("ticketDescriptionInput").value.trim(),
        triageChecklist: { icmp: false, link: false, dns: false, logs: false },
        notes: []
      };

      state.tickets.unshift(newTicket);
      window.ITSMStorage.logActivity(state, `Novo chamado ${newId} (${priority}) aberto na fila ${newTicket.queue}`);
      window.ITSMStorage.saveState(state);
      closeModal("newTicketModal");
      renderAll();
      showToast(`Chamado ${newId} registrado com SLA de ${slaHours}h!`, "success");
    });

    // Assets Triggers & Filters
    document.getElementById("newAssetBtn").addEventListener("click", () => openAssetModal());
    ["filterAssetSearch", "filterAssetType", "filterAssetStatus"].forEach((id) => {
      document.getElementById(id).addEventListener("input", renderAssets);
      document.getElementById(id).addEventListener("change", renderAssets);
    });

    document.getElementById("assetForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const editId = document.getElementById("assetEditId").value;
      const payload = {
        hostname: document.getElementById("assetHostnameInput").value.trim(),
        type: document.getElementById("assetTypeInput").value,
        ip: document.getElementById("assetIpInput").value.trim(),
        status: document.getElementById("assetStatusInput").value,
        location: document.getElementById("assetLocationInput").value.trim(),
        os: document.getElementById("assetOsInput").value.trim()
      };

      if (editId) {
        const idx = state.assets.findIndex((a) => a.id === editId);
        if (idx !== -1) {
          state.assets[idx] = { ...state.assets[idx], ...payload };
          window.ITSMStorage.logActivity(state, `Ativo ${editId} (${payload.hostname}) atualizado no CMDB`);
        }
      } else {
        const newAssetId = `AST-00${state.assets.length + 1}`;
        state.assets.unshift({ id: newAssetId, ...payload });
        window.ITSMStorage.logActivity(state, `Novo ativo ${newAssetId} (${payload.hostname}) cadastrado no CMDB`);
      }

      window.ITSMStorage.saveState(state);
      closeModal("assetModal");
      renderAll();
      showToast("Inventário CMDB atualizado!", "success");
    });

    // Knowledge Base Triggers
    document.getElementById("newKbBtn").addEventListener("click", () => {
      document.getElementById("kbForm").reset();
      openModal("kbModal");
    });
    document.getElementById("kbSearchInput").addEventListener("input", renderKnowledgeBase);
    document.getElementById("kbCategoryFilter").addEventListener("change", renderKnowledgeBase);

    document.getElementById("kbForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const stepsRaw = document.getElementById("kbStepsInput").value.split("
").map((s) => s.trim()).filter(Boolean);
      const tagsRaw = document
        .getElementById("kbTagsInput")
        .value.split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const newKb = {
        id: `KB-00${state.kbArticles.length + 1}`,
        title: document.getElementById("kbTitleInput").value.trim(),
        category: document.getElementById("kbCategoryInput").value,
        tags: tagsRaw.length ? tagsRaw : ["itil", "suporte"],
        updatedAt: new Date().toISOString().slice(0, 10),
        steps: stepsRaw,
        command: document.getElementById("kbCommandInput").value.trim()
      };

      state.kbArticles.unshift(newKb);
      window.ITSMStorage.logActivity(state, `Novo runbook ${newKb.id} publicado na Base de Conhecimento`);
      window.ITSMStorage.saveState(state);
      closeModal("kbModal");
      renderAll();
      showToast("Runbook publicado com sucesso!", "success");
    });

    // Reports & Export / Import / Reset
    const exportTicketsHandler = () => {
      window.ITSMStorage.exportToCSV("mini-itsm-chamados.csv", state.tickets);
      showToast("Relatório CSV de chamados gerado!", "success");
    };
    document.getElementById("exportQuickCsvBtn").addEventListener("click", exportTicketsHandler);
    document.getElementById("exportTicketsCsvBtn").addEventListener("click", exportTicketsHandler);
    document.getElementById("exportAssetsCsvBtn").addEventListener("click", () => {
      window.ITSMStorage.exportToCSV("mini-itsm-ativos-cmdb.csv", state.assets);
      showToast("Inventário CMDB exportado em CSV!", "success");
    });
    document.getElementById("exportJsonBackupBtn").addEventListener("click", () => {
      window.ITSMStorage.exportToJSON("mini-itsm-backup.json", state);
      showToast("Backup JSON exportado!", "success");
    });
    document.getElementById("importJsonBackupInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!imported.tickets || !imported.assets) throw new Error("Estrutura inválida");
          state = imported;
          window.ITSMStorage.saveState(state);
          renderAll();
          showToast("Backup restaurado com sucesso!", "success");
        } catch (err) {
          showToast("Arquivo JSON inválido para restauração.", "danger");
        }
      };
      reader.readAsText(file);
    });
    document.getElementById("resetDemoDataBtn").addEventListener("click", () => {
      state = window.ITSMStorage.resetState();
      renderAll();
      showToast("Base de demonstração restaurada ao padrão original!", "info");
    });

    initDiagnosticTools();
    renderAll();
  });
})();
