// DARK MODE
function toggleDark() {
    document.body.classList.toggle("dark");
    localStorage.setItem("dark", document.body.classList.contains("dark"));
}
if (localStorage.getItem("dark") === "true") {
    document.body.classList.add("dark");
}

let lastClientEUR = null;

// Pagalbinė: saugo ir atkuria būseną
function saveState() {
    const state = {
        invoiceCurrency: document.getElementById("invoiceCurrency").value,
        invoiceAmount: document.getElementById("invoiceAmount").value,
        invoiceEUR: document.getElementById("invoiceEUR").value,
        brokerPercent: document.getElementById("brokerPercent").value,
        brokerCustom: document.getElementById("brokerCustom").value,
        myPercent: document.getElementById("myPercent").value,
        myCustom: document.getElementById("myCustom").value,
        resInvoiceEUR: document.getElementById("resInvoiceEUR").textContent,
        resCost: document.getElementById("resCost").textContent,
        resClient: document.getElementById("resClient").textContent,
        resProfit: document.getElementById("resProfit").textContent,
        resProfitPercent: document.getElementById("resProfitPercent").textContent,
        resMarginDiff: document.getElementById("resMarginDiff").textContent,
        resVsAON: document.getElementById("resVsAON").textContent,
        resVsLeg: document.getElementById("resVsLeg").textContent,
        resAON: document.getElementById("resAON").textContent,
        resLeg: document.getElementById("resLeg").textContent,
        lang: document.getElementById("lang").value,
        showEUR: document.getElementById("showEUR").checked,
        showExtra: document.getElementById("showExtra").checked,
        showDate: document.getElementById("showDate").checked,
        showInvoice: document.getElementById("showInvoice").checked,
        extraCurrency: document.getElementById("extraCurrency").value,
        clientText: document.getElementById("clientText").value,
        pdfMode: document.getElementById("pdfMode").value,
        lastClientEUR: lastClientEUR,
        ecbToday: document.getElementById("ecbToday").textContent,
        ecbYesterday: document.getElementById("ecbYesterday").textContent,
        ecbChange: document.getElementById("ecbChange").textContent,
    };
    localStorage.setItem("insuranceCalcState", JSON.stringify(state));
}

function restoreState() {
    const raw = localStorage.getItem("insuranceCalcState");
    if (!raw) return;
    try {
        const s = JSON.parse(raw);
        document.getElementById("invoiceCurrency").value = s.invoiceCurrency ?? "USD";
        document.getElementById("invoiceAmount").value = s.invoiceAmount ?? "";
        document.getElementById("invoiceEUR").value = s.invoiceEUR ?? "";

        document.getElementById("brokerPercent").value = s.brokerPercent ?? "0.07";
        document.getElementById("brokerCustom").value = s.brokerCustom ?? "";
        document.getElementById("myPercent").value = s.myPercent ?? "0.24";
        document.getElementById("myCustom").value = s.myCustom ?? "";

        document.getElementById("brokerCustom").disabled = (document.getElementById("brokerPercent").value !== "custom");
        document.getElementById("myCustom").disabled = (document.getElementById("myPercent").value !== "custom");

        document.getElementById("resInvoiceEUR").textContent = s.resInvoiceEUR ?? "–";
        document.getElementById("resCost").textContent = s.resCost ?? "–";
        document.getElementById("resClient").textContent = s.resClient ?? "–";
        document.getElementById("resProfit").textContent = s.resProfit ?? "–";
        document.getElementById("resProfitPercent").textContent = s.resProfitPercent ?? "–";
        document.getElementById("resMarginDiff").textContent = s.resMarginDiff ?? "–";
        document.getElementById("resVsAON").textContent = s.resVsAON ?? "–";
        document.getElementById("resVsLeg").textContent = s.resVsLeg ?? "–";
        document.getElementById("resAON").textContent = s.resAON ?? "–";
        document.getElementById("resLeg").textContent = s.resLeg ?? "–";

        document.getElementById("lang").value = s.lang ?? "LT";
        document.getElementById("showEUR").checked = s.showEUR ?? true;
        document.getElementById("showExtra").checked = s.showExtra ?? true;
        document.getElementById("showDate").checked = s.showDate ?? true;
        document.getElementById("showInvoice").checked = s.showInvoice ?? true;
        document.getElementById("extraCurrency").value = s.extraCurrency ?? "USD";
        document.getElementById("clientText").value = s.clientText ?? "";
        document.getElementById("pdfMode").value = s.pdfMode ?? "both";

        lastClientEUR = s.lastClientEUR ?? null;

        if (s.ecbToday) document.getElementById("ecbToday").textContent = s.ecbToday;
        if (s.ecbYesterday) document.getElementById("ecbYesterday").textContent = s.ecbYesterday;
        if (s.ecbChange) document.getElementById("ecbChange").textContent = s.ecbChange;
    } catch (e) {
        console.error("Nepavyko atkurti būsenos", e);
    }
}

