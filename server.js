const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Aktif görüşmeleri hafızada tut
const conversations = {};

// Claude ile sohbet
async function chatWithClaude(arayanNo, userMessage) {
  if (!conversations[arayanNo]) {
    conversations[arayanNo] = [];
  }

  conversations[arayanNo].push({ role: "user", content: userMessage });

  if (conversations[arayanNo].length > 20) {
    conversations[arayanNo] = conversations[arayanNo].slice(-20);
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: `Sen telefonda konuşan sıcak bir yapay zeka asistansın. Adın "Asistan". 
Kullanıcı cezaevinde, dış dünyayla bağlantısı yok. 
Haberler, gündem, tarih, bilim, hikayeler hakkında yardım et.
Kurallar:
- Kısa ve net cevaplar ver, maksimum 3-4 cümle. Telefon görüşmesi bu.
- Sıcak ve sabırlı ol.
- Türkçe konuş.
- Siyasi görüş bildirme.`,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: conversations[arayanNo],
      }),
    });

    const data = await res.json();
    const textBlock = data.content.find((b) => b.type === "text");
    const reply = textBlock ? textBlock.text : "Anlayamadım, tekrar söyler misiniz?";

    conversations[arayanNo].push({ role: "assistant", content: reply });
    return reply;
  } catch (e) {
    console.error("Claude API hatası:", e);
    return "Şu an bağlantı sorunu var, biraz sonra tekrar deneyin.";
  }
}

// Twilio webhook - arama geldiğinde
app.post("/twilio", async (req, res) => {
  const arayanNo = req.body.From || "bilinmiyor";
  console.log(`📞 Yeni arama: ${arayanNo}`);

  conversations[arayanNo] = [];

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="tr-TR" voice="Polly.Filiz">Merhaba! Ben yapay zeka asistanınım. Haberler, gündem veya sohbet için burdayım. Konuşmaya başlayabilirsiniz.</Say>
  <Gather input="speech" language="tr-TR" action="/twilio/cevap" method="POST" speechTimeout="3" timeout="10">
    <Say language="tr-TR" voice="Polly.Filiz">Sizi dinliyorum.</Say>
  </Gather>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

// Twilio webhook - kullanıcı konuştu
app.post("/twilio/cevap", async (req, res) => {
  const arayanNo = req.body.From || "bilinmiyor";
  const speechResult = req.body.SpeechResult || "";

  console.log(`💬 ${arayanNo}: ${speechResult}`);

  let yanitMetni;
  if (!speechResult || speechResult.trim() === "") {
    yanitMetni = "Sizi duyamadım, tekrar söyler misiniz?";
  } else {
    yanitMetni = await chatWithClaude(arayanNo, speechResult);
  }

  console.log(`🤖 Yanıt: ${yanitMetni}`);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="tr-TR" voice="Polly.Filiz">${yanitMetni.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</Say>
  <Gather input="speech" language="tr-TR" action="/twilio/cevap" method="POST" speechTimeout="3" timeout="15">
    <Say language="tr-TR" voice="Polly.Filiz">Başka bir şey sormak ister misiniz?</Say>
  </Gather>
  <Say language="tr-TR" voice="Polly.Filiz">Görüşmek üzere, iyi günler!</Say>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

// Görüşme bitti
app.post("/twilio/hangup", (req, res) => {
  const arayanNo = req.body.From;
  if (arayanNo && conversations[arayanNo]) {
    delete conversations[arayanNo];
    console.log(`📵 Görüşme bitti: ${arayanNo}`);
  }
  res.sendStatus(200);
});

// Sağlık kontrolü
app.get("/", (req, res) => {
  res.send("AI Asistan çalışıyor ✓");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu ${PORT} portunda çalışıyor`);
});
