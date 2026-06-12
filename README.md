# Football Hub - Futbol Wordle & Quiz

Lise öğrencisi tarafından yapılan, arkadaşlarla iPad/telefonda oynanmak üzere tasarlanmış futbol temalı oyun.

## Modlar

- **CLUB / PLAYER / MANAGER WORDLE** — Klasik Wordle mantığı
- **LOGO QUIZ** — Bulanık logoyu tahmin et
- **DAILY ⭐** — Herkesin aynı günü aynı kelimeyi çözdüğü mod, streak tutar
- **BLITZ ⚡** — 60 saniyede maks puan

## Özellikler

- 💡 İpucu sistemi (oyun başına 3 hak)
- 🔇 Ses açma/kapama
- 📤 Wordle tarzı paylaşılabilir emoji sonuç
- 🏆 Global skor tablosu (Vercel KV)
- 📱 PWA — iPad'de ana ekrana eklenebilir
- ⌨️ Klavye + dokunmatik destek

## Geliştirme

Saf vanilla HTML/CSS/JS. Build adımı yok.

```
.
├── index.html         # Ana HTML
├── manifest.json      # PWA manifest
├── css/styles.css     # Tüm stiller
├── js/
│   ├── game.js        # Ana oyun mantığı
│   └── utils.js       # Yardımcılar (ses, daily seed, vs)
├── data/
│   └── dataset.js     # Kulüp/oyuncu/yönetici/logo listeleri
└── api/
    └── leaderboard.js # Vercel KV leaderboard endpoint
```

## Yeni mod eklemek

1. `data/dataset.js`'e listeyi ekle
2. `index.html`'de `mode-switcher`'a buton ekle
3. `js/game.js`'de `setupWordle` veya yeni fonksiyon yaz

## Yeni kulüp/oyuncu eklemek

Sadece `data/dataset.js`'i düzenle, başka bir şey yok.

## Vercel Deploy

`vercel` CLI veya GitHub bağlantısı. `KV_REST_API_URL` + `KV_REST_API_TOKEN` env değişkenleri leaderboard için.

## Yol Haritası

Bkz: ROADMAP.md