// ECB istorija: šiandien + vakar
async function updateECBInfo() {
    const cur = document.getElementById("invoiceCurrency").value;
    const todayEl = document.getElementById("ecbToday");
    const yesterdayEl = document.getElementById("ecbYesterday");
    const changeEl = document.getElementById("ecbChange");

    if (!cur || cur === "EUR") {
        todayEl.textContent = "Šiandienos kursas: 1 EUR = 1.0000 EUR";
        yesterdayEl.textContent = "Vakar: –";
        changeEl.textContent = "Pokytis: –";
        saveState();
        return;
    }

    const today = new Date();
    const y = new Date(today);
    y.setDate(today.getDate() - 1);

    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    const todayStr = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
    const yStr = y.getFullYear() + "-" + pad(y.getMonth() + 1) + "-" + pad(y.getDate());

    try {
        const [rToday, rY] = await Promise.all([
            fetch(`https://api.frankfurter.app/latest?from=${cur}&to=EUR`),
            fetch(`https://api.frankfurter.app/${yStr}?from=${cur}&to=EUR`)
        ]);

        const dToday = await rToday.json();
        const dY = await rY.json();

        const rateToday = dToday && dToday.rates && dToday.rates.EUR ? dToday.rates.EUR : null;
        const rateY = dY && dY.rates && dY.rates.EUR ? dY.rates.EUR : null;

        if (rateToday) {
            todayEl.textContent = `Šiandienos kursas: 1 ${cur} = ${rateToday.toFixed(4)} EUR`;
        } else {
            todayEl.textContent = "Šiandienos kursas: –";
        }

        if (rateY) {
            yesterdayEl.textContent = `Vakar: 1 ${cur} = ${rateY.toFixed(4)} EUR`;
            if (rateToday) {
                const diff = (rateToday - rateY) / rateY * 100;
                const rounded = diff.toFixed(2);
                const sign = diff > 0 ? "+" : "";
                changeEl.textContent = `Pokytis: ${sign}${rounded}%`;
            } else {
                changeEl.textContent = "Pokytis: –";
            }
        } else {
            yesterdayEl.textContent = "Vakar: –";
            changeEl.textContent = "Pokytis: –";
        }
    } catch (e) {
        todayEl.textContent = "Šiandienos kursas: –";
        yesterdayEl.textContent = "Vakar: –";
        changeEl.textContent = "Pokytis: –";
    }
    saveState();
}

// Auto konvertavimas į EUR
async function autoConvert() {
    const cur = document.getElementById("invoiceCurrency").value;
    const amt = parseFloat(document.getElementById("invoiceAmount").value);
    const out = document.getElementById("invoiceEUR");

    if (!amt) {
        out.value = "";
        await updateECBInfo();
        saveState();
        return;
    }

    if (cur === "EUR") {
        out.value = amt.toFixed(2);
        await updateECBInfo();
        saveState();
        return;
    }

    try {
        const r = await fetch(`https://api.frankfurter.app/latest?from=${cur}&to=EUR`);
        const data = await r.json();
        if (data && data.rates && data.rates.EUR) {
            out.value = (amt * data.rates.EUR).toFixed(4);
        } else {
            out.value = "";
        }
    } catch {
        out.value = "";
    }
    await updateECBInfo();
    saveState();
}

// Listeners valiutai ir sumai
document.getElementById("invoiceCurrency").addEventListener("change", autoConvert);
document.getElementById("invoiceAmount").addEventListener("input", autoConvert);

