// SolarGPT — Report Generator Module
// Generates professional HTML/PDF reports for solar projects

const Reports = (() => {

  function generateReportHTML(data) {
    const {
      projectName = "Solar Project",
      clientName = "Valued Client",
      projectDate = new Date().toLocaleDateString(),
      calcResults = {},
      billResults = {},
      costResults = {},
      equipment = {},
      sections = ["summary","system","equipment","savings","roi","installation"],
      companyName = "SolarGPT",
    } = data;

    const cr = calcResults;
    const br = billResults;
    const co = costResults;

    const systemKwp = cr.systemKwp || br.recommendedSystemKwp || co.systemKwp || 0;
    const panels = cr.panelsRequired || br.panelsNeeded || 0;
    const monthlySavings = cr.monthlySavingsUsd || br.monthlySavingsUsd || co.monthlySavingsUsd || 0;
    const annualSavings = cr.annualSavingsUsd || br.annualSavingsUsd || co.annualSavingsUsd || 0;
    const payback = co.paybackYears || br.paybackYears || 0;
    const roi = co.roi25yr || br.roi20YrPercent || 0;
    const totalCost = co.totalCost || 0;
    const netCost = co.netCost || br.netCostAfterIncentive || 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Solar Project Report — ${projectName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Sora',sans-serif; color:#1a2332; background:#fff; font-size:14px; }
  .report-page { max-width:850px; margin:0 auto; padding:40px; }

  /* Header */
  .report-header { background:linear-gradient(135deg,#0f4c2a 0%,#1a7a42 50%,#f59e0b 100%); color:#fff; padding:40px; border-radius:16px; margin-bottom:32px; position:relative; overflow:hidden; }
  .report-header::before { content:''; position:absolute; right:-40px; top:-40px; width:200px; height:200px; background:rgba(255,255,255,0.05); border-radius:50%; }
  .report-header::after { content:'☀️'; position:absolute; right:40px; top:50%; transform:translateY(-50%); font-size:64px; opacity:0.3; }
  .report-logo { font-size:24px; font-weight:700; margin-bottom:8px; letter-spacing:-0.5px; }
  .report-logo span { color:#f59e0b; }
  .report-title { font-size:32px; font-weight:700; margin-bottom:4px; }
  .report-subtitle { opacity:0.8; font-size:14px; }
  .report-meta { display:flex; gap:32px; margin-top:24px; }
  .meta-item { display:flex; flex-direction:column; gap:2px; }
  .meta-label { font-size:11px; opacity:0.7; text-transform:uppercase; letter-spacing:1px; }
  .meta-value { font-size:14px; font-weight:600; }

  /* Sections */
  .section { margin-bottom:28px; break-inside:avoid; }
  .section-title { font-size:18px; font-weight:700; color:#0f4c2a; border-left:4px solid #f59e0b; padding-left:12px; margin-bottom:16px; }

  /* Summary cards */
  .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
  .summary-card { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px; text-align:center; }
  .summary-card.gold { background:#fffbeb; border-color:#fde68a; }
  .summary-card .card-icon { font-size:28px; margin-bottom:4px; }
  .summary-card .card-value { font-size:22px; font-weight:700; color:#0f4c2a; }
  .summary-card.gold .card-value { color:#b45309; }
  .summary-card .card-label { font-size:11px; color:#6b7280; margin-top:2px; }

  /* Tables */
  table { width:100%; border-collapse:collapse; font-size:13px; }
  thead tr { background:#0f4c2a; color:#fff; }
  thead th { padding:10px 14px; text-align:left; font-weight:600; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  tbody tr:hover { background:#f0fdf4; }
  tbody td { padding:10px 14px; border-bottom:1px solid #e5e7eb; }
  .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; }
  .badge-green { background:#dcfce7; color:#15803d; }
  .badge-blue { background:#dbeafe; color:#1d4ed8; }
  .badge-amber { background:#fef3c7; color:#b45309; }

  /* ROI Chart */
  .roi-chart { background:#f9fafb; border-radius:12px; padding:20px; }
  .roi-bar-row { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
  .roi-bar-year { width:60px; font-size:12px; color:#6b7280; flex-shrink:0; }
  .roi-bar-track { flex:1; background:#e5e7eb; border-radius:99px; height:16px; overflow:hidden; }
  .roi-bar-fill { height:100%; border-radius:99px; transition:width 0.3s; }
  .roi-bar-fill.pos { background:linear-gradient(90deg,#22c55e,#16a34a); }
  .roi-bar-fill.neg { background:linear-gradient(90deg,#ef4444,#dc2626); }
  .roi-bar-amt { width:110px; font-size:12px; font-weight:600; text-align:right; flex-shrink:0; }
  .roi-bar-amt.pos { color:#16a34a; }
  .roi-bar-amt.neg { color:#dc2626; }

  /* System specs */
  .specs-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .spec-group { background:#f9fafb; border-radius:12px; padding:16px; }
  .spec-group-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#6b7280; margin-bottom:12px; }
  .spec-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #e5e7eb; }
  .spec-row:last-child { border:none; }
  .spec-key { color:#6b7280; font-size:12px; }
  .spec-val { font-weight:600; font-size:13px; color:#1a2332; }

  /* Environment */
  .env-banner { background:linear-gradient(135deg,#dcfce7,#bbf7d0); border-radius:12px; padding:20px; display:flex; gap:24px; align-items:center; }
  .env-stat { text-align:center; flex:1; }
  .env-stat .env-icon { font-size:32px; }
  .env-stat .env-value { font-size:20px; font-weight:700; color:#15803d; margin-top:4px; }
  .env-stat .env-label { font-size:11px; color:#6b7280; }

  /* Footer */
  .report-footer { margin-top:40px; padding-top:20px; border-top:2px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#9ca3af; }
  .report-footer a { color:#0f4c2a; text-decoration:none; }
  .disclaimer { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px; font-size:11px; color:#92400e; margin-top:16px; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .report-page { padding:20px; }
    .no-print { display:none; }
  }
</style>
</head>
<body>
<div class="report-page">

  <!-- Header -->
  <div class="report-header">
    <div class="report-logo">Solar<span>GPT</span></div>
    <div class="report-title">${projectName}</div>
    <div class="report-subtitle">Professional Solar Energy Assessment Report</div>
    <div class="report-meta">
      <div class="meta-item"><span class="meta-label">Client</span><span class="meta-value">${clientName}</span></div>
      <div class="meta-item"><span class="meta-label">Date</span><span class="meta-value">${projectDate}</span></div>
      <div class="meta-item"><span class="meta-label">System Size</span><span class="meta-value">${systemKwp} kWp</span></div>
      <div class="meta-item"><span class="meta-label">Generated by</span><span class="meta-value">LLM.Solar / SolarGPT</span></div>
    </div>
  </div>

  ${sections.includes("summary") ? `
  <!-- Summary -->
  <div class="section">
    <div class="section-title">📋 Project Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="card-icon">☀️</div>
        <div class="card-value">${systemKwp} kWp</div>
        <div class="card-label">System Size</div>
      </div>
      <div class="summary-card">
        <div class="card-icon">🔆</div>
        <div class="card-value">${panels}</div>
        <div class="card-label">Solar Panels</div>
      </div>
      <div class="summary-card gold">
        <div class="card-icon">💰</div>
        <div class="card-value">$${monthlySavings}/mo</div>
        <div class="card-label">Monthly Savings</div>
      </div>
      <div class="summary-card gold">
        <div class="card-icon">📅</div>
        <div class="card-value">${payback} yrs</div>
        <div class="card-label">Payback Period</div>
      </div>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;">
      This report provides a comprehensive assessment of the proposed ${systemKwp} kWp solar energy system for ${clientName}.
      The system is designed to generate approximately ${cr.annualProductionKwh || br.annualProductionKwh || Math.round(systemKwp * 1600)} kWh annually,
      delivering estimated savings of <strong>$${annualSavings.toLocaleString()}/year</strong> with a projected ROI of <strong>${roi}%</strong> over 25 years.
    </p>
  </div>
  ` : ""}

  ${sections.includes("system") ? `
  <!-- System Specifications -->
  <div class="section">
    <div class="section-title">⚙️ System Specifications</div>
    <div class="specs-grid">
      <div class="spec-group">
        <div class="spec-group-title">PV Array</div>
        <div class="spec-row"><span class="spec-key">Nominal Power</span><span class="spec-val">${systemKwp} kWp</span></div>
        <div class="spec-row"><span class="spec-key">Number of Panels</span><span class="spec-val">${panels} panels</span></div>
        <div class="spec-row"><span class="spec-key">Panel Type</span><span class="spec-val">${cr.panelType ? cr.panelType.charAt(0).toUpperCase() + cr.panelType.slice(1) : "Monocrystalline"}</span></div>
        <div class="spec-row"><span class="spec-key">Panel Wattage</span><span class="spec-val">${cr.panelWatts || 400}W</span></div>
        <div class="spec-row"><span class="spec-key">Roof Area Required</span><span class="spec-val">${cr.roofNeededM2 || Math.round(panels * 1.8)} m²</span></div>
      </div>
      <div class="spec-group">
        <div class="spec-group-title">Balance of System</div>
        <div class="spec-row"><span class="spec-key">Inverter Size</span><span class="spec-val">${cr.inverterKw || Math.round(systemKwp * 1.25)} kW</span></div>
        <div class="spec-row"><span class="spec-key">System Type</span><span class="spec-val">${cr.systemType || "Grid-Tied"}</span></div>
        <div class="spec-row"><span class="spec-key">Battery Capacity</span><span class="spec-val">${cr.batteryKwh > 0 ? cr.batteryKwh + " kWh" : "N/A"}</span></div>
        <div class="spec-row"><span class="spec-key">Sun Hours/Day</span><span class="spec-val">${cr.sunHoursPerDay || br.sunHoursPerDay || 4.5}h</span></div>
        <div class="spec-row"><span class="spec-key">System Efficiency</span><span class="spec-val">80%</span></div>
      </div>
    </div>
  </div>
  ` : ""}

  ${sections.includes("equipment") ? `
  <!-- Equipment List -->
  <div class="section">
    <div class="section-title">🔧 Recommended Equipment</div>
    <table>
      <thead>
        <tr><th>Component</th><th>Brand / Model</th><th>Specification</th><th>Warranty</th><th>Est. Cost</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Solar Panels</td>
          <td>Jinko Solar Tiger Neo</td>
          <td>${panels} × 400W Mono</td>
          <td><span class="badge badge-green">25 Years</span></td>
          <td>$${Math.round(panels * 400 * 0.28).toLocaleString()}</td>
        </tr>
        <tr>
          <td>String Inverter</td>
          <td>SMA / Fronius / Huawei</td>
          <td>${cr.inverterKw || Math.round(systemKwp * 1.25)} kW Grid-Tie</td>
          <td><span class="badge badge-blue">10 Years</span></td>
          <td>$${Math.round((cr.inverterKw || systemKwp * 1.25) * 170).toLocaleString()}</td>
        </tr>
        ${cr.batteryKwh > 0 ? `
        <tr>
          <td>Battery Storage</td>
          <td>Pylontech / BYD</td>
          <td>${cr.batteryKwh} kWh LFP</td>
          <td><span class="badge badge-green">10 Years</span></td>
          <td>$${Math.round(cr.batteryKwh * 500).toLocaleString()}</td>
        </tr>` : ""}
        <tr>
          <td>Mounting System</td>
          <td>K2 Systems / IronRidge</td>
          <td>Roof-mount aluminum rails</td>
          <td><span class="badge badge-blue">15 Years</span></td>
          <td>$${Math.round(systemKwp * 80).toLocaleString()}</td>
        </tr>
        <tr>
          <td>Monitoring</td>
          <td>SolarEdge / Sungrow App</td>
          <td>Real-time production monitor</td>
          <td><span class="badge badge-amber">5 Years</span></td>
          <td>$150</td>
        </tr>
        <tr>
          <td>Wiring & Protection</td>
          <td>Schneider / Legrand</td>
          <td>DC/AC protection, surge</td>
          <td><span class="badge badge-amber">2 Years</span></td>
          <td>$${Math.round(systemKwp * 30).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ""}

  ${sections.includes("savings") ? `
  <!-- Savings Forecast -->
  <div class="section">
    <div class="section-title">💰 Savings Forecast</div>
    <table style="margin-bottom:16px;">
      <thead>
        <tr><th>Period</th><th>Production (kWh)</th><th>Gross Savings</th><th>Cumulative Savings</th><th>Net Position</th></tr>
      </thead>
      <tbody>
        ${[1, 5, 10, 15, 20, 25].map(year => {
          const ann = annualSavings;
          let cum = 0, s = ann;
          for (let i = 0; i < year; i++) { cum += s; s *= 1.03; }
          const net = cum - (netCost || totalCost || 5000);
          const prod = Math.round(systemKwp * 1600 * year * 0.995);
          return `<tr>
            <td>Year ${year}</td>
            <td>${prod.toLocaleString()}</td>
            <td>$${Math.round(cum).toLocaleString()}</td>
            <td>$${Math.round(cum).toLocaleString()}</td>
            <td style="color:${net >= 0 ? '#16a34a' : '#dc2626'};font-weight:600;">${net >= 0 ? '+' : ''}$${Math.round(net).toLocaleString()}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
    <div class="env-banner">
      <div class="env-stat"><div class="env-icon">🌱</div><div class="env-value">${Math.round(systemKwp * 640)} kg</div><div class="env-label">CO₂ Avoided/Year</div></div>
      <div class="env-stat"><div class="env-icon">🌳</div><div class="env-value">${Math.round(systemKwp * 30)}</div><div class="env-label">Trees Equivalent</div></div>
      <div class="env-stat"><div class="env-icon">⚡</div><div class="env-value">${Math.round(systemKwp * 1600).toLocaleString()} kWh</div><div class="env-label">Annual Production</div></div>
      <div class="env-stat"><div class="env-icon">🏠</div><div class="env-value">25 yrs</div><div class="env-label">Panel Lifespan</div></div>
    </div>
  </div>
  ` : ""}

  ${sections.includes("roi") ? `
  <!-- ROI Analysis -->
  <div class="section">
    <div class="section-title">📈 ROI Analysis</div>
    <div class="roi-chart">
      <p style="font-size:12px;color:#6b7280;margin-bottom:16px;">Cumulative net cash flow (including system cost recovery)</p>
      ${[1,3,5,7,10,15,20,25].map(year => {
        let cum = 0, s = annualSavings;
        for (let i = 0; i < year; i++) { cum += s; s *= 1.03; }
        const net = cum - (netCost || totalCost || 5000);
        const maxNet = annualSavings * 25 * 1.5;
        const pct = Math.min(100, Math.abs(net) / maxNet * 100);
        return `
          <div class="roi-bar-row">
            <span class="roi-bar-year">Year ${year}</span>
            <div class="roi-bar-track">
              <div class="roi-bar-fill ${net >= 0 ? 'pos' : 'neg'}" style="width:${pct}%"></div>
            </div>
            <span class="roi-bar-amt ${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}$${Math.round(net).toLocaleString()}</span>
          </div>
        `;
      }).join("")}
    </div>
  </div>
  ` : ""}

  ${sections.includes("installation") ? `
  <!-- Installation Notes -->
  <div class="section">
    <div class="section-title">🔩 Installation Notes & Next Steps</div>
    <table>
      <thead><tr><th>Step</th><th>Task</th><th>Est. Duration</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Site Assessment & Shading Analysis</td><td>1 day</td><td>Verify roof orientation, tilt angle, and shading</td></tr>
        <tr><td>2</td><td>Permits & Grid Connection Application</td><td>2–4 weeks</td><td>Contact local utility for net metering agreement</td></tr>
        <tr><td>3</td><td>Equipment Procurement</td><td>1–3 weeks</td><td>Order panels, inverter, mounting hardware</td></tr>
        <tr><td>4</td><td>Structural Roof Assessment</td><td>1 day</td><td>Confirm roof can support panel weight (~12 kg/m²)</td></tr>
        <tr><td>5</td><td>Mounting System Installation</td><td>1–2 days</td><td>Rails, flashings, and waterproofing</td></tr>
        <tr><td>6</td><td>Panel Installation & Wiring</td><td>1–2 days</td><td>PV modules, DC cabling, string configuration</td></tr>
        <tr><td>7</td><td>Inverter & AC Connection</td><td>1 day</td><td>Licensed electrician required</td></tr>
        <tr><td>8</td><td>System Commissioning & Testing</td><td>1 day</td><td>Performance verification and monitoring setup</td></tr>
        <tr><td>9</td><td>Grid Connection & Handover</td><td>1–2 days</td><td>Utility inspection and meter change</td></tr>
      </tbody>
    </table>
  </div>
  ` : ""}

  <div class="disclaimer">
    ⚠️ <strong>Disclaimer:</strong> This report is generated by SolarGPT AI and is intended for preliminary planning purposes only. 
    All figures are estimates based on provided inputs and standard assumptions. Final system design, costs, and savings may vary. 
    A licensed solar professional should conduct an on-site assessment before installation.
  </div>

  <div class="report-footer">
    <div>
      Generated by <strong>SolarGPT</strong> — <a href="https://llm.solar">llm.solar</a> | 
      Support: <a href="mailto:salatrir@gmail.com">salatrir@gmail.com</a>
    </div>
    <div>Report Date: ${projectDate}</div>
  </div>

</div>
</body>
</html>`;
  }

  function downloadReport(data) {
    const html = generateReportHTML(data);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SolarGPT_Report_${(data.projectName || "Project").replace(/\s+/g, "_")}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // Save to dashboard history
    saveReportToHistory(data);
  }

  function previewReport(data, previewContainerId) {
    const html = generateReportHTML(data);
    const container = document.getElementById(previewContainerId);
    if (!container) return;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:100%;height:700px;border:none;border-radius:12px;";
    container.innerHTML = "";
    container.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  }

  function saveReportToHistory(data) {
    const reports = JSON.parse(localStorage.getItem("solargpt_reports") || "[]");
    reports.unshift({
      id: Date.now(),
      projectName: data.projectName,
      clientName: data.clientName,
      date: data.projectDate || new Date().toLocaleDateString(),
      systemKwp: data.calcResults?.systemKwp || data.billResults?.recommendedSystemKwp || 0,
      timestamp: Date.now(),
    });
    localStorage.setItem("solargpt_reports", JSON.stringify(reports.slice(0, 50)));
    if (window.Dashboard) window.Dashboard.refresh();
  }

  return { generateReportHTML, downloadReport, previewReport };
})();

window.Reports = Reports;
