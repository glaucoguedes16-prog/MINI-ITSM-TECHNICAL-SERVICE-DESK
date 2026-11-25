/**
 * Mini-ITSM — Módulo de Visualização de Indicadores (Chart.js)
 */

(function () {
  const chartInstances = {};

  function destroyIfExists(key) {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      delete chartInstances[key];
    }
  }

  function renderDashboardCharts(state) {
    if (typeof window.Chart === "undefined") {
      return;
    }

    const commonFont = {
      family: "'Inter', sans-serif",
      size: 12
    };

    // 1. Trend Chart (7 Days)
    destroyIfExists("trend");
    const trendCtx = document.getElementById("trendChart");
    if (trendCtx) {
      chartInstances.trend = new Chart(trendCtx, {
        type: "line",
        data: {
          labels: ["19/11", "20/11", "21/11", "22/11", "23/11", "24/11", "25/11"],
          datasets: [
            {
              label: "Chamados Abertos",
              data: [6, 9, 7, 5, 8, 11, state.tickets.length],
              borderColor: "#1d63ed",
              backgroundColor: "rgba(29, 99, 237, 0.12)",
              tension: 0.35,
              fill: true,
              borderWidth: 2.5
            },
            {
              label: "Resolvidos no SLA",
              data: [6, 8, 7, 5, 7, 10, state.tickets.filter((t) => t.status === "Resolvido").length + 3],
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              tension: 0.35,
              fill: false,
              borderWidth: 2.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { font: commonFont } }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: commonFont }, grid: { color: "#e9edf3" } },
            x: { ticks: { font: commonFont }, grid: { display: false } }
          }
        }
      });
    }

    // 2. Category Doughnut Chart
    destroyIfExists("category");
    const categoryCtx = document.getElementById("categoryChart");
    if (categoryCtx) {
      const catCounts = {};
      state.tickets.forEach((t) => {
        catCounts[t.category] = (catCounts[t.category] || 0) + 1;
      });
      chartInstances.category = new Chart(categoryCtx, {
        type: "doughnut",
        data: {
          labels: Object.keys(catCounts),
          datasets: [
            {
              data: Object.values(catCounts),
              backgroundColor: ["#1d63ed", "#0ea5e9", "#10b981", "#f59e0b", "#6366f1"],
              borderWidth: 2,
              borderColor: "#ffffff"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: { position: "right", labels: { font: commonFont, boxWidth: 12 } }
          }
        }
      });
    }

    // 3. Queue Bar Chart
    destroyIfExists("queue");
    const queueCtx = document.getElementById("queueChart");
    if (queueCtx) {
      const queues = [
        "Service Desk N1",
        "Redes & NOC",
        "Infraestrutura & Cloud",
        "Sistemas & AD",
        "Field Service"
      ];
      const counts = queues.map((q) => state.tickets.filter((t) => t.queue === q).length);
      chartInstances.queue = new Chart(queueCtx, {
        type: "bar",
        data: {
          labels: ["N1", "Redes/NOC", "Infra/Cloud", "Sistemas/AD", "Field"],
          datasets: [
            {
              label: "Total na Fila",
              data: counts,
              backgroundColor: "#0b192c",
              hoverBackgroundColor: "#1d63ed",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: commonFont }, grid: { color: "#e9edf3" } },
            x: { ticks: { font: commonFont }, grid: { display: false } }
          }
        }
      });
    }

    // 4. Assets Health Horizontal Bar
    destroyIfExists("assets");
    const assetsCtx = document.getElementById("assetsHealthChart");
    if (assetsCtx) {
      const online = state.assets.filter((a) => a.status === "Online").length;
      const alert = state.assets.filter((a) => a.status === "Alerta").length;
      const offline = state.assets.filter((a) => a.status === "Offline").length;
      chartInstances.assets = new Chart(assetsCtx, {
        type: "bar",
        data: {
          labels: ["Online", "Alerta / Degradado", "Offline / Crítico"],
          datasets: [
            {
              label: "Ativos CMDB",
              data: [online, alert, offline],
              backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
              borderRadius: 6
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, font: commonFont }, grid: { color: "#e9edf3" } },
            y: { ticks: { font: commonFont }, grid: { display: false } }
          }
        }
      });
    }
  }

  window.ITSMCharts = {
    renderDashboardCharts
  };
})();
