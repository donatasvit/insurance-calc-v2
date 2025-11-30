// Patogūs trumpiniai
const invoiceCurrency = document.getElementById("invoiceCurrency");
const invoiceAmount   = document.getElementById("invoiceAmount");
const invoiceEUR      = document.getElementById("invoiceEUR");

const ecbToday     = document.getElementById("ecbToday");
const ecbYesterday = document.getElementById("ecbYesterday");
const ecbChange    = document.getElementById("ecbChange");

const brokerPercent = document.getElementById("brokerPercent");
const brokerCustom  = document.getElementById("brokerCustom");
const myPercent     = document.getElementById("myPercent");
const myCustom      = document.getElementById("myCustom");

const resInvoiceEUR = document.getElementById("resInvoiceEUR");
const resCost       = document.getElementById("resCost");
const resClient     = document.getElementById("resClient");
const resProfit     = document.getElementById("resProfit");
const resAON        = document.getElementById("resAON");
const resLeg        = document.getElementById("resLeg");

const lang          = document.getElementById("lang");
const showEUR       = document.getElementById("showEUR");
const showExtra     = document.getElementById("showExtra");
const showDate      = document.getElementById("showDate");
const showInvoice   = document.getElementById("showInvoice");
const extraCurrency = document.getElementById("extraCurrency");
const clientText    = document.getElementById("clientText");

let lastClientEUR = null;

// ===== Dark mode (jei nori – galima pratęsti su localStorage) =====
document.getElementById("darkToggle").addEventListener("click", () => {
    document.body.classList.toggle("light"); // jei kada nors norėsi šviesaus
});

// ===== Pagalbinis: gauti vakar dienos datą (YYYY-MM-DD) =====
function getYesterdayISO(){
    const d = new Date();
    d.setDate(d.getDate()-1);
    return d.toISOString().split("T")[0];
}

// ===== Automatinė konversija į EUR + ECB blokas =====
async function updateEURandECB(){
    const cur = invoiceCurrency.value;
    const amt = parseFloat(invoiceAmount.value || "0");
    if(!amt){
        invoiceEUR.value = "";
        ecbToday.textContent     = "Šiandienos kursas: –";
        ecbYesterday.textContent = "Vakar: –";
        ecbChange.textContent    = "Pokytis: –";
        return;
    }

    if(cur==="EUR"){
        invoiceEUR.value = amt.toFixed(2);
        ecbToday.textContent     = "Šiandienos kursas: 1 EUR = 1.0000 EUR";
        ecbYesterday.textContent = "Vakar: –";
        ecbChange.textContent    = "Pokytis: –";
        return;
    }

    try{
        // šiandien
        const todayRes = await fetch(`https://api.frankfurter.app/latest?from=${cur}&to=EUR`);
        const todayData = await todayRes.json();
        const todayRate = todayData.rates.EUR;

        // vakar
        const yDate = getYesterdayISO();
        const yRes = await fetch(`https://api.frankfurter.app/${yDate}?from=${cur}&to=EUR`);
        const yData = await yRes.json();
        const yRate = yData.rates ? yData.rates.EUR : null;

        invoiceEUR.value = (amt * todayRate).toFixed(4);

        ecbToday.textContent = `Šiandienos kursas: 1 ${cur} = ${todayRate.toFixed(4)} EUR`;
        if(yRate){
            ecbYesterday.textContent = `Vakar: 1 ${cur} = ${yRate.toFixed(4)} EUR`;
            const diff = ((todayRate - yRate)/yRate)*100;
            const sign = diff>=0 ? "+" : "";
            ecbChange.textContent = `Pokytis: ${sign}${diff.toFixed(2)} %`;
        }else{
            ecbYesterday.textContent = "Vakar: –";
            ecbChange.textContent    = "Pokytis: –";
        }
    }catch(e){
        invoiceEUR.value="";
        ecbToday.textContent     = "Šiandienos kursas: nepavyko gauti";
        ecbYesterday.textContent = "Vakar: –";
        ecbChange.textContent    = "Pokytis: –";
    }
}

invoiceCurrency.addEventListener("change", updateEURandECB);
invoiceAmount.addEventListener("input", updateEURandECB);

// ===== Procentų įjungimas / išjungimas =====
brokerPercent.addEventListener("change", () => {
    brokerCustom.disabled = brokerPercent.value !== "custom";
    if(brokerCustom.disabled) brokerCustom.value="";
});
myPercent.addEventListener("change", () => {
    myCustom.disabled = myPercent.value !== "custom";
    if(myCustom.disabled) myCustom.value="";
});