// Custom procentai
document.getElementById("brokerPercent").addEventListener("change", function () {
    const c = document.getElementById("brokerCustom");
    c.disabled = (this.value !== "custom");
    if (c.disabled) c.value = "";
    saveState();
});
document.getElementById("myPercent").addEventListener("change", function () {
    const c = document.getElementById("myCustom");
    c.disabled = (this.value !== "custom");
    if (c.disabled) c.value = "";
    saveState();
});

// Skaičiavimai
function calc() {
    const eur = parseFloat(document.getElementById("invoiceEUR").value);
    if (!eur) {
        alert("Blogi duomenys");
        return;
    }

    let b = document.getElementById("brokerPercent").value;
    if (b === "custom") {
        b = document.getElementById("brokerCustom").value.replace(",", ".");
        b = parseFloat(b) / 100;
    } else {
        b = parseFloat(b) / 100;
    }

    let m = document.getElementById("myPercent").value;
    if (m === "custom") {
        m = document.getElementById("myCustom").value.replace(",", ".");
        m = parseFloat(m) / 100;
    } else {
        m = parseFloat(m) / 100;
    }

    if (isNaN(b) || isNaN(m)) {
        alert("Įvesk procentą teisingu formatu: pvz. 0.30 arba 0,30");
        return;
    }

    const cost = eur * b;
    const client = eur * m;
    lastClientEUR = client;

    const resInvoice = document.getElementById("resInvoiceEUR");
    const resCost = document.getElementById("resCost");
    const resClient = document.getElementById("resClient");
    const resProfit = document.getElementById("resProfit");

    resInvoice.textContent = eur.toFixed(2) + " EUR";
    resCost.textContent = cost.toFixed(2) + " EUR";
    resClient.textContent = client.toFixed(2) + " EUR";

    const p = client - cost;
    resProfit.textContent = p.toFixed(2) + " EUR";
    resProfit.className = "value " + (p >= 0 ? "green" : "red") + " " + (p >= 0 ? "highlight-green" : "highlight-red");
    resClient.className = "value highlight";
    resCost.className = "value highlight";

    const profitPercentEl = document.getElementById("resProfitPercent");
    const marginDiffEl = document.getElementById("resMarginDiff");
    const vsAONEl = document.getElementById("resVsAON");
    const vsLegEl = document.getElementById("resVsLeg");

    if (cost > 0) {
        const pp = (p / cost) * 100;
        profitPercentEl.textContent = pp.toFixed(2) + " %";
    } else {
        profitPercentEl.textContent = "–";
    }

    const marginDiff = (m - b) * 100;
    marginDiffEl.textContent = marginDiff.toFixed(3) + " p.p.";

    const aon = eur * 0.0007;
    const leg = eur * 0.001;
    document.getElementById("resAON").textContent = aon.toFixed(2) + " EUR";
    document.getElementById("resLeg").textContent = leg.toFixed(2) + " EUR";

    vsAONEl.textContent = (client - aon).toFixed(2) + " EUR";
    vsLegEl.textContent = (client - leg).toFixed(2) + " EUR";

    document.getElementById("clientText").value = "";
    saveState();
}

// Pagalbinė valiutų funkcija klientui
async function getRate(from, to) {
    try {
        const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        const data = await res.json();
        return data && data.rates ? data.rates[to] : null;
    } catch {
        return null;
    }
}

