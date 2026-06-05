// SolarGPT — Main Application Controller
// Handles UI interactions, navigation, AI advisor, and cost estimator

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  setupTheme();
  setupNavigation();
  setupCalculator();
  setupBillAnalyzer();
  setupAIAdvisor();
  setupCostEstimator();
  setupReports();
  setupKnowledgeCenter();
  setupPricing();
  updateI18nDOM();
  setupLangSwitcher();
  setupMobileMenu();
  initDashboard();
  animateHero();
}

// ─── THEME ────────────────────────────────────────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem("solargpt_theme") || "light";
  applyTheme(saved);
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("solargpt_theme", next);
  });
}
function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const SECTIONS = ["hero","calculator","bill-analyzer","advisor","cost-estimator","reports","dashboard","knowledge","pricing"];

function setupNavigation() {
  document.querySelectorAll("[data-section]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const section = el.getAttribute("data-section");
      showSection(section);
      closeMobileMenu();
    });
  });
}

window.showSection = function(sectionId) {
  // Hide all sections
  SECTIONS.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.classList.remove("active");
  });
  // Show target
  const target = document.getElementById(`section-${sectionId}`);
  if (target) {
    target.classList.add("active");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Update nav active state
  document.querySelectorAll("[data-section]").forEach(el => {
    el.classList.toggle("nav-active", el.getAttribute("data-section") === sectionId);
  });
  // Special init for some sections
  if (sectionId === "dashboard") Dashboard.renderDashboard("dashboard-content");
};

// ─── MOBILE MENU ──────────────────────────────────────────────────────────────
function setupMobileMenu() {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  btn?.addEventListener("click", () => menu?.classList.toggle("open"));
}
function closeMobileMenu() {
  document.getElementById("mobile-menu")?.classList.remove("open");
}

// ─── LANGUAGE ─────────────────────────────────────────────────────────────────
function setupLangSwitcher() {
  document.querySelectorAll("[data-lang]").forEach(el => {
    el.addEventListener("click", () => {
      const lang = el.getAttribute("data-lang");
      i18n.setLanguage(lang);
      updateI18nDOM();
      document.querySelectorAll("[data-lang]").forEach(b => b.classList.remove("active"));
      el.classList.add("active");
    });
  });
  // Set initial active
  document.querySelectorAll(`[data-lang="${i18n.currentLang}"]`).forEach(el => el.classList.add("active"));
}
function updateI18nDOM() {
  if (window.i18n) i18n.updateDOM();
}

// ─── SOLAR CALCULATOR ─────────────────────────────────────────────────────────
function setupCalculator() {
  const form = document.getElementById("calc-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runCalculation();
  });

  // Real-time sliders
  form.querySelectorAll("input[type=range]").forEach(slider => {
    const display = document.getElementById(slider.id + "-display");
    slider.addEventListener("input", () => {
      if (display) display.textContent = slider.value;
    });
  });
}

function runCalculation() {
  const getVal = (id) => document.getElementById(id)?.value || "";
  const inputs = {
    monthlyKwh: getVal("calc-monthly-kwh"),
    monthlyBill: getVal("calc-monthly-bill"),
    location: getVal("calc-location"),
    roofAreaM2: getVal("calc-roof-area"),
    panelType: getVal("calc-panel-type"),
    systemType: getVal("calc-system-type"),
    electricityRate: getVal("calc-elec-rate") || 0.12,
  };

  // Validate
  if (!inputs.monthlyKwh && !inputs.monthlyBill) {
    showNotification("Please enter your monthly consumption or bill amount.", "warning");
    return;
  }

  const btn = document.getElementById("calc-submit-btn");
  setButtonLoading(btn, true);

  setTimeout(() => {
    try {
      const results = SolarCalculator.calculate(inputs);
      SolarCalculator.renderResults(results, "calc-results");

      // Save to dashboard
      const projectData = {
        id: Date.now(),
        name: `Solar Project — ${new Date().toLocaleDateString()}`,
        client: "",
        monthlyKwh: inputs.monthlyKwh,
        monthlyBill: inputs.monthlyBill,
        location: inputs.location,
        roofArea: inputs.roofAreaM2,
        systemKwp: results.systemKwp,
        annualSavings: results.annualSavingsUsd,
        systemType: inputs.systemType,
        calcResults: results,
      };
      Dashboard.saveProject(projectData);

      // Store last results globally for report generation
      window._lastCalcResults = results;
      showNotification("Calculation complete! Results saved to dashboard.", "success");
    } catch (err) {
      console.error(err);
      showNotification("Calculation error. Please check your inputs.", "error");
    }
    setButtonLoading(btn, false);
  }, 600);
}