// ===== Skaičiavimai =====
document.getElementById("calcBtn").addEventListener("click", () => {
    const eur = parseFloat(invoiceEUR.value || "0");
    if(!eur){
        alert("Pirmiausia turi būti EUR suma (įvesk invoice ir palauk konversijos).");
        return;
    }

    let b = brokerPercent.value;
    if(b==="custom"){
        b = brokerCustom.value.replace(",", "."); // 0,09 -> 0.09
    }
    b = parseFloat(b);
    if(isNaN(b)){ alert("Brokerio % blogas formatas."); return; }
    b = b/100; // 0.07 -> 0.0007

    let m = myPercent.value;
    if(m==="custom"){
        m = myCustom.value.replace(",", ".");
    }
    m = parseFloat(m);
    if(isNaN(m)){ alert("Tavo % blogas formatas."); return; }
    m = m/100;

    const cost   = eur * b;
    const client = eur * m;
    const profit = client - cost;

    lastClientEUR = client;

    resInvoiceEUR.textContent = eur.toFixed(2)+" EUR";
    resCost.textContent       = cost.toFixed(2)+" EUR";
    resClient.textContent     = client.toFixed(2)+" EUR";
    resProfit.textContent     = profit.toFixed(2)+" EUR";

    // AON & Legator
    resAON.textContent = (eur * 0.0007).toFixed(2) + " EUR";
    resLeg.textContent = (eur * 0.001 ).toFixed(2) + " EUR";
});

// ===== Pagalbinė: gauti valiutos kursą iš EUR į kitą =====
async function rateFromEUR(to){
    if(to==="EUR") return 1;
    const res = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${to}`);
    const data = await res.json();
    return data.rates[to];
}

// ===== Tekstas klientui =====
document.getElementById("genBtn").addEventListener("click", async () => {
    if(!lastClientEUR){
        alert("Pirmiausia paskaičiuok draudimo kainą.");
        return;
    }

    const invAmt = invoiceAmount.value;
    const invCur = invoiceCurrency.value;

    const extraCur = extraCurrency.value;
    let extraAmount = null;
    if(showExtra.checked){
        try{
            const r = await rateFromEUR(extraCur);
            extraAmount = lastClientEUR * r;
        }catch(e){
            extraAmount = null;
        }
    }

    const today = new Date().toISOString().split("T")[0];

    let text = "";

    if(lang.value==="LT"){
        text += "Siunčiame preliminarią draudimo įmokos kainą pagal pateiktą invoice vertę.\n\n";
        if(showEUR.checked)   text += `• Draudimo kaina: ${lastClientEUR.toFixed(2)} EUR\n`;
        if(showExtra.checked && extraAmount!==null)
            text += `• Suma ${extraCur} pagal šiandienos kursą: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if(showInvoice.checked)
            text += `• Invoice: ${invAmt} ${invCur}\n`;
        if(showDate.checked)
            text += `• Data: ${today}\n`;
        text += "\nPastaba: tai orientacinė įmoka, galutinė kaina gali keistis pagal poliso sąlygas ir valiutų kursą poliso išrašymo dieną.\n";
    }
    else if(lang.value==="EN"){
        text += "Please find below the preliminary insurance premium based on the provided invoice value.\n\n";
        if(showEUR.checked)   text += `• Insurance premium: ${lastClientEUR.toFixed(2)} EUR\n`;
        if(showExtra.checked && extraAmount!==null)
            text += `• Amount in ${extraCur} at today’s rate: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if(showInvoice.checked)
            text += `• Invoice value: ${invAmt} ${invCur}\n`;
        if(showDate.checked)
            text += `• Date: ${today}\n`;
        text += "\nNote: this is an indicative premium. The final amount may vary depending on the policy issuance date and applicable terms.\n";
    }
    else{ // RU
        text += "Ниже указана предварительная стоимость страховой премии, рассчитанная по сумме инвойса.\n\n";
        if(showEUR.checked)   text += `• Стоимость страховки: ${lastClientEUR.toFixed(2)} EUR\n`;
        if(showExtra.checked && extraAmount!==null)
            text += `• Сумма в ${extraCur} по сегодняшнему курсу: ${extraAmount.toFixed(2)} ${extraCur}\n`;
        if(showInvoice.checked)
            text += `• Сумма инвойса: ${invAmt} ${invCur}\n`;
        if(showDate.checked)
            text += `• Дата: ${today}\n`;
        text += "\nПримечание: это ориентировочная премия. Финальная сумма может отличаться в зависимости от даты оформления полиса и условий.\n";
    }

    clientText.value = text;
});

// ===== Kopijavimas =====
document.getElementById("copyBtn").addEventListener("click", () => {
    clientText.select();
    document.execCommand("copy");
});

// ===== Naujas skaičiavimas =====
document.getElementById("resetBtn").addEventListener("click", () => {
    invoiceAmount.value="";
    invoiceEUR.value="";
    ecbToday.textContent     = "Šiandienos kursas: –";
    ecbYesterday.textContent = "Vakar: –";
    ecbChange.textContent    = "Pokytis: –";
    resInvoiceEUR.textContent = "–";
    resCost.textContent       = "–";
    resClient.textContent     = "–";
    resProfit.textContent     = "–";
    resAON.textContent        = "–";
    resLeg.textContent        = "–";
    clientText.value          = "";
    lastClientEUR = null;
});
