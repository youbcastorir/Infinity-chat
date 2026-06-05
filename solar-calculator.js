// SolarGPT — Solar Calculator Engine
// Handles all photovoltaic system sizing calculations

const SolarCalculator = (() => {
  // Constants
  const PANEL_WATTAGE = { mono: 400, poly: 300, thin: 200 };
  const PANEL_EFFICIENCY = { mono: 0.20, poly: 0.16, thin: 0.12 };
  const PANEL_AREA_M2 = { mono: 1.8, poly: 1.95, thin: 2.2 };
  const SYSTEM_LOSS_FACTOR = 0.80; // cables, inverter, soiling, temp
  const BATTERY_DAYS = 1.5; // days of autonomy for off-grid
  const BATTERY_DOD = 0.80; // depth of discharge
  const BATTERY_VOLTAGE = 48;
  const INVERTER_EFFICIENCY = 0.96;
  const INVERTER_OVERSIZING = 1.25;

  // Sun hours by location presets
  const SUN_HOURS = {
    "Morocco": 5.5, "Algeria": 5.4, "Tunisia": 5.2, "Libya": 5.6,
    "Egypt": 5.8, "Saudi Arabia": 6.2, "UAE": 5.9, "Kuwait": 5.7,
    "Qatar": 5.6, "Bahrain": 5.5, "Oman": 5.8, "Yemen": 5.7,
    "Jordan": 5.4, "Lebanon": 4.9, "Syria": 5.2, "Iraq": 5.5,
    "USA": 4.5, "Germany": 3.0, "France": 3.8, "Spain": 4.9,
    "Italy": 4.7, "Portugal": 4.8, "UK": 2.8, "Australia": 5.0,
    "India": 4.5, "China": 4.0, "Brazil": 5.0, "South Africa": 5.2,
    "default": 4.5
  };

  function getSunHours(location) {
    if (!location) return SUN_HOURS.default;
    const key = Object.keys(SUN_HOURS).find(k =>
      location.toLowerCase().includes(k.toLowerCase())
    );
    return key ? SUN_HOURS[key] : parseFloat(location) || SUN_HOURS.default;
  }

  /**
   * Main calculation function
   * @param {Object} inputs
   * @returns {Object} results
   */
  function calculate(inputs) {
    const {
      monthlyKwh = 0,
      monthlyBill = 0,
      location = "default",
      roofAreaM2 = 0,
      panelType = "mono",
      systemType = "grid", // grid | hybrid | offgrid
      electricityRate = 0.12,
    } = inputs;

    // Validate
    const kwh = parseFloat(monthlyKwh) || 0;
    const bill = parseFloat(monthlyBill) || 0;
    const area = parseFloat(roofAreaM2) || 0;
    const rate = parseFloat(electricityRate) || 0.12;

    // Derive kWh from bill if not provided
    const monthlyConsumption = kwh > 0 ? kwh : (rate > 0 ? bill / rate : bill / 0.12);
    const dailyConsumption = monthlyConsumption / 30;

    const sunHours = getSunHours(location);
    const panelW = PANEL_WATTAGE[panelType] || 400;
    const panelEff = PANEL_EFFICIENCY[panelType] || 0.20;
    const panelArea = PANEL_AREA_M2[panelType] || 1.8;

    // System size in kWp
    const systemKwp = dailyConsumption / (sunHours * SYSTEM_LOSS_FACTOR);

    // Number of panels
    const panelsRequired = Math.ceil((systemKwp * 1000) / panelW);

    // Actual system size
    const actualSystemKwp = (panelsRequired * panelW) / 1000;

    // Daily production (kWh)
    const dailyProduction = actualSystemKwp * sunHours * SYSTEM_LOSS_FACTOR;

    // Monthly production
    const monthlyProduction = dailyProduction * 30;

    // Annual production
    const annualProduction = dailyProduction * 365;

    // Inverter size (kVA)
    const inverterKw = Math.ceil(actualSystemKwp * INVERTER_OVERSIZING * 10) / 10;

    // Roof area needed
    const roofNeededM2 = Math.ceil(panelsRequired * panelArea);

    // Battery capacity (kWh) - only for hybrid/offgrid
    let batteryKwh = 0;
    let batteryAh = 0;
    if (systemType === "hybrid") {
      batteryKwh = (dailyConsumption * 0.5) / BATTERY_DOD; // 50% of daily from battery
    } else if (systemType === "offgrid") {
      batteryKwh = (dailyConsumption * BATTERY_DAYS) / BATTERY_DOD;
    }
    if (batteryKwh > 0) {
      batteryAh = Math.ceil((batteryKwh * 1000) / BATTERY_VOLTAGE);
    }

    // Financial
    const annualSavingsUsd = annualProduction * rate;
    const monthlySavingsUsd = monthlyProduction * rate;

    // Coverage percentage
    const solarCoveragePercent = Math.min(100, Math.round((monthlyProduction / monthlyConsumption) * 100));

    // Roof check
    const roofSufficient = area === 0 || area >= roofNeededM2;

    return {
      // System
      systemKwp: parseFloat(actualSystemKwp.toFixed(2)),
      panelsRequired,
      panelType,
      panelWatts: panelW,

      // Inverter
      inverterKw: parseFloat(inverterKw.toFixed(1)),

      // Battery
      batteryKwh: parseFloat(batteryKwh.toFixed(1)),
      batteryAh,
      systemType,

      // Roof
      roofNeededM2,
      roofSufficient,
      roofAvailableM2: area,

      // Production
      dailyProductionKwh: parseFloat(dailyProduction.toFixed(1)),
      monthlyProductionKwh: parseFloat(monthlyProduction.toFixed(0)),
      annualProductionKwh: parseFloat(annualProduction.toFixed(0)),
      solarCoveragePercent,

      // Financial
      annualSavingsUsd: parseFloat(annualSavingsUsd.toFixed(0)),
      monthlySavingsUsd: parseFloat(monthlySavingsUsd.toFixed(0)),

      // Location
      sunHoursPerDay: sunHours,
      monthlyConsumption: parseFloat(monthlyConsumption.toFixed(0)),
      dailyConsumption: parseFloat(dailyConsumption.toFixed(1)),
    };
  }

  /**
   * Equipment recommendations based on system size
   */
  function recommendEquipment(results) {
    const { systemKwp, batteryKwh, inverterKw, panelType, systemType } = results;

    const panels = recommendPanels(systemKwp, panelType);
    const inverters = recommendInverters(inverterKw, systemType);
    const batteries = batteryKwh > 0 ? recommendBatteries(batteryKwh) : [];
    const mounting = recommendMounting(systemKwp);

    return { panels, inverters, batteries, mounting };
  }

  function recommendPanels(systemKwp, type) {
    const options = {
      mono: [
        { brand: "Jinko Solar", model: "Tiger Neo 400W", efficiency: "21.4%", warranty: "25yr", price_per_w: 0.28 },
        { brand: "LONGi Solar", model: "Hi-MO6 405W", efficiency: "21.8%", warranty: "25yr", price_per_w: 0.29 },
        { brand: "Canadian Solar", model: "HiHero 410W", efficiency: "21.9%", warranty: "25yr", price_per_w: 0.30 },
      ],
      poly: [
        { brand: "Risen Energy", model: "RSM120-6 320W", efficiency: "16.5%", warranty: "25yr", price_per_w: 0.22 },
        { brand: "Trina Solar", model: "Honey 310W", efficiency: "16.2%", warranty: "25yr", price_per_w: 0.21 },
      ],
      thin: [
        { brand: "First Solar", model: "Series 6 Plus", efficiency: "17.1%", warranty: "25yr", price_per_w: 0.25 },
        { brand: "Solar Frontier", model: "SF175-S", efficiency: "13.8%", warranty: "20yr", price_per_w: 0.20 },
      ],
    };
    return (options[type] || options.mono).map(p => ({
      ...p,
      estimated_cost: `$${(systemKwp * 1000 * p.price_per_w).toFixed(0)}`,
    }));
  }

  function recommendInverters(inverterKw, systemType) {
    if (systemType === "offgrid") {
      return [
        { brand: "Victron Energy", model: `MultiPlus-II ${inverterKw}kVA`, type: "Off-Grid", warranty: "5yr", price: `$${(inverterKw * 280).toFixed(0)}` },
        { brand: "SMA", model: `Sunny Island ${inverterKw}kW`, type: "Off-Grid", warranty: "5yr", price: `$${(inverterKw * 320).toFixed(0)}` },
      ];
    } else if (systemType === "hybrid") {
      return [
        { brand: "SolarEdge", model: `StorEdge ${inverterKw}kW`, type: "Hybrid", warranty: "12yr", price: `$${(inverterKw * 350).toFixed(0)}` },
        { brand: "GoodWe", model: `ES ${inverterKw}kW`, type: "Hybrid", warranty: "10yr", price: `$${(inverterKw * 220).toFixed(0)}` },
        { brand: "Sungrow", model: `SH${inverterKw}T`, type: "Hybrid", warranty: "10yr", price: `$${(inverterKw * 200).toFixed(0)}` },
      ];
    } else {
      return [
        { brand: "SMA", model: `Sunny Boy ${inverterKw}kW`, type: "Grid-Tie", warranty: "10yr", price: `$${(inverterKw * 160).toFixed(0)}` },
        { brand: "Fronius", model: `Symo ${inverterKw}kW`, type: "Grid-Tie", warranty: "7yr", price: `$${(inverterKw * 180).toFixed(0)}` },
        { brand: "Huawei", model: `SUN2000 ${inverterKw}kW`, type: "Grid-Tie", warranty: "10yr", price: `$${(inverterKw * 140).toFixed(0)}` },
      ];
    }
  }

  function recommendBatteries(batteryKwh) {
    return [
      { brand: "Tesla", model: `Powerwall 2 (${Math.ceil(batteryKwh / 13.5)} units)`, capacity: `${batteryKwh.toFixed(1)} kWh`, chemistry: "LFP", warranty: "10yr", price: `$${(Math.ceil(batteryKwh / 13.5) * 9500).toFixed(0)}` },
      { brand: "BYD", model: `Battery-Box Premium HV`, capacity: `${batteryKwh.toFixed(1)} kWh`, chemistry: "LFP", warranty: "10yr", price: `$${(batteryKwh * 600).toFixed(0)}` },
      { brand: "Pylontech", model: `US3000C (${Math.ceil(batteryKwh / 3.55)} units)`, capacity: `${batteryKwh.toFixed(1)} kWh`, chemistry: "LFP", warranty: "10yr", price: `$${(batteryKwh * 420).toFixed(0)}` },
    ];
  }

  function recommendMounting(systemKwp) {
    return [
      { brand: "K2 Systems", model: "Rapid2+", type: "Roof Mount", warranty: "15yr", price: `$${(systemKwp * 80).toFixed(0)}` },
      { brand: "Schletter", model: "FlatFix Fusion", type: "Flat Roof", warranty: "15yr", price: `$${(systemKwp * 90).toFixed(0)}` },
      { brand: "IronRidge", model: "XR100 Rail", type: "Roof Mount", warranty: "20yr", price: `$${(systemKwp * 70).toFixed(0)}` },
    ];
  }

  // Render calculator results to DOM
  function renderResults(results, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;

    container.innerHTML = `
      <div class="results-grid">
        <div class="result-card primary">
          <div class="result-icon">☀️</div>
          <div class="result-value">${results.panelsRequired}</div>
          <div class="result-label">${t("calc_panels")}</div>
          <div class="result-detail">${results.panelWatts}W ${results.panelType}</div>
        </div>
        <div class="result-card">
          <div class="result-icon">⚡</div>
          <div class="result-value">${results.systemKwp} kWp</div>
          <div class="result-label">System Size</div>
          <div class="result-detail">${results.sunHoursPerDay}h/day sun</div>
        </div>
        <div class="result-card">
          <div class="result-icon">🔄</div>
          <div class="result-value">${results.inverterKw} kW</div>
          <div class="result-label">${t("calc_inverter")}</div>
          <div class="result-detail">${results.systemType} system</div>
        </div>
        ${results.batteryKwh > 0 ? `
        <div class="result-card">
          <div class="result-icon">🔋</div>
          <div class="result-value">${results.batteryKwh} kWh</div>
          <div class="result-label">${t("calc_battery_cap")}</div>
          <div class="result-detail">${results.batteryAh}Ah @ 48V</div>
        </div>` : ""}
        <div class="result-card">
          <div class="result-icon">🏠</div>
          <div class="result-value">${results.roofNeededM2} m²</div>
          <div class="result-label">${t("calc_roof")}</div>
          <div class="result-detail">${results.roofSufficient ? "✓ Sufficient roof" : "⚠️ Check roof area"}</div>
        </div>
        <div class="result-card">
          <div class="result-icon">📊</div>
          <div class="result-value">${results.dailyProductionKwh} kWh</div>
          <div class="result-label">${t("calc_daily")}</div>
          <div class="result-detail">${results.annualProductionKwh.toLocaleString()} kWh/year</div>
        </div>
        <div class="result-card highlight">
          <div class="result-icon">💰</div>
          <div class="result-value">$${results.monthlySavingsUsd}</div>
          <div class="result-label">${t("calc_annual")}</div>
          <div class="result-detail">$${results.annualSavingsUsd.toLocaleString()}/year</div>
        </div>
        <div class="result-card">
          <div class="result-icon">🌱</div>
          <div class="result-value">${results.solarCoveragePercent}%</div>
          <div class="result-label">Solar Coverage</div>
          <div class="result-detail">${results.monthlyProductionKwh} kWh/month</div>
        </div>
      </div>
      <div class="coverage-bar-wrapper">
        <div class="coverage-bar-label">
          <span>Solar Coverage</span>
          <span>${results.solarCoveragePercent}%</span>
        </div>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${results.solarCoveragePercent}%"></div>
        </div>
      </div>
    `;

    container.classList.add("visible");
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return { calculate, recommendEquipment, renderResults, getSunHours };
})();

window.SolarCalculator = SolarCalculator;
