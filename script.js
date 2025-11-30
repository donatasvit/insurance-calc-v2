// === DARK MODE ==========================================
const darkToggle = document.getElementById("darkToggle");
darkToggle.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkmode", document.body.classList.contains("dark"));
};
if (localStorage.getItem("darkmode") === "true") {
    document.body.classList.add("dark");
}

// === ELEMENTAI ===========================================
const invoiceCur = document.getElementById("invoiceCurrency");
const invoiceAmt = document.getElementById("invoiceAmount");
const invoiceEUR = document.getElementById("invoiceEUR");

const brokerSel = document.getElementById("brokerPercent");
const brokerCustom = document.getElementById("brokerCustom");

const mySel = document.getElementById("myPercent");
const myCustom = document.getElementById("myCustom");

const rInvoice = document.getElementById("rInvoice");
const rCost = document.getElementById("rCost");
const rClient = document.getElementById("rClient");
const rProfit = document.getElementById("rProfit");
const rProfitP = document.getElementById("rProfitP");
const rDiff = document.getElementById("rDiff");
const rAON = document.getElementById("rAON");
const rLeg = document.getElementById("rLeg");
const rAON2 = document.getElementById("rAON2");
const rLeg2 = document.getElementById("rLeg2");

// ECB blokas
const ecbToday = document.getElementById("ecbToday");
const ecbYesterday = document.getElementById("ecbYesterday");
const ecbChange = document.getElementById("ecbChange");

// === GAUTI ECB KURSUS ===================================
async function loadECB() {
    try {
        let cur = invoiceCur.value;
        if (cur === "EUR") {
            ecbToday.textContent = "1.00";
            ecbYesterday.textContent = "1.00";
            ecbChange.textContent = "0%";
            return;
        }

        const today = await fetch(`https://api.frankfurter.app/latest?from=${cur}&to=EUR`);
        const tData = await today.json();
        const tRate = tData.rates.EUR;

        const y = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const yesterday = await fetch(`https://api.frankfurter.app/${y}?from=${cur}&to=EUR`);
        const yData = await yesterday.json();
        const yRate = yData.rates ? yData.rates.EUR : tRate;

        ecbToday.textContent = tRate.toFixed(4);
        ecbYesterday.textContent = yRate.toFixed(4);

        const change = ((tRate - yRate) / yRate) * 100;
        ecbChange.textContent = change.toFixed(2) + "%";

    } catch (e) {
        ecbToday.textContent = "–";
        ecbYesterday.textContent = "–";
        ecbChange.textContent = "–";
    }
}

// === AUTO KONVERSIJA ======================================
async function convertToEUR() {
    let amt = parseFloat(invoiceAmt.value);
    if (!amt) {
        invoiceEUR.value = "";
        return;
    }
    let cur = invoiceCur.value;

    if (cur === "EUR") {
        invoiceEUR.value = amt.toFixed(2);
        return;
    }

    try {
        const r = await fetch(`https://api.frankfurter.app/latest?from=${cur}&to=EUR`);
        const d = await r.json();
        const rate = d.rates.EUR;

        invoiceEUR.value = (amt * rate).toFixed(4);
        loadECB();
    } catch (e) {
        invoiceEUR.value = "";
    }
}

invoiceAmt.oninput = convertToEUR;
invoiceCur.onchange = convertToEUR;

// === PROCENTŲ AKTYVATORIAI ================================
brokerSel.onchange = () => {
    brokerCustom.disabled = brokerSel.value !== "custom";
    if (brokerCustom.disabled) brokerCustom.value = "";
};
mySel.onchange = () => {
    myCustom.disabled = mySel.value !== "custom";
    if (myCustom.disabled) myCustom.value = "";
};

// === SKAIČIAVIMAS =========================================
document.getElementById("calcBtn").onclick = () => {
    let eur = parseFloat(invoiceEUR.value);
    if (!eur) {
        alert("Neteisingi duomenys.");
        return;
    }

    // brokerio %
    let b = brokerSel.value === "custom"
        ? parseFloat(brokerCustom.value.replace(",", ".")) / 100
        : parseFloat(brokerSel.value) / 100;

    // tavo %
    let m = mySel.value === "custom"
        ? parseFloat(myCustom.value.replace(",", ".")) / 100
        : parseFloat(mySel.value) / 100;

    if (isNaN(b) || isNaN(m)) {
        alert("Procentai įvesti blogu formatu.");
        return;
    }

    const cost = eur * b;
    const client = eur * m;
    const profit = client - cost;

    rInvoice.textContent = eur.toFixed(2) + " EUR";
    rCost.textContent = cost.toFixed(2) + " EUR";
    rClient.textContent = client.toFixed(2) + " EUR";
    rProfit.textContent = profit.toFixed(2) + " EUR";

    rProfit.style.color = profit >= 0 ? "#19ff62" : "#ff4444";

    // pelno %
    rProfitP.textContent = ((profit / cost) * 100).toFixed(2) + "%";

    // skirtingumai
    rDiff.textContent = ((m - b) * 100).toFixed(3) + "%";

    // AON vs tavo
    rAON.textContent = (eur * 0.0007).toFixed(2) + " EUR";
    rLeg.textContent = (eur * 0.001).toFixed(2) + " EUR";

    // tik kainos
    rAON2.textContent = (eur * 0.0007).toFixed(2) + " EUR";
    rLeg2.textContent = (eur * 0.001).toFixed(2) + " EUR";

    lastClientEUR = client;
};

// === KLIENTO TEKSTAS ======================================
let lastClientEUR = null;

document.getElementById("genBtn").onclick = async () => {
    if (!lastClientEUR) {
        alert("Pirmiausia paskaičiuok!");
        return;
    }

    const lang = document.getElementById("lang").value;
    const showEUR = document.getElementById("showEUR").checked;
    const showExtra = document.getElementById("showExtra").checked;
    const showDate = document.getElementById("showDate").checked;
    const showInvoice = document.getElementById("showInvoice").checked;

    const amt = invoiceAmt.value;
    const cur = invoiceCur.value;
    const extraCur = document.getElementById("extraCurrency").value;

    let txt = "";

    const today = new Date().toISOString().split("T")[0];

    // valiuta papildoma
    let extra = "";
    if (showExtra) {
        const r = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${extraCur}`);
        const d = await r.json();
        extra = (lastClientEUR * d.rates[extraCur]).toFixed(2);
    }

    if (lang === "LT") {
        txt += "Siunčiame preliminarią draudimo įmokos kainą pagal pateiktą invoice vertę.\n\n";
        if (showEUR) txt += `• Draudimo kaina: ${lastClientEUR.toFixed(2)} EUR\n`;
        if (showExtra) txt += `• Suma ${extraCur}: ${extra} ${extraCur}\n`;
        if (showInvoice) txt += `• Invoice vertė: ${amt} ${cur}\n`;
        if (showDate) txt += `• Data: ${today}\n`;
    }

    document.getElementById("clientText").value = txt;
};

// kopijavimas
document.getElementById("copyBtn").onclick = () => {
    const t = document.getElementById("clientText");
    t.select();
    document.execCommand("copy");
};

// reset
document.getElementById("resetBtn").onclick = () => location.reload();
