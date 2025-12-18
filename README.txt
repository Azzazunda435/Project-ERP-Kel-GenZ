ERP Project - Single-folder version
Cara buka:
1. Download dan unzip folder.
2. Buka file index.html di browser (double-click).
3. Semua halaman dapat diakses lewat header.

Library CDN versions:
- Bootstrap 5.3.2
- Chart.js 4.4.1

Format input tiap halaman (contoh):
- BOM: ProdukA, Komp1:2, Komp2:3
- Forecasting: 120,130,125,140,150,160
- JSM: Alternatif1, 3, 2025-12-01
- SAW: Alternatif1, 80,70,90  (Bobot di field Extra: 0.4,0.35,0.25)
- Market Basket: bread,milk
- Profile Matching: Ideal,5,5,5  then candidates
- Markov: A,B,A,C,B,A

Fitur:
- Header & footer di-include via fetch.
- Validasi, spinner 0.5s, langkah perhitungan, tabel hasil, export CSV.
- Semua instruksi berbahasa Indonesia.

Testing:
- Gunakan contoh placeholder di masing-masing halaman.
- Coba masukkan input invalid (kosong atau format salah) untuk melihat validasi.

Files:
header.html
footer.html
index.html
bom.html
forecasting.html
jsm.html
saw.html
market-basket.html
profile-matching.html
markov.html
assets/css/styles.css
assets/js/app.js