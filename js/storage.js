/**
 * Mini-ITSM — Camada de Persistência Local (LocalStorage)
 * Gerencia estado da aplicação, CRUD, backup JSON, exportação CSV e trilha de auditoria.
 */

(function () {
  const STORAGE_KEY = "mini_itsm_state_v2";

  function cloneSeed() {
    return JSON.parse(JSON.stringify(window.MINI_ITSM_SEED));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = cloneSeed();
        saveState(initial);
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.tickets || !parsed.assets || !parsed.kbArticles) {
        const fallback = cloneSeed();
        saveState(fallback);
        return fallback;
      }
      return parsed;
    } catch (err) {
      console.warn("Erro ao ler LocalStorage, usando seed padrão:", err);
      return cloneSeed();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Falha ao persistir no LocalStorage:", err);
    }
  }

  function logActivity(state, text, type = "info") {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    state.activities.unshift({
      text,
      time: `Hoje, ${hh}:${mm}`,
      type
    });
    if (state.activities.length > 25) {
      state.activities.length = 25;
    }
  }

  function resetState() {
    const fresh = cloneSeed();
    saveState(fresh);
    return fresh;
  }

  function exportToCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const headers = Object.keys(rows[0]);
    const escapeCell = (val) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvLines = [
      headers.join(";"),
      ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(";"))
    ];
    const blob = new Blob(["﻿" + csvLines.join("
")], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportToJSON(filename, state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.ITSMStorage = {
    loadState,
    saveState,
    logActivity,
    resetState,
    exportToCSV,
    exportToJSON
  };
})();