// Tekstas klientui
async function generateClientText() {
    if (!lastClientEUR) {
        alert("Pirmiausia apskaičiuok kainą");
        return;
    }

    const eur = lastClientEUR;
    const showEUR = document.getElementById("showEUR").checked;
    const showExtra = document.getElementById("showExtra").checked;
    const showDate = document.getElementById("showDate").checked;
    const showInvoice = document.getElementById("showInvoice").checked;

    const amt = document.getElementById("invoiceAmount").value;
    const invCur = document.getElementById("invoiceCurrency").value;
    const lang = document.getElementById("lang").value;
    const extraCur = document.getElementById("extraCurrency").value;

    const today = new Date().toISOString().split("T")[0];

    let extraAmount = null;
    if (showExtra) {
        const rate = await getRate("EUR", extraCur);
        if (!rate) {
            alert("Nepavyko gauti valiutos kurso");
            return;
        }
        extraAmount = eur * rate;
    }

    let out = "";

    if (lang === "LT") {
        out += "Siunčiame preliminarią draudimo įmokos kainą pagal pateiktą invoice vertę.\n\n";
        if (showEUR) out += `• Draudimo kaina: ${eur.toFixed(2)} EUR\n`;
        if (showExtra && extraAmount != null) out += `• Suma ${extraCur} pagal šiandienos kursą: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if (showInvoice && amt) out += `• Invoice vertė: ${amt} ${invCur}\n`;
        if (showDate) out += `• Data: ${today}\n`;
        out += "\nPastaba:\nTai orientacinė įmoka, paskaičiuota pagal invoice vertę ir šiandienos valiutos kursą.\nGalutinė kaina gali skirtis priklausomai nuo poliso išrašymo dienos.\n";
    }

    if (lang === "EN") {
        out += "Please find below the preliminary insurance premium calculated based on the provided invoice value.\n\n";
        if (showEUR) out += `• Insurance price: ${eur.toFixed(2)} EUR\n`;
        if (showExtra && extraAmount != null) out += `• Amount in ${extraCur} at today’s rate: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if (showInvoice && amt) out += `• Invoice value: ${amt} ${invCur}\n`;
        if (showDate) out += `• Date: ${today}\n`;
        out += "\nNote:\nThis is an indicative premium based on the invoice value and current exchange rate.\nThe final amount may vary depending on the policy issuance date.\n";
    }

    if (lang === "RU") {
        out += "Ниже указана предварительная стоимость страховой премии, рассчитанная на основе суммы инвойса.\n\n";
        if (showEUR) out += `• Стоимость страховки: ${eur.toFixed(2)} EUR\n`;
        if (showExtra && extraAmount != null) out += `• Сумма в ${extraCur} по текущему курсу: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if (showInvoice && amt) out += `• Сумма инвойса: ${amt} ${invCur}\n`;
        if (showDate) out += `• Дата: ${today}\n`;
        out += "\nПримечание:\nЭто ориентировочная премия, рассчитанная по сумме инвойса и текущему курсу.\nФактическая стоимость может отличаться в зависимости от даты оформления полиса.\n";
    }

    document.getElementById("clientText").value = out;
    saveState();
}

// Copy
function copyClientText() {
    const t = document.getElementById("clientText");
    t.select();
    document.execCommand("copy");
}

// PDF
function generatePDF() {
    const mode = document.getElementById("pdfMode").value;
    document.body.classList.remove("pdf-calcs", "pdf-client", "pdf-both");
    document.body.classList.add("pdf-" + mode);
    window.print();
}

// Reset
function resetAll() {
    document.getElementById("invoiceCurrency").value = "USD";
    document.getElementById("invoiceAmount").value = "";
    document.getElementById("invoiceEUR").value = "";

    document.getElementById("brokerPercent").value = "0.07";
    document.getElementById("brokerCustom").value = "";
    document.getElementById("brokerCustom").disabled = true;

    document.getElementById("myPercent").value = "0.24";
    document.getElementById("myCustom").value = "";
    document.getElementById("myCustom").disabled = true;

    document.getElementById("resInvoiceEUR").textContent = "–";
    document.getElementById("resCost").textContent = "–";
    document.getElementById("resClient").textContent = "–";
    const p = document.getElementById("resProfit");
    p.textContent = "–";
    p.className = "value";

    document.getElementById("resProfitPercent").textContent = "–";
    document.getElementById("resMarginDiff").textContent = "–";
    document.getElementById("resVsAON").textContent = "–";
    document.getElementById("resVsLeg").textContent = "–";
    document.getElementById("resAON").textContent = "–";
    document.getElementById("resLeg").textContent = "–";

    document.getElementById("lang").value = "LT";
    document.getElementById("showEUR").checked = true;
    document.getElementById("showExtra").checked = true;
    document.getElementById("showDate").checked = true;
    document.getElementById("showInvoice").checked = true;
    document.getElementById("extraCurrency").value = "USD";
    document.getElementById("clientText").value = "";
    document.getElementById("pdfMode").value = "both";

    document.getElementById("ecbToday").textContent = "Šiandienos kursas: –";
    document.getElementById("ecbYesterday").textContent = "Vakar: –";
    document.getElementById("ecbChange").textContent = "Pokytis: –";

    lastClientEUR = null;
    saveState();
}

// paleidžiam startu
restoreState();
updateECBInfo();
