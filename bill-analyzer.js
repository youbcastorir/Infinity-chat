// SolarGPT — Bill Analyzer Module
// Analyzes electricity bills and recommends solar systems

const BillAnalyzer = (() => {

  function analyze(inputs) {
    const {
      monthlyBill = 0,
      monthlyKwh = 0,
      electricityRate = 0.12,
      sunHours = 4.5,
      systemCostPerW = 1.0,
      incentivePercent = 0,
    } = inputs;

    const bill = parseFloat(monthlyBill) || 0;
    const kwh = parseFloat(monthlyKwh) || 0;
    const rate = parseFloat(electricityRate) || 0.12;
    const sun = parseFloat(sunHours) || 4.5;
    const costPerW = parseFloat(systemCostPerW) || 1.0;
    const incentive = parseFloat(incentivePercent) / 100 || 0;

    // Derive consumption
    const monthlyConsumption = kwh > 0 ? kwh : (rate > 0 ? bill / rate : bill / 0.12);
    const annualConsumption = monthlyConsumption * 12;
    const dailyConsumption = monthlyConsumption / 30;

    // Recommended system size (kWp) — cover 100% of consumption
    const systemKwp = dailyConsumption / (sun * 0.80);
    const systemKwpRounded = Math.ceil(systemKwp * 10) / 10;

    // Panels (using 400W mono as standard)
    const panelsNeeded = Math.ceil((systemKwpRounded * 1000) / 400);

    // Production
    const dailyProduction = systemKwpRounded * sun * 0.80;
    const monthlyProduction = dailyProduction * 30;
    const annualProduction = dailyProduction * 365;

    // Savings
    const monthlySavings = Math.min(monthlyProduction * rate, bill);
    const annualSavings = monthlySavings * 12;

    // Cost
    const grossCost = systemKwpRounded * 1000 * costPerW;
    const netCost = grossCost * (1 - incentive);

    // Payback
    const paybackYears = netCost > 0 && annualSavings > 0
      ? parseFloat((netCost / annualSavings).toFixed(1))
      : 0;

    // 20-year savings (with 3% annual electricity rate increase)
    let totalSavings20 = 0;
    let currentSavings = annualSavings;
    for (let i = 0; i < 20; i++) {
      totalSavings20 += currentSavings;
      currentSavings *= 1.03;
    }

    // ROI
    const roi20 = netCost > 0
      ? parseFloat(((totalSavings20 - netCost) / netCost * 100).toFixed(0))
      : 0;

    // CO2 avoided (0.4 kg CO2 per kWh average)
    const co2AvoidedAnnualKg = Math.round(annualProduction * 0.4);
    const treesEquivalent = Math.round(co2AvoidedAnnualKg / 21);

    // Bill reduction percentage
    const billReductionPercent = bill > 0
      ? Math.min(100, Math.round((monthlySavings / bill) * 100))
      : 0;

    return {
      // Input summary
      monthlyBill: bill,
      monthlyConsumption: parseFloat(monthlyConsumption.toFixed(0)),
      electricityRate: rate,
      sunHoursPerDay: sun,

      // Recommendation
      recommendedSystemKwp: systemKwpRounded,
      panelsNeeded,

      // Production
      dailyProductionKwh: parseFloat(dailyProduction.toFixed(1)),
      monthlyProductionKwh: parseFloat(monthlyProduction.toFixed(0)),
      annualProductionKwh: parseFloat(annualProduction.toFixed(0)),

      // Savings
      monthlySavingsUsd: parseFloat(monthlySavings.toFixed(0)),
      annualSavingsUsd: parseFloat(annualSavings.toFixed(0)),
      totalSavings20Yr: parseFloat(totalSavings20.toFixed(0)),
      billReductionPercent,

      // Financials
      estimatedSystemCost: parseFloat(grossCost.toFixed(0)),
      netCostAfterIncentive: parseFloat(netCost.toFixed(0)),
      paybackYears,
      roi20YrPercent: roi20,

      // Environment
      co2AvoidedAnnualKg,
      treesEquivalent,
    };
  }

  function renderResults(results, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;

    container.innerHTML = `
      <div class="bill-results-header">
        <div class="bill-hero-stat">
          <span class="bill-reduction">${results.billReductionPercent}%</span>
          <span class="bill-reduction-label">Bill Reduction Potential</span>
        </div>
      </div>

      <div class="results-grid">
        <div class="result-card highlight">
          <div class="result-icon">💵</div>
          <div class="result-value">$${results.monthlySavingsUsd}</div>
          <div class="result-label">${t("bill_savings")}</div>
          <div class="result-detail">$${results.annualSavingsUsd.toLocaleString()}/year</div>
        </div>
        <div class="result-card primary">
          <div class="result-icon">⚡</div>
          <div class="result-value">${results.recommendedSystemKwp} kWp</div>
          <div class="result-label">${t("bill_system_size")}</div>
          <div class="result-detail">Covers ${results.billReductionPercent}% of usage</div>
        </div>
        <div class="result-card">
          <div class="result-icon">☀️</div>
          <div class="result-value">${results.panelsNeeded}</div>
          <div class="result-label">${t("bill_panels_needed")}</div>
          <div class="result-detail">400W Monocrystalline</div>
        </div>
        <div class="result-card">
          <div class="result-icon">📅</div>
          <div class="result-value">${results.paybackYears} yrs</div>
          <div class="result-label">${t("bill_payback")}</div>
          <div class="result-detail">Simple payback period</div>
        </div>
        <div class="result-card">
          <div class="result-icon">📈</div>
          <div class="result-value">$${results.totalSavings20Yr.toLocaleString()}</div>
          <div class="result-label">${t("bill_20yr")}</div>
          <div class="result-detail">ROI: ${results.roi20YrPercent}%</div>
        </div>
        <div class="result-card">
          <div class="result-icon">🌿</div>
          <div class="result-value">${results.co2AvoidedAnnualKg.toLocaleString()} kg</div>
          <div class="result-label">CO₂ Avoided/Year</div>
          <div class="result-detail">≈ ${results.treesEquivalent} trees planted</div>
        </div>
      </div>

      <div class="savings-timeline">
        <h4>Savings Over Time</h4>
        <div class="timeline-bars">
          ${[1, 5, 10, 15, 20].map(year => {
            let cum = 0, s = results.annualSavingsUsd;
            for (let i = 0; i < year; i++) { cum += s; s *= 1.03; }
            const net = cum - results.netCostAfterIncentive;
            const pct = Math.min(100, Math.max(0, (cum / (results.totalSavings20Yr || 1)) * 100));
            return `
              <div class="timeline-bar-item">
                <div class="tbar-label">Year ${year}</div>
                <div class="tbar-track">
                  <div class="tbar-fill ${net >= 0 ? 'positive' : 'negative'}" style="width:${pct}%"></div>
                </div>
                <div class="tbar-value ${net >= 0 ? 'pos' : 'neg'}">
                  ${net >= 0 ? '+' : ''}$${Math.round(net).toLocaleString()}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="bill-breakdown">
        <div class="breakdown-item">
          <span>Estimated System Cost</span>
          <span>$${results.estimatedSystemCost.toLocaleString()}</span>
        </div>
        <div class="breakdown-item">
          <span>After Incentives</span>
          <span class="highlight-text">$${results.netCostAfterIncentive.toLocaleString()}</span>
        </div>
        <div class="breakdown-item">
          <span>Monthly Production</span>
          <span>${results.monthlyProductionKwh.toLocaleString()} kWh</span>
        </div>
        <div class="breakdown-item">
          <span>Current Monthly Bill</span>
          <span>$${results.monthlyBill}</span>
        </div>
        <div class="breakdown-item">
          <span>New Monthly Bill (est.)</span>
          <span class="highlight-text">$${Math.max(0, results.monthlyBill - results.monthlySavingsUsd)}</span>
        </div>
      </div>
    `;

    container.classList.add("visible");
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return { analyze, renderResults };
})();

window.BillAnalyzer = BillAnalyzer;