// ─── BILL ANALYZER ────────────────────────────────────────────────────────────
function setupBillAnalyzer() {
  const form = document.getElementById("bill-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runBillAnalysis();
  });
}

function runBillAnalysis() {
  const getVal = (id) => document.getElementById(id)?.value || "";
  const inputs = {
    monthlyBill: getVal("bill-amount"),
    monthlyKwh: getVal("bill-kwh"),
    electricityRate: getVal("bill-rate"),
    sunHours: getVal("bill-sun-hours"),
    systemCostPerW: getVal("bill-cost-per-w") || 1.0,
    incentivePercent: getVal("bill-incentive") || 0,
  };

  if (!inputs.monthlyBill && !inputs.monthlyKwh) {
    showNotification("Please enter your monthly bill or consumption.", "warning");
    return;
  }

  const btn = document.getElementById("bill-submit-btn");
  setButtonLoading(btn, true);

  setTimeout(() => {
    try {
      const results = BillAnalyzer.analyze(inputs);
      BillAnalyzer.renderResults(results, "bill-results");
      window._lastBillResults = results;
      showNotification("Analysis complete!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Analysis error. Please check your inputs.", "error");
    }
    setButtonLoading(btn, false);
  }, 700);
}

// ─── AI ADVISOR ───────────────────────────────────────────────────────────────
const advisorHistory = [];

function setupAIAdvisor() {
  const input = document.getElementById("advisor-input");
  const sendBtn = document.getElementById("advisor-send-btn");

  if (!input || !sendBtn) return;

  sendBtn.addEventListener("click", sendAdvisorMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAdvisorMessage();
    }
  });

  // Suggested questions
  document.querySelectorAll(".advisor-suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
      input.value = btn.textContent.trim();
      sendAdvisorMessage();
    });
  });
}

async function sendAdvisorMessage() {
  const input = document.getElementById("advisor-input");
  const message = input?.value?.trim();
  if (!message) return;

  input.value = "";
  appendAdvisorMessage("user", message);
  advisorHistory.push({ role: "user", content: message });

  const thinking = appendAdvisorMessage("assistant", null, true);

  try {
    const systemPrompt = `You are SolarGPT, an expert AI solar energy advisor with deep knowledge of photovoltaic systems, solar financing, energy storage, grid regulations, and renewable energy best practices. You help homeowners, solar engineers, installation companies, and investors make informed decisions about solar energy.

Your expertise includes:
- PV system sizing and design (on-grid, off-grid, hybrid)
- Solar panel technology (monocrystalline, polycrystalline, thin-film, bifacial)
- Inverter types (string, micro, power optimizers, hybrid)
- Battery storage systems (lithium, lead-acid, flow batteries)
- Financial analysis (ROI, payback period, NPV, IRR)
- Incentives and tax credits (ITC, MACRS, net metering, feed-in tariffs)
- Installation best practices and NEC codes
- Shade analysis and panel orientation
- Monitoring and maintenance

Be concise, professional, and data-driven. Use specific numbers when relevant. Format responses with clear structure. Always mention when professional assessment is needed.`;

    const messages = [...advisorHistory.slice(-10)];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process your question. Please try again.";

    thinking.remove();
    appendAdvisorMessage("assistant", reply);
    advisorHistory.push({ role: "assistant", content: reply });

  } catch (err) {
    console.error("AI Advisor error:", err);
    thinking.remove();
    appendAdvisorMessage("assistant", "⚠️ I'm currently unable to connect to the AI service. Please check your connection and try again. In the meantime, you can use our calculators and knowledge center for solar guidance.");
  }
}

