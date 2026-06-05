// SolarGPT — Dashboard Module
// Manages saved projects, reports history, and client data

const Dashboard = (() => {

  const STORAGE_KEYS = {
    projects: "solargpt_projects",
    reports: "solargpt_reports",
    clients: "solargpt_clients",
    calcCount: "solargpt_calc_count",
  };

  // --- Data helpers ---
  function getProjects() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || "[]"); }
  function getReports() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.reports) || "[]"); }
  function getClients() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.clients) || "[]"); }
  function getCalcCount() { return parseInt(localStorage.getItem(STORAGE_KEYS.calcCount) || "0"); }

  function saveProject(project) {
    const projects = getProjects();
    const existing = projects.findIndex(p => p.id === project.id);
    if (existing >= 0) {
      projects[existing] = { ...projects[existing], ...project, updatedAt: Date.now() };
    } else {
      projects.unshift({ ...project, id: project.id || Date.now(), createdAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects.slice(0, 100)));
    incrementCalcCount();
    refresh();
  }

  function deleteProject(id) {
    const projects = getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
    refresh();
  }

  function incrementCalcCount() {
    const count = getCalcCount() + 1;
    localStorage.setItem(STORAGE_KEYS.calcCount, count.toString());
  }

  // --- Render dashboard ---
  function renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const projects = getProjects();
    const reports = getReports();
    const calcCount = getCalcCount();
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;

    container.innerHTML = `
      <!-- Stats Row -->
      <div class="dash-stats">
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📁</div>
          <div class="dash-stat-value">${projects.length}</div>
          <div class="dash-stat-label">${t("dash_projects")}</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📄</div>
          <div class="dash-stat-value">${reports.length}</div>
          <div class="dash-stat-label">${t("dash_reports")}</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">🧮</div>
          <div class="dash-stat-value">${calcCount}</div>
          <div class="dash-stat-label">${t("dash_calculations")}</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">👥</div>
          <div class="dash-stat-value">${getClients().length}</div>
          <div class="dash-stat-label">${t("dash_clients")}</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="dash-actions">
        <button class="btn btn-primary" onclick="window.showSection('calculator')">
          <span>☀️</span> New Calculation
        </button>
        <button class="btn btn-secondary" onclick="window.showSection('reports')">
          <span>📄</span> Generate Report
        </button>
        <button class="btn btn-secondary" onclick="window.showSection('advisor')">
          <span>🤖</span> Ask AI Advisor
        </button>
      </div>

      <!-- Projects List -->
      <div class="dash-section">
        <div class="dash-section-header">
          <h3>${t("dash_projects")}</h3>
          <button class="btn btn-sm" onclick="window.showSection('calculator')">+ ${t("dash_new_project")}</button>
        </div>
        ${projects.length === 0 
          ? `<div class="dash-empty"><span>🌤️</span><p>${t("dash_no_projects")}</p></div>`
          : `<div class="dash-table-wrapper">
              <table class="dash-table">
                <thead>
                  <tr><th>Project</th><th>System</th><th>Savings/yr</th><th>Type</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  ${projects.slice(0, 10).map(p => `
                    <tr>
                      <td><strong>${p.name || "Untitled"}</strong><br><small style="color:#6b7280">${p.client || "—"}</small></td>
                      <td>${p.systemKwp || "—"} kWp</td>
                      <td>${p.annualSavings ? "$" + p.annualSavings.toLocaleString() : "—"}</td>
                      <td><span class="badge ${p.systemType === "offgrid" ? "badge-amber" : p.systemType === "hybrid" ? "badge-blue" : "badge-green"}">${p.systemType || "grid"}</span></td>
                      <td>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <button class="icon-btn" onclick="Dashboard.loadProject(${p.id})" title="Load">📂</button>
                        <button class="icon-btn" onclick="Dashboard.generateProjectReport(${p.id})" title="Report">📄</button>
                        <button class="icon-btn danger" onclick="Dashboard.deleteProject(${p.id})" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>`
        }
      </div>

      <!-- Reports History -->
      ${reports.length > 0 ? `
      <div class="dash-section">
        <div class="dash-section-header">
          <h3>${t("dash_reports")}</h3>
        </div>
        <div class="dash-table-wrapper">
          <table class="dash-table">
            <thead>
              <tr><th>Project</th><th>Client</th><th>System</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${reports.slice(0, 8).map(r => `
                <tr>
                  <td>${r.projectName || "Report"}</td>
                  <td>${r.clientName || "—"}</td>
                  <td>${r.systemKwp || "—"} kWp</td>
                  <td>${r.date || "—"}</td>
                  <td><span class="badge badge-green">Downloaded</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
      ` : ""}

      <!-- Chart: Monthly savings projection -->
      ${projects.length > 0 ? `
      <div class="dash-section">
        <h3 style="margin-bottom:16px;">Portfolio Overview</h3>
        <div class="portfolio-chart">
          <canvas id="portfolioChart" height="120"></canvas>
        </div>
      </div>
      ` : ""}
    `;

    // Draw simple chart if projects exist
    if (projects.length > 0) {
      setTimeout(() => drawPortfolioChart(projects), 100);
    }
  }

  function drawPortfolioChart(projects) {
    const canvas = document.getElementById("portfolioChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 120;

    const data = projects.slice(0, 8).map(p => ({ name: p.name || "P", val: p.annualSavings || 0 }));
    if (!data.length) return;

    const maxVal = Math.max(...data.map(d => d.val), 1);
    const barW = Math.floor(canvas.width / (data.length * 1.5));
    const gap = Math.floor(barW * 0.5);
    const chartH = canvas.height - 30;
    const startX = gap;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.body.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const barColor = getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#22c55e";

    data.forEach((d, i) => {
      const x = startX + i * (barW + gap);
      const h = (d.val / maxVal) * chartH;
      const y = chartH - h;

      // Gradient bar
      const grad = ctx.createLinearGradient(x, y, x, chartH);
      grad.addColorStop(0, "#22c55e");
      grad.addColorStop(1, "#16a34a");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(d.name.substring(0, 6), x + barW / 2, canvas.height - 6);

      // Value
      if (d.val > 0) {
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 9px system-ui";
        ctx.fillText("$" + (d.val / 1000).toFixed(1) + "k", x + barW / 2, y - 4);
      }
    });
  }

  function loadProject(id) {
    const projects = getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;
    // Populate calculator form with project data
    window.showSection("calculator");
    setTimeout(() => {
      const fillField = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      fillField("calc-monthly-kwh", project.monthlyKwh);
      fillField("calc-monthly-bill", project.monthlyBill);
      fillField("calc-location", project.location);
      fillField("calc-roof-area", project.roofArea);
      if (project.calcResults) {
        SolarCalculator.renderResults(project.calcResults, "calc-results");
      }
    }, 200);
  }

  function generateProjectReport(id) {
    const projects = getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;
    window.showSection("reports");
    setTimeout(() => {
      const fill = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.value = val; };
      fill("#report-project-name", project.name);
      fill("#report-client-name", project.client);
    }, 200);
  }

  function refresh() {
    if (document.getElementById("dashboard-content")) {
      renderDashboard("dashboard-content");
    }
  }

  return { renderDashboard, saveProject, deleteProject, loadProject, generateProjectReport, getProjects, getReports, refresh };
})();

window.Dashboard = Dashboard;
