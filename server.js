const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Aktif görüşmeleri hafızada tut (arayan numara → konuşma geçmişi)
const conversations = {};

// Türkçe haber çek
async function getLatestNews() {
  try {
    const res = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [
            {
              role: "user",
              content:
                "Bugünkü Türkiye ve dünya gündeminden en önemli 3-4 haberi kısaca Türkçe özetle. Her haber 1-2 cümle olsun.",
            },
          ],
        }),
      }
    );
    const data = await res.json();
    const textBlock = data.content.find((b) => b.type === "text");
    return textBlock ? textBlock.text : "Şu an haberlere ulaşamıyorum.";
  } catch (e) {
    return "Haber servisi geçici olarak kullanılamıyor.";
  }
}

// Claude ile sohbet
async function chatWithClaude(arayanNo, userMessage) {
  if (!conversations[arayanNo]) {
    conversations[arayanNo] = [];
  }

  conversations[arayanNo].push({ role: "user", content: userMessage });

  // Son 10 mesajı tut (hafıza sınırı)
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
        system: `Sen telefonda bir insanla konuşan sıcak ve anlayışlı bir yapay zeka asistansın. 
Adın "Asistan". Kullanıcı cezaevinde ve dış dünyayla bağlantısı yok. 
Görevin: Haberler, gündem, tarih, bilim, hikayeler, sohbet konularında yardım et.
Kuralllar:
- Her yanıt kısa ve net olsun (2-4 cümle). Telefon görüşmesi olduğunu unutma.
- Sıcak, samimi ve sabırlı ol.
- Eğer haber isterse web araması yap.
- Türkçe konuş.
- Asla siyasi görüş bildirme.`,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: conversations[arayanNo],
      }),
    });

    const data = await res.json();
    const textBlock = data.content.find((b) => b.type === "text");
    const reply = textBlock
      ? textBlock.text
      : "Anlayamadım, tekrar söyler misiniz?";

    conversations[arayanNo].push({ role: "assistant", content: reply });
    return reply;
  } catch (e) {
    console.error("Claude API hatası:", e);
    return "Şu an bağlantı sorunu var, biraz sonra tekrar deneyin.";
  }
}

// Netgsm Custom API webhook endpoint
// Netgsm bu URL'e POST atar, arayan_no ve tuslanan (konuşulan metin) gönderir
app.post("/webhook", async (req, res) => {
  const arayanNo = req.body.arayan_no || "bilinmiyor";
  const gelen = req.body.tuslanan || req.body.metin || "";

  console.log(`📞 Arama: ${arayanNo} | Mesaj: ${gelen}`);

  let yanitMetni;

  // İlk kez arıyorsa hoş geldin mesajı
  if (!gelen || gelen.trim() === "" || gelen === "START") {
    conversations[arayanNo] = []; // Yeni görüşme başlat
    yanitMetni =
      "Merhaba! Ben yapay zeka asistanınım. Haberler, gündem veya sohbet için burdayım. Ne öğrenmek istersiniz? Lütfen konuşun.";
  } else if (
    gelen.toLowerCase().includes("haber") ||
    gelen.toLowerCase().includes("gündem") ||
    gelen.toLowerCase().includes("bugün ne var")
  ) {
    // Haber isteği
    yanitMetni = await getLatestNews();
    conversations[arayanNo] = conversations[arayanNo] || [];
    conversations[arayanNo].push({ role: "assistant", content: yanitMetni });
  } else {
    // Normal sohbet
    yanitMetni = await chatWithClaude(arayanNo, gelen);
  }

  // Netgsm TTS formatında yanıt döndür
  // Netgsm bu JSON'u alır ve TTS robotu ile arayıcıya sesli okur
  res.json({
    text: yanitMetni,
    language: "tr-TR",
  });
});

// Görüşme bitti (Netgsm hangup eventi)
app.post("/hangup", (req, res) => {
  const arayanNo = req.body.arayan_no;
  if (arayanNo && conversations[arayanNo]) {
    delete conversations[arayanNo];
    console.log(`📵 Görüşme bitti: ${arayanNo}`);
  }
  res.json({ status: "ok" });
});

// Sağlık kontrolü
app.get("/", (req, res) => {
  res.send("AI Asistan çalışıyor ✓");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu ${PORT} portunda çalışıyor`);
});
