# Football Hub — Yol Haritası

## ✅ v2.0 (Bu Sürüm — Faz 1 + Faz 2 başlangıcı)

- [x] Tek dosya → modüler yapı (HTML/CSS/JS/data ayrı)
- [x] Veri listeleri 3-4x büyüdü (Türk takım/oyuncu/hoca ağırlığı)
- [x] **Daily Challenge** modu (günün kelimesi, daily streak)
- [x] **Blitz** modu (60 sn yarış)
- [x] **İpucu sistemi** (3 hak, puanı azaltır)
- [x] Ses efektleri (Web Audio API, sentez — dosya yok)
- [x] Paylaşılabilir emoji sonuç (Wordle tarzı 🟩🟨⬛)
- [x] PWA manifest
- [x] Türkçe arayüz

## 🚧 v2.1 — Faz 2 devamı (yeni modlar)

- [ ] **Kariyer Yolu** modu: "Ajax → Tottenham → Bayern → ? = kim?"
  - data/career-paths.json ekle
- [ ] **Stadyum Quiz**: stadyum görseli → kulüp/şehir
- [ ] **Formasyon Quiz**: bulanık forma görseli
- [ ] **Transfer Trivia**: "2019'da Hazard hangi takıma transfer oldu?"
- [ ] Zorluk seviyeleri (Kolay/Orta/Zor) — popülerlik filtresi
- [ ] İkinci ipucu tipi: "Bu oyuncunun milliyeti X"

## 🎯 Faz 3 — Sosyal & Rekabet

- [ ] **Düello modu**: Arkadaşa link gönder, aynı kelimeyi çöz
  - Yeni api endpoint: `/api/duel/create`, `/api/duel/[id]`
  - Vercel KV'de duel state tut
- [ ] **Özel Odalar**: 6 haneli oda kodu (sınıf arkadaşları için)
- [ ] **Başarımlar**: streak rozetleri, "ipucusuz çöz" vs.
- [ ] **Anti-cheat**: Skor doğrulamayı server'a taşı
  - Şu an client `totalScore` gönderiyor → hile kolay
  - Çözüm: her tahmini server'a logla, skor sunucuda hesaplansın
- [ ] **Avatar seçimi** (emoji veya forma renkleri)

## 💎 Faz 4 — Cila

- [ ] **Takım temaları**: Galatasaray/Fener/Beşiktaş renk paletleri
- [ ] **Confetti animasyonu** (kazanınca)
- [ ] **Çoklu dil**: TR/EN switch
- [ ] **Karanlık/Aydınlık tema**
- [ ] **Service Worker** (offline çalışsın)
- [ ] **Haptic feedback** (mobilde titreşim)
- [ ] **Analytics**: hangi mod kaç kere oynandı (basit Vercel KV sayaç)

## 🐛 Bilinen Eksikler

- Logo Quiz'deki bazı SVG'ler Wikipedia URL'leri — bozulabilir, lokal hosting daha sağlam
- Anti-cheat yok (skor client'tan geliyor)
- Türkçe karakterler normalize ediliyor (İSTANBUL → ISTANBUL); UI'da gerçek hâli gösterilse daha güzel
- Klavye Türkçe Q (Ğ, Ü, Ş, İ, Ö, Ç) içermiyor — gerekirse eklenebilir

## 📦 Hızlı Eklemeler (5 dakika işleri)

Eğer hemen bir şey eklemek istersen:

1. **Daha çok kulüp/oyuncu** → sadece `data/dataset.js` düzenle
2. **Yeni klavye dili** → `index.html`'de `.kb-row`'ları değiştir
3. **Renk değişikliği** → `css/styles.css` :root değişkenleri
4. **Yeni mod butonu** → `index.html` mode-switcher + `game.js` switchMode

## 🧠 Mimari Notlar (geleceğin sen için)

- Tüm state localStorage'da (`fw_` prefixli)
- Daily Challenge tohumu = tarih hash'i → herkes aynı kelime
- Hint sistemi: revealedPositions Set'i tutuyor, submitGuess otomatik dolduruyor
- Ses Web Audio API ile sentezlenir (mp3 dosyası yok = hızlı yükleme)
- Module type="module" ile ES6 import kullanılıyor — modern tarayıcı şart