function appendAdvisorMessage(role, text, isThinking = false) {
  const chat = document.getElementById("advisor-chat");
  if (!chat) return null;

  const div = document.createElement("div");
  div.className = `chat-message ${role}`;

  if (isThinking) {
    div.innerHTML = `
      <div class="chat-avatar">${role === "user" ? "👤" : "🤖"}</div>
      <div class="chat-bubble thinking">
        <span></span><span></span><span></span>
      </div>`;
  } else {
    // Format markdown-like text
    const formatted = formatAdvisorText(text);
    div.innerHTML = `
      <div class="chat-avatar">${role === "user" ? "👤" : "☀️"}</div>
      <div class="chat-bubble">${formatted}</div>`;
  }

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function formatAdvisorText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^### (.*)/gm, "<h4>$1</h4>")
    .replace(/^## (.*)/gm, "<h3>$1</h3>")
    .replace(/^- (.*)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}

// ─── COST ESTIMATOR ───────────────────────────────────────────────────────────
function setupCostEstimator() {
  const form = document.getElementById("cost-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runCostEstimate();
  });

  // Auto-update when system size changes
  document.getElementById("cost-system-kw")?.addEventListener("input", () => {
    const kw = parseFloat(document.getElementById("cost-system-kw").value) || 0;
    const defaultCost = Math.round(kw * 1000 * 1.0);
    const installEl = document.getElementById("cost-install-cost");
    if (installEl && !installEl.dataset.modified) {
      installEl.value = Math.round(kw * 200);
    }
  });
  document.getElementById("cost-install-cost")?.addEventListener("input", function() {
    this.dataset.modified = "true";
  });
}

function runCostEstimate() {
  const getVal = (id) => parseFloat(document.getElementById(id)?.value) || 0;
  const systemKw = getVal("cost-system-kw");
  const panelCostPerW = getVal("cost-panel-cost") || 0.28;
  const installCost = getVal("cost-install-cost");
  const batteryCost = getVal("cost-battery-cost");
  const incentivePct = getVal("cost-incentive") / 100;
  const elecRate = getVal("cost-elec-rate") || 0.12;
  const annualRateIncrease = getVal("cost-annual-increase") / 100 || 0.03;

  if (!systemKw) {
    showNotification("Please enter system size.", "warning");
    return;
  }

  const panelCost = systemKw * 1000 * panelCostPerW;
  const inverterCost = systemKw * 170;
  const mountingCost = systemKw * 80;
  const wiringCost = systemKw * 50;
  const totalEquipment = panelCost + inverterCost + mountingCost + wiringCost + batteryCost;
  const totalGross = totalEquipment + installCost;
  const incentiveAmount = totalGross * incentivePct;
  const netCost = totalGross - incentiveAmount;

  // Production & savings
  const annualProductionKwh = systemKw * 1600; // avg 1600 kWh/kWp
  let annualSavings = annualProductionKwh * elecRate;
  const monthlySavings = annualSavings / 12;
  const paybackYears = netCost > 0 && annualSavings > 0
    ? parseFloat((netCost / annualSavings).toFixed(1)) : 0;

  // 10 and 25 year ROI
  let cum10 = 0, cum25 = 0, s = annualSavings;
  for (let i = 0; i < 25; i++) {
    if (i < 10) cum10 += s;
    cum25 += s;
    s *= (1 + annualRateIncrease);
  }
  const roi10 = netCost > 0 ? parseFloat(((cum10 - netCost) / netCost * 100).toFixed(0)) : 0;
  const roi25 = netCost > 0 ? parseFloat(((cum25 - netCost) / netCost * 100).toFixed(0)) : 0;

  // Store results
  window._lastCostResults = {
    systemKwp: systemKw,
    totalCost: Math.round(totalGross),
    netCost: Math.round(netCost),
    incentiveAmount: Math.round(incentiveAmount),
    monthlySavingsUsd: Math.round(monthlySavings),
    annualSavingsUsd: Math.round(annualSavings),
    paybackYears,
    roi10YrPercent: roi10,
    roi25yr: roi25,
    breakdown: {
      panels: Math.round(panelCost),
      inverter: Math.round(inverterCost),
      mounting: Math.round(mountingCost),
      wiring: Math.round(wiringCost),
      battery: Math.round(batteryCost),
      installation: Math.round(installCost),
    }
  };

  renderCostResults(window._lastCostResults);
  const btn = document.getElementById("cost-submit-btn");
  setButtonLoading(btn, false);
}

function renderCostResults(r) {
  const container = document.getElementById("cost-results");
  if (!container) return;
  const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;

  container.innerHTML = `
    <div class="results-grid">
      <div class="result-card primary">
        <div class="result-icon">💰</div>
        <div class="result-value">$${r.totalCost.toLocaleString()}</div>
        <div class="result-label">${t("cost_total")}</div>
        <div class="result-detail">Before incentives</div>
      </div>
      <div class="result-card highlight">
        <div class="result-icon">🏷️</div>
        <div class="result-value">$${r.netCost.toLocaleString()}</div>
        <div class="result-label">${t("cost_after_incentive")}</div>
        <div class="result-detail">Saved $${r.incentiveAmount.toLocaleString()}</div>
      </div>
      <div class="result-card">
        <div class="result-icon">📅</div>
        <div class="result-value">${r.paybackYears} yrs</div>
        <div class="result-label">${t("cost_payback_period")}</div>
        <div class="result-detail">Simple payback</div>
      </div>
      <div class="result-card">
        <div class="result-icon">💵</div>
        <div class="result-value">$${r.monthlySavingsUsd}</div>
        <div class="result-label">${t("cost_monthly_savings")}</div>
        <div class="result-detail">$${r.annualSavingsUsd.toLocaleString()}/year</div>
      </div>
      <div class="result-card">
        <div class="result-icon">📈</div>
        <div class="result-value">${r.roi10YrPercent}%</div>
        <div class="result-label">${t("cost_roi_10")}</div>
        <div class="result-detail">Net return on investment</div>
      </div>
      <div class="result-card">
        <div class="result-icon">🚀</div>
        <div class="result-value">${r.roi25yr}%</div>
        <div class="result-label">${t("cost_roi_20")}</div>
        <div class="result-detail">25-year projection</div>
      </div>
    </div>

    <div class="cost-breakdown">
      <h4>Cost Breakdown</h4>
      <div class="breakdown-chart">
        ${Object.entries(r.breakdown).map(([key, val]) => {
          const pct = r.totalCost > 0 ? ((val / r.totalCost) * 100).toFixed(1) : 0;
          const labels = {panels:"Solar Panels",inverter:"Inverter",mounting:"Mounting",wiring:"Wiring",battery:"Battery",installation:"Installation"};
          return `
            <div class="breakdown-row">
              <span class="br-label">${labels[key] || key}</span>
              <div class="br-track"><div class="br-fill" style="width:${pct}%"></div></div>
              <span class="br-pct">${pct}%</span>
              <span class="br-val">$${val.toLocaleString()}</span>
            </div>`;
        }).join("")}
      </div>
    </div>
  `;
  container.classList.add("visible");
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function setupReports() {
  document.getElementById("report-generate-btn")?.addEventListener("click", () => {
    const data = {
      projectName: document.getElementById("report-project-name")?.value || "Solar Project",
      clientName: document.getElementById("report-client-name")?.value || "Valued Client",
      projectDate: document.getElementById("report-date")?.value || new Date().toLocaleDateString(),
      calcResults: window._lastCalcResults || {},
      billResults: window._lastBillResults || {},
      costResults: window._lastCostResults || {},
      sections: getSelectedReportSections(),
    };

    if (!data.calcResults.systemKwp && !data.billResults.recommendedSystemKwp && !data.costResults.systemKwp) {
      showNotification("Please run a calculation first before generating a report.", "warning");
      return;
    }

    const previewEl = document.getElementById("report-preview");
    if (previewEl) {
      previewEl.innerHTML = `<div class="loading-spinner"></div><p>Generating report...</p>`;
      setTimeout(() => {
        Reports.previewReport(data, "report-preview");
      }, 500);
    }

    setTimeout(() => Reports.downloadReport(data), 800);
    showNotification("Report generated and downloading...", "success");
  });
}

function getSelectedReportSections() {
  const sections = [];
  document.querySelectorAll(".report-section-check:checked").forEach(el => {
    sections.push(el.value);
  });
  return sections.length > 0 ? sections : ["summary","system","equipment","savings","roi","installation"];
}

// ─── KNOWLEDGE CENTER ─────────────────────────────────────────────────────────
function setupKnowledgeCenter() {
  document.querySelectorAll(".knowledge-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".knowledge-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".knowledge-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById(`knowledge-${tab.dataset.tab}`);
      if (panel) panel.classList.add("active");
    });
  });
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
function setupPricing() {
  document.querySelectorAll(".plan-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      if (plan === "free") {
        showNotification("Welcome to SolarGPT Free! You're already on the free plan.", "success");
      } else if (plan === "enterprise") {
        window.location.href = "mailto:salatrir@gmail.com?subject=SolarGPT Enterprise Inquiry";
      } else {
        showNotification(`${plan.charAt(0).toUpperCase() + plan.slice(1)} plan — payment integration coming soon! Contact salatrir@gmail.com`, "info");
      }
    });
  });
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function initDashboard() {
  // Will be rendered when user navigates to dashboard section
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = `<span class="spinner"></span> Processing...`;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || "Submit";
  }
}

function showNotification(message, type = "info") {
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const n = document.createElement("div");
  n.className = `notification notification-${type}`;
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  n.innerHTML = `<span>${icons[type] || "ℹ️"}</span> ${message}`;
  document.body.appendChild(n);

  setTimeout(() => n.classList.add("show"), 10);
  setTimeout(() => {
    n.classList.remove("show");
    setTimeout(() => n.remove(), 300);
  }, 4000);
}

function animateHero() {
  const stats = document.querySelectorAll(".hero-stat-number");
  stats.forEach(el => {
    const target = el.textContent.replace(/[^0-9]/g, "");
    if (!target) return;
    const suffix = el.textContent.replace(/[0-9]/g, "");
    let current = 0;
    const step = Math.ceil(parseInt(target) / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, parseInt(target));
      el.textContent = current.toLocaleString() + suffix;
      if (current >= parseInt(target)) clearInterval(timer);
    }, 30);
  });
}

// Expose for inline HTML usage
window.showSection = window.showSection;
window.runCalculation = runCalculation;
window.runBillAnalysis = runBillAnalysis;
