/* ===============================================
   DARK MODE
================================================= */
function toggleDark() {
    document.body.classList.toggle("dark");
    localStorage.setItem("dark", document.body.classList.contains("dark"));
}

if (localStorage.getItem("dark") === "true") {
    document.body.classList.add("dark");
}

/* ===============================================
   GLOBAL
================================================= */
let lastClientEUR = null;

/* ===============================================
   AUTOMATINIS ECB KONVERTAVIMAS
================================================= */
async function autoConvert() {
    const cur = document.getElementById("invoiceCurrency").value;
    const amt = parseFloat(document.getElementById("invoiceAmount").value);
    const out = document.getElementById("invoiceEUR");

    if (!amt) {
        out.value = "";
        return;
    }

    if (cur === "EUR") {
        out.value = amt.toFixed(2);
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
    } catch (e) {
        out.value = "";
    }
}

document.getElementById("invoiceCurrency").addEventListener("change", autoConvert);
document.getElementById("invoiceAmount").addEventListener("input", autoConvert);

/* ===============================================
   PROCESŲ AKTYVAVIMAS (CUSTOM PROCENTAI)
================================================= */
document.getElementById("brokerPercent").addEventListener("change", function () {
    const c = document.getElementById("brokerCustom");
    c.disabled = (this.value !== "custom");
    if (c.disabled) c.value = "";
});

document.getElementById("myPercent").addEventListener("change", function () {
    const c = document.getElementById("myCustom");
    c.disabled = (this.value !== "custom");
    if (c.disabled) c.value = "";
});

/* ===============================================
   SKAIČIAVIMAI
================================================= */
function calc() {
    const eur = parseFloat(document.getElementById("invoiceEUR").value);
    if (!eur) {
        alert("Blogi duomenys");
        return;
    }

    /* Brokerio % */
    let b = document.getElementById("brokerPercent").value;
    if (b === "custom") {
        b = document.getElementById("brokerCustom").value.replace(",", ".");
        b = parseFloat(b) / 100;
    } else {
        b = parseFloat(b) / 100;
    }

    /* Tavo % */
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

    /* Rezultatai */
    document.getElementById("resInvoiceEUR").textContent = eur.toFixed(2) + " EUR";
    document.getElementById("resCost").textContent = cost.toFixed(2) + " EUR";
    document.getElementById("resClient").textContent = client.toFixed(2) + " EUR";

    const p = client - cost;
    const pe = document.getElementById("resProfit");
    pe.textContent = p.toFixed(2) + " EUR";
    pe.className = "value " + (p >= 0 ? "green" : "red");

    /* AON / LEGATOR */
    document.getElementById("resAON").textContent = (eur * 0.0007).toFixed(2) + " EUR";
    document.getElementById("resLeg").textContent = (eur * 0.001).toFixed(2) + " EUR";

    /* Auto išvalyti klientui tekstą */
    document.getElementById("clientText").value = "";
}

/* ===============================================
   VALIUTOS KURSO FUNKCIJA
================================================= */
async function getRate(from, to) {
    try {
        const r = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        const data = await r.json();
        return data && data.rates ? data.rates[to] : null;
    } catch {
        return null;
    }
}

/* ===============================================
   TEKSTAS KLIENTUI (LT/EN/RU)
================================================= */
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

    /* Papildoma valiuta */
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

    /* Lietuvių */
    if (lang === "LT") {
        out += "Siunčiame preliminarią draudimo įmokos kainą pagal pateiktą invoice vertę.\n\n";
        if (showEUR) out += `• Draudimo kaina: ${eur.toFixed(2)} EUR\n`;
        if (showExtra && extraAmount != null) out += `• Suma ${extraCur} pagal šiandienos kursą: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if (showInvoice && amt) out += `• Invoice vertė: ${amt} ${invCur}\n`;
        if (showDate) out += `• Data: ${today}\n`;
        out += "\nPastaba:\nTai orientacinė įmoka, paskaičiuota pagal invoice vertę ir šiandienos valiutos kursą.\nGalutinė kaina gali skirtis priklausomai nuo poliso išrašymo dienos.\n";
    }

    /* English */
    if (lang === "EN") {
        out += "Please find below the preliminary insurance premium calculated based on the provided invoice value.\n\n";
        if (showEUR) out += `• Insurance price: ${eur.toFixed(2)} EUR\n`;
        if (showExtra && extraAmount != null) out += `• Amount in ${extraCur} at today’s rate: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if (showInvoice && amt) out += `• Invoice value: ${amt} ${invCur}\n`;
        if (showDate) out += `• Date: ${today}\n`;
        out += "\nNote:\nThis is an indicative premium based on the invoice value and current exchange rate.\nThe final amount may vary depending on the policy issuance date.\n";
    }

    /* Russian */
    if (lang === "RU") {
        out += "Ниже указана предварительная стоимость страховой премии, рассчитанная на основе суммы инвойса.\n\n";
        if (showEUR) out += `• Стоимость страховки: ${eur.toFixed(2)} EUR\n`;
        if (showExtra && extraAmount != null) out += `• Сумма в ${extraCur} по текущему курсу: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if (showInvoice && amt) out += `• Сумма инвойса: ${amt} ${invCur}\n`;
        if (showDate) out += `• Дата: ${today}\n`;
        out += "\nПримечание:\nЭто ориентировочная премия, рассчитанная по сумме инвойса и текущему курсу.\nФактическая стоимость может отличаться в зависимости от даты оформления полиса.\n";
    }

    document.getElementById("clientText").value = out;
}

/* ===============================================
   COPY
================================================= */
function copyClientText() {
    const t = document.getElementById("clientText");
    t.select();
    document.execCommand("copy");
}

/* ===============================================
   PDF MODES
================================================= */
function generatePDF() {
    const mode = document.getElementById("pdfMode").value;
    document.body.classList.remove("pdf-calcs", "pdf-client", "pdf-both");
    document.body.classList.add("pdf-" + mode);
    window.print();
}

/* ===============================================
   RESET ALL
================================================= */
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

    lastClientEUR = null;
}
