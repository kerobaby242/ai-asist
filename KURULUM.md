# 📞 AI Telefon Asistanı — Kurulum Rehberi

## Genel Bakış
Kuzenin Netgsm numarasını arar → AI açar → Sesli sohbet eder.

---

## ADIM 1 — Claude API Anahtarı Al (Ücretsiz başlar)

1. **console.anthropic.com** adresine git
2. "Sign Up" ile hesap aç
3. Sol menüden **"API Keys"** → **"Create Key"**
4. Çıkan anahtarı kopyala ve bir yere kaydet (`sk-ant-...` ile başlar)
5. Hesabına biraz kredi yükle ($5 başlangıç için yeterli, ~150₺)

---

## ADIM 2 — Sunucuyu Render.com'a Yükle (Ücretsiz)

1. **github.com** adresine git → Hesap aç (ücretsiz)

2. Yeni bir repository oluştur:
   - Sağ üstte "+" → "New repository"
   - İsim: `ai-asistan`
   - "Create repository" tıkla

3. Kodu yükle:
   - "uploading an existing file" linkine tıkla
   - `server.js` ve `package.json` dosyalarını sürükle-bırak
   - "Commit changes" tıkla

4. **render.com** adresine git → Hesap aç

5. "New +" → "Web Service" → GitHub reposunu bağla

6. Ayarlar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

7. **Environment Variables** bölümüne ekle:
   - Key: `ANTHROPIC_API_KEY`
   - Value: 1. adımda kopyaladığın anahtar

8. "Deploy" tıkla → 2-3 dakika bekle

9. Sana bir URL verecek, örneğin:
   `https://ai-asistan-xxxx.onrender.com`
   
   **Bu URL'yi kaydet!**

---

## ADIM 3 — Netgsm Hesabı Aç

1. **netgsm.com.tr** → Üye ol
2. **Netsantral (Bulut Santral)** paketini satın al
3. Türkiye numarası seç (0850, 0212, 0312 vb.)
4. Hesabına bakiye yükle

---

## ADIM 4 — Netgsm Custom API Bağlantısı

1. Netgsm paneline gir
2. Sol menüden **"Netsantral"** → **"Entegrasyonlar"** → **"Custom (Özel API)"**
3. Şu ayarları yap:

   | Alan | Değer |
   |------|-------|
   | API URL | `https://ai-asistan-xxxx.onrender.com/webhook` |
   | Metot | POST |
   | İçerik Tipi | JSON |
   | Dil | Türkçe (tr-TR) |

4. **Kaydet**

5. Netsantral senaryosunda gelen aramaları Custom API'ye yönlendir

---

## ADIM 5 — Test Et!

1. Netgsm numarasını ara
2. AI "Merhaba! Ben yapay zeka asistanınım..." diyecek
3. Konuş: "Bugün ne var haberler?" veya istediğin herhangi bir şey

---

## Sorun Giderme

**AI cevap vermiyor:**
- Render.com dashboard'da logları kontrol et
- ANTHROPIC_API_KEY doğru girildi mi?

**Ses gelmiyor:**
- Netgsm panelinde TTS (Text-to-Speech) aktif mi?
- Custom API URL doğru mu?

**Haber güncel değil:**
- Normal, Claude web araması yapıyor ama bazen gecikebilir

---

## Aylık Tahmini Maliyet

| Hizmet | Tutar |
|--------|-------|
| Netgsm Netsantral paketi | ~100-150₺ |
| Netgsm dakika ücreti | ~1-2₺/dk |
| Anthropic Claude API | ~50-100₺ |
| Render.com sunucu | **Ücretsiz** |
| **TOPLAM** | **~250-350₺/ay** |

500₺ bütçeyle rahat eder. ✓

---

## Yardım

Herhangi bir adımda takılırsan Claude'a sor veya Netgsm müşteri hizmetlerini ara: **0850 288 0 288**
