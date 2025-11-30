let lastClientEUR = null;

// Dark mode
document.getElementById("darkToggle").onclick = () =>
    document.body.classList.toggle("dark");

// ECB conversion
async function convertToEUR(){
    const cur = invoiceCurrency.value;
    const amt = parseFloat(invoiceAmount.value);
    if(!amt){ invoiceEUR.value=""; return; }

    if(cur==="EUR"){
        invoiceEUR.value = amt.toFixed(2);
        return;
    }

    const r = await fetch(`https://api.frankfurter.app/latest?from=${cur}&to=EUR`);
    const d = await r.json();
    const rate = d.rates.EUR;

    invoiceEUR.value = (amt * rate).toFixed(4);

    // ECB box
    ecbToday.textContent = `Šiandienos: 1 ${cur} = ${rate.toFixed(4)} EUR`;
    ecbYesterday.textContent = `Vakar: –`;
    ecbChange.textContent = `Pokytis: –`;
}

invoiceCurrency.onchange = convertToEUR;
invoiceAmount.oninput = convertToEUR;

// Percent logic
brokerPercent.onchange = () => {
    brokerCustom.disabled = brokerPercent.value !== "custom";
    if(brokerCustom.disabled) brokerCustom.value="";
};
myPercent.onchange = () => {
    myCustom.disabled = myPercent.value !== "custom";
    if(myCustom.disabled) myCustom.value="";
};

// Calculate
calcBtn.onclick = () => {
    const eur = parseFloat(invoiceEUR.value);
    if(!eur){ alert("Blogi duomenys"); return; }

    let b = brokerPercent.value==="custom"
        ? parseFloat(brokerCustom.value.replace(",", "."))/100
        : parseFloat(brokerPercent.value)/100;

    let m = myPercent.value==="custom"
        ? parseFloat(myCustom.value.replace(",", "."))/100
        : parseFloat(myPercent.value)/100;

    const cost = eur * b;
    const client = eur * m;
    const profit = client - cost;

    lastClientEUR = client;

    resInvoiceEUR.textContent = eur.toFixed(2)+" EUR";
    resCost.textContent = cost.toFixed(2)+" EUR";
    resClient.textContent = client.toFixed(2)+" EUR";
    resProfit.textContent = profit.toFixed(2)+" EUR";

    resAON.textContent = (eur * 0.0007).toFixed(2) + " EUR";
    resLeg.textContent = (eur * 0.001).toFixed(2) + " EUR";
};

// Client text
genBtn.onclick = async () => {
    if(!lastClientEUR){
        alert("Pirmiausia paskaičiuok");
        return;
    }

    const amt = invoiceAmount.value;
    const cur = invoiceCurrency.value;
    const lang = lang.value;

    let txt = "";

    if(lang==="LT"){
        txt += "Preliminari įmoka:\n\n";
        txt += `• Kaina: ${lastClientEUR.toFixed(2)} EUR\n`;
        txt += `• Invoice: ${amt} ${cur}\n`;
    }

    clientText.value = txt;
};

// Copy
copyBtn.onclick = () => {
    clientText.select();
    document.execCommand("copy");
};

// Reset
resetBtn.onclick = () => location.reload();
