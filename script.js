let lastClientEUR = null;

/* Dark mode */
document.getElementById("darkModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

/* ECB auto conversion */
async function updateRates(){
    const cur = document.getElementById("invoiceCurrency").value;
    const amt = parseFloat(document.getElementById("invoiceAmount").value);
    const out = document.getElementById("invoiceEUR");

    if(!amt){ out.value=""; return; }
    if(cur==="EUR"){ out.value = amt.toFixed(2); return; }

    try{
        const r = await fetch(`https://api.frankfurter.app/latest?from=${cur}&to=EUR`);
        const d = await r.json();
        const rate = d.rates.EUR;

        out.value = (amt * rate).toFixed(4);

        document.getElementById("ecbToday").textContent = `Šiandienos kursas: 1 ${cur} = ${rate.toFixed(4)} EUR`;

        const y = await fetch(`https://api.frankfurter.app/${d.date}?from=${cur}&to=EUR`);
        const yd = await y.json();
        const rateY = yd.rates.EUR;

        document.getElementById("ecbYesterday").textContent = `Vakar: 1 ${cur} = ${rateY.toFixed(4)} EUR`;

        const diff = ((rate - rateY) / rateY * 100).toFixed(2);
        document.getElementById("ecbChange").textContent = `Pokytis: ${diff}%`;

    }catch(e){
        console.log("Nepavyko gauti ECB");
    }
}

document.getElementById("invoiceCurrency").addEventListener("change", updateRates);
document.getElementById("invoiceAmount").addEventListener("input", updateRates);

/* Percent fields */
document.getElementById("brokerPercent").addEventListener("change", function(){
    const c = document.getElementById("brokerCustom");
    c.disabled = (this.value !== "custom");
    if(c.disabled) c.value="";
});
document.getElementById("myPercent").addEventListener("change", function(){
    const c = document.getElementById("myCustom");
    c.disabled = (this.value !== "custom");
    if(c.disabled) c.value="";
});

/* Calculate */
document.getElementById("calcBtn").addEventListener("click", () => {

    const eur = parseFloat(document.getElementById("invoiceEUR").value);
    if(!eur){ alert("Blogi duomenys"); return; }

    let b = document.getElementById("brokerPercent").value;
    if(b==="custom"){
        b = parseFloat(document.getElementById("brokerCustom").value.replace(",", "."))/100;
    } else b = parseFloat(b)/100;

    let m = document.getElementById("myPercent").value;
    if(m==="custom"){
        m = parseFloat(document.getElementById("myCustom").value.replace(",", "."))/100;
    } else m = parseFloat(m)/100;

    const cost = eur * b;
    const client = eur * m;

    lastClientEUR = client;

    document.getElementById("resInvoiceEUR").textContent = eur.toFixed(2) + " EUR";
    document.getElementById("resCost").textContent = cost.toFixed(2) + " EUR";
    document.getElementById("resClient").textContent = client.toFixed(2) + " EUR";

    const p = client - cost;
    document.getElementById("resProfit").textContent = p.toFixed(2) + " EUR";

    document.getElementById("resAON").textContent = (eur * 0.0007).toFixed(2) + " EUR";
    document.getElementById("resLeg").textContent = (eur * 0.001).toFixed(2) + " EUR";
});

/* Generate client text */
document.getElementById("genBtn").addEventListener("click", async () => {

    if(!lastClientEUR){
        alert("Pirmiausia apskaičiuok kainą");
        return;
    }

    const eur = lastClientEUR;
    const date = new Date().toISOString().split("T")[0];
    const lang = document.getElementById("lang").value;
    const showEUR = document.getElementById("showEUR").checked;
    const showExtra = document.getElementById("showExtra").checked;
    const showDate = document.getElementById("showDate").checked;
    const showInvoice = document.getElementById("showInvoice").checked;
    const extra = document.getElementById("extraCurrency").value;
    const amt = document.getElementById("invoiceAmount").value;
    const cur = document.getElementById("invoiceCurrency").value;

    let extraAmount = null;
    if(showExtra){
        const r = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${extra}`);
        const d = await r.json();
        extraAmount = eur * d.rates[extra];
    }

    let out="";

    if(lang==="LT"){
        out += "Siunčiame preliminarią draudimo įmokos kainą pagal pateiktą invoice vertę.\n\n";
        if(showEUR) out += `• Draudimo kaina: ${eur.toFixed(2)} EUR\n`;
        if(showExtra) out += `• Suma ${extra}: ${extraAmount.toFixed(2)} ${extra}\n`;
        if(showInvoice) out += `• Invoice: ${amt} ${cur}\n`;
        if(showDate) out += `• Data: ${date}\n`;
    }

    if(lang==="EN"){
        out += "Please find below the preliminary insurance premium.\n\n";
        if(showEUR) out += `• Price: ${eur.toFixed(2)} EUR\n`;
        if(showExtra) out += `• ${extra} value: ${extraAmount.toFixed(2)} ${extra}\n`;
        if(showInvoice) out += `• Invoice: ${amt} ${cur}\n`;
        if(showDate) out += `• Date: ${date}\n`;
    }

    if(lang==="RU"){
        out += "Предварительная страховая премия:\n\n";
        if(showEUR) out += `• Цена: ${eur.toFixed(2)} EUR\n`;
        if(showExtra) out += `• ${extra}: ${extraAmount.toFixed(2)} ${extra}\n`;
        if(showInvoice) out += `• Инвойс: ${amt} ${cur}\n`;
        if(showDate) out += `• Дата: ${date}\n`;
    }

    document.getElementById("clientText").value = out;
});

/* Copy */
document.getElementById("copyBtn").addEventListener("click", () => {
    const t = document.getElementById("clientText");
    t.select();
    document.execCommand("copy");
});
