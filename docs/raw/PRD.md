### **Overview Proyek**

**Nama Konsep:** *Ecofin UMKM*

**Tujuan Utama:** Mentransformasi catatan transaksi harian UMKM F\&B menjadi **aset digital** yang dapat diverifikasi oleh lembaga keuangan (Koperasi/Bank) sebagai pengganti jaminan fisik (*collateral*).

**Cara Kerja:**

Aplikasi ini bertindak sebagai asisten keuangan cerdas yang memvalidasi kejujuran pedagang melalui **Konsistensi Data**. Sistem akan membandingkan antara input belanja bahan baku, input penjualan harian, dan bukti fisik foto. Jika ketiga titik data ini sinkron, maka *Trust Score* (Skor Kepercayaan) pedagang akan naik, yang secara otomatis meningkatkan indikator kelayakan mereka untuk menerima KUR.

### **Analisis SWOT Aplikasi Pencatat Keuangan UMKM F\&B**

| Kategori | Deskripsi Analisis |
| :---- | :---- |
| **Strengths** (Kekuatan) | \* **Niche Spesifik:** Fokus pada F\&B memungkinkan fitur yang lebih relevan (seperti manajemen stok bahan baku/HPP). \* **Automated Credit Scoring:** Data performa keuangan otomatis memudahkan pihak bank/koperasi melakukan asesmen tanpa verifikasi manual yang rumit. \* **Transparansi:** Memberikan gambaran kesehatan bisnis yang jujur bagi pemilik UMKM maupun pemberi pinjaman. |
| **Weaknesses** (Kelemahan) | \* **Input Data Manual:** Masih bergantung pada kedisiplinan pedagang untuk mencatat setiap transaksi. \* **Kurva Belajar:** Sebagian pedagang UMKM mungkin merasa aplikasi keuangan terlalu rumit jika UI/UX tidak dirancang dengan sangat sederhana. \* **Ketergantungan Internet:** Kendala koneksi di beberapa lokasi usaha bisa menghambat sinkronisasi data secara *real-time*. |
| **Opportunities** (Peluang) | \* **Dukungan Pemerintah:** Sejalan dengan program digitalisasi UMKM dan penyaluran KUR yang lebih tepat sasaran. \* **Partnership:** Peluang besar untuk kolaborasi dengan Bank Himbara, Koperasi, atau lembaga P2P Lending. |
| **Threats** (Ancaman) | \* **Kompetisi:** Sudah banyak aplikasi POS (*Point of Sale*) besar seperti Moka, Majoo, atau BukuWarung yang memiliki basis pengguna luas. \* **Keamanan Data:** Risiko kebocoran data transaksi sensitif yang bisa menurunkan kepercayaan pengguna. \* **Regulasi:** Perubahan aturan pemerintah terkait privasi data keuangan atau syarat penyaluran kredit. |

### ---

**Daftar Fitur Utama (MVP Berbasis Website)**

| Nama Fitur | Teknologi AI/Web | Kegunaan & Pencegahan Fraud |
| :---- | :---- | :---- |
| **Voice-to-Ledger** | **NLP** (Speech-to-Text) | Pengguna cukup bicara ("Laku 10 porsi ayam") untuk mencatat penjualan. Menghilangkan hambatan mengetik bagi pengguna *gaptek*. |
| **Smart Receipt Scanner** | **Computer Vision** (OCR) | Memindai nota belanja bahan baku (minyak, beras, daging). Sistem mencocokkan apakah pengeluaran bahan baku logis dengan total penjualan yang dilaporkan. |
| **Trust Score Dashboard** | **Machine Learning** (Scoring) | Visualisasi sederhana (Merah/Kuning/Hijau) yang menunjukkan peluang pengguna mendapatkan pinjaman berdasarkan kedisiplinan dan validitas data. |
| **Metadata Verification** | **Web API** (GPS & Timestamp) | Mengunci setiap input data dengan lokasi toko dan waktu riil. Mencegah pedagang menginput data "borongan" di rumah atau memanipulasi waktu transaksi. |
| **Anomaly Detection Engine** | **ML** (Isolation Forest/Statistik) | Mendeteksi pola tidak wajar, seperti lonjakan penjualan drastis tanpa didukung data belanja bahan baku yang setara. |
| **Inventory Reconciliation** | **Logic Engine** | Secara otomatis menghitung sisa stok. Jika stok di sistem habis tapi pedagang terus mencatat penjualan, sistem akan memberi peringatan (*flagging*). |
| **PWA (Progressive Web App)** | **Service Workers** | Website yang bisa diinstall di HP seperti aplikasi, tetap bisa diakses saat sinyal lemah, dan sangat ringan untuk HP spesifikasi rendah. |
| **Export Report KUR** | **PDF Generator** | Mengubah seluruh catatan yang sudah terverifikasi menjadi laporan keuangan formal yang siap diajukan ke Koperasi atau Bank. |

### ---

**Strategi "Anti-Fraud" Tanpa Integrasi Bank**

Karena kamu fokus pada pengembangan website dan AI tanpa API bank di tahap awal, validasi akan bergeser ke **Triangulasi Data**:

1. **Data Masuk:** Pedagang input penjualan (via suara/teks).  
2. **Data Keluar:** Pedagang scan nota belanja (via foto).  
3. **Data Stok:** Sistem menghitung: *"Jika beli 10kg ayam, harusnya laku sekitar 80 porsi."*  
4. **Hasil:** Jika pedagang klaim laku 200 porsi tapi nota belanja ayam hanya 5kg, AI akan menurunkan *Trust Score* karena data dianggap tidak valid atau dimanipulasi.

### ---

### **Aktor: Pemilik UMKM (Pedagang)**

**Profil:** Pengguna utama yang sibuk, cenderung *gaptek*, dan membutuhkan akses modal.

* **Role & Tanggung Jawab:** Mengelola data operasional harian (penjualan/pengeluaran) secara jujur dan konsisten untuk meningkatkan kelayakan kredit.  
* **Aksi yang Bisa Dilakukan:**  
  * Mencatat penjualan menggunakan suara (*Voice-to-Ledger*).  
  * Mengunggah foto nota belanja bahan baku untuk diverifikasi AI.  
  * Mendaftarkan menu produk dan harga.  
  * Melihat status "kesehatan" keuangan bisnis secara *real-time*.  
  * Mengajukan permohonan pinjaman KUR langsung melalui aplikasi.  
* **Fitur Utama:**  
  * *Input Dashboard:* Antarmuka sederhana untuk input transaksi.  
  * *Trust Score Gauge:* Indikator speedometer untuk melihat kelayakan pinjam.  
  * *Digital Receipt Folder:* Penyimpanan foto nota digital.  
* **Kebutuhan Data:**  
  * Data Profil (Nama, KTP, Lokasi Usaha).  
  * Data Transaksi (Item terjual, harga, total belanja bahan).  
  * Data Geospasial (Lokasi GPS saat input transaksi).  
  * Foto Nota/Bukti Fisik.

### ---

### **Aktor: Pihak Pemberi Pinjaman (Koperasi/Bank)**

**Profil:** Analis kredit atau manajer koperasi yang membutuhkan validasi data untuk menekan angka kredit macet (NPL).

* **Role & Tanggung Jawab:** Memantau portofolio UMKM, melakukan verifikasi kelayakan berdasarkan data AI, dan mengambil keputusan pemberian pinjaman.  
* **Aksi yang Bisa Dilakukan:**  
  * Melihat daftar UMKM yang memiliki skor kepercayaan (Trust Score) tinggi.  
  * Melakukan audit pada transaksi yang ditandai sebagai "Anomali" oleh AI.  
  * Mengunduh laporan keuangan UMKM yang sudah terstandarisasi.  
  * Memberikan persetujuan atau penolakan pinjaman secara sistem.  
* **Fitur Utama:**  
  * *Credit Analysis Dashboard:* Grafik tren arus kas dan perbandingan antar UMKM.  
  * *Fraud Alert System:* Notifikasi jika ada transaksi mencurigakan (input di luar lokasi/jam operasional).  
  * *Export Report:* Fitur cetak laporan laba-rugi otomatis.  
* **Kebutuhan Data:**  
  * Rekapitulasi Skor Kredit (Historis 6-12 bulan).  
  * Data Agregat Keuangan (Total Omzet, Laba Bersih, Rasio Beban).  
  * Log Validasi AI (Tingkat akurasi OCR dan konsistensi GPS).

### ---

### **Ringkasan Kebutuhan Data (Matriks Data Terkait)**

| Kebutuhan Data | Pemilik UMKM | Pemberi Pinjaman |
| :---- | :---- | :---- |
| **Profil Pribadi/KTP** | Input | View |
| **Transaksi Harian** | Input | View (Aggregated) |
| **Foto Nota (OCR)** | Input | View (Verification) |
| **Lokasi GPS** | Automatic | View (Fraud Check) |
| **Skor Kredit** | View | View & Analysis |

### ---

### **Dasbor Pedagang UMKM (Fokus: Kesederhanaan & Motivasi)**

Untuk orang awam, hindari istilah teknis keuangan. Gunakan metafora visual seperti warna lampu lalu lintas atau ikon yang familiar.

| Jenis Visualisasi | Nama yang Digunakan | Fungsi |
| :---- | :---- | :---- |
| **Gauge Chart** (Speedometer) | **Indikator "Siap Pinjam"** | Menunjukkan skor kredit saat ini. Jarum di area hijau berarti mereka sudah bisa mengajukan KUR. Ini sangat intuitif. |
| **Simple Bar Chart** | **Uang Masuk Harian** | Menunjukkan pendapatan 7 hari terakhir. Batang yang tinggi menunjukkan hari paling laris (misal: akhir pekan). |
| **Donut Chart** | **Kue Pengeluaran** | Membagi pengeluaran ke kategori simpel: Belanja Bahan, Listrik/Sewa, dan Gaji. Membantu mereka melihat ke mana uang paling banyak habis. |
| **Iconic Progress Bar** | **Sisa Stok Bahan** | Menggunakan ikon (misal: botol minyak atau karung beras) yang berkurang warnanya jika stok menipis. |

### ---

### **Dasbor Pihak Peminjam/Koperasi (Fokus: Analisis & Risiko)**

Pihak bank membutuhkan data yang lebih mendalam untuk memvalidasi apakah angka yang dilaporkan pedagang itu masuk akal atau hasil manipulasi.

| Jenis Visualisasi | Nama yang Digunakan | Fungsi |
| :---- | :---- | :---- |
| **Dual Line Chart** | **Tren Arus Kas** | Membandingkan Pendapatan vs Pengeluaran dalam 6-12 bulan. Digunakan untuk melihat stabilitas usaha sebelum memberi pinjaman. |
| **Heatmap Calendar** | **Densitas Transaksi** | Menunjukkan jam/hari aktif transaksi. Jika ada transaksi di jam tidak wajar secara konsisten, ini adalah indikasi *fraud*. |
| **Radar Chart** | **Profil Risiko UMKM** | Menilai 5 aspek: Kedisiplinan Input, Validitas Foto Nota, Pertumbuhan Penjualan, Keuntungan, dan Riwayat Lokasi (GPS). |
| **Stacked Bar Chart** | **Komposisi Validitas Data** | Menunjukkan berapa persen data yang diinput manual vs data yang diverifikasi AI (OCR nota/suara). Semakin banyak data terverifikasi, semakin rendah risiko. |

### ---

### **Formula Sederhana "Trust Score"**

Sebagai pengembang, kamu bisa menghitung skor ini secara internal untuk kemudian ditampilkan dalam grafik *speedometer*. Rumus sederhananya bisa seperti ini:

$$Trust Score \= (W\_1 \\cdot C) \+ (W\_2 \\cdot V) \+ (W\_3 \\cdot G)$$  
Di mana:

* **$C$ (Consistency):** Seberapa rutin mereka mencatat tiap hari.  
* **$V$ (Validity):** Persentase input yang didukung foto nota/bukti lokasi.  
* **$G$ (Growth):** Tren kenaikan laba bersih.  
* **$W$ (Weight):** Bobot kepentingan (misal: validitas data diberi bobot paling besar).

### ---

### **Skema Entitas**

JSON

{  
  "database\_schema": {  
    "entities": \[  
      {  
        "entity": "Users",  
        "description": "Menyimpan informasi profil pemilik UMKM",  
        "attributes": \[  
          {"name": "user\_id", "type": "UUID", "constraint": "PK"},  
          {"name": "full\_name", "type": "VARCHAR(255)"},  
          {"name": "phone\_number", "type": "VARCHAR(20)", "constraint": "UNIQUE"},  
          {"name": "email", "type": "VARCHAR(100)", "constraint": "UNIQUE"},  
          {"name": "password\_hash", "type": "TEXT"},  
          {"name": "created\_at", "type": "TIMESTAMP"}  
        \]  
      },  
      {  
        "entity": "Businesses",  
        "description": "Informasi detail unit usaha UMKM",  
        "attributes": \[  
          {"name": "business\_id", "type": "UUID", "constraint": "PK"},  
          {"name": "owner\_id", "type": "UUID", "constraint": "FK (Users)"},  
          {"name": "business\_name", "type": "VARCHAR(255)"},  
          {"name": "address", "type": "TEXT"},  
          {"name": "category", "type": "VARCHAR(50)", "default": "F\&B"},  
          {"name": "latitude\_home", "type": "DECIMAL(10, 8)"},  
          {"name": "longitude\_home", "type": "DECIMAL(11, 8)"}  
        \]  
      },  
      {  
        "entity": "Products",  
        "description": "Daftar menu atau produk yang dijual",  
        "attributes": \[  
          {"name": "product\_id", "type": "UUID", "constraint": "PK"},  
          {"name": "business\_id", "type": "UUID", "constraint": "FK (Businesses)"},  
          {"name": "product\_name", "type": "VARCHAR(255)"},  
          {"name": "price", "type": "DECIMAL(15, 2)"},  
          {"name": "current\_stock", "type": "INT", "default": 0},  
          {"name": "unit", "type": "VARCHAR(20)", "example": "pcs, porsi, kg"}  
        \]  
      },  
      {  
        "entity": "Transactions",  
        "description": "Data utama transaksi masuk (penjualan) dan keluar (belanja)",  
        "attributes": \[  
          {"name": "transaction\_id", "type": "UUID", "constraint": "PK"},  
          {"name": "business\_id", "type": "UUID", "constraint": "FK (Businesses)"},  
          {"name": "type", "type": "ENUM('INCOME', 'EXPENSE')"},  
          {"name": "total\_amount", "type": "DECIMAL(15, 2)"},  
          {"name": "input\_method", "type": "ENUM('MANUAL', 'VOICE', 'OCR')"},  
          {"name": "latitude\_captured", "type": "DECIMAL(10, 8)"},  
          {"name": "longitude\_captured", "type": "DECIMAL(11, 8)"},  
          {"name": "created\_at", "type": "TIMESTAMP"}  
        \]  
      },  
      {  
        "entity": "Transaction\_Details",  
        "description": "Detail item dalam satu transaksi (breakdown porsi/barang)",  
        "attributes": \[  
          {"name": "detail\_id", "type": "UUID", "constraint": "PK"},  
          {"name": "transaction\_id", "type": "UUID", "constraint": "FK (Transactions)"},  
          {"name": "product\_id", "type": "UUID", "constraint": "FK (Products)"},  
          {"name": "quantity", "type": "INT"},  
          {"name": "subtotal", "type": "DECIMAL(15, 2)"}  
        \]  
      },  
      {  
        "entity": "Receipt\_Images",  
        "description": "Penyimpanan metadata hasil OCR untuk validasi nota",  
        "attributes": \[  
          {"name": "receipt\_id", "type": "UUID", "constraint": "PK"},  
          {"name": "transaction\_id", "type": "UUID", "constraint": "FK (Transactions)"},  
          {"name": "image\_url", "type": "TEXT"},  
          {"name": "ocr\_raw\_json", "type": "JSONB"},  
          {"name": "confidence\_score", "type": "FLOAT"}  
        \]  
      },  
      {  
        "entity": "Credit\_Scores",  
        "description": "Historis skor kepercayaan untuk pengajuan KUR",  
        "attributes": \[  
          {"name": "score\_id", "type": "UUID", "constraint": "PK"},  
          {"name": "business\_id", "type": "UUID", "constraint": "FK (Businesses)"},  
          {"name": "score\_value", "type": "INT"},  
          {"name": "analysis\_notes", "type": "TEXT"},  
          {"name": "calculated\_at", "type": "TIMESTAMP"}  
        \]  
      }  
    \]  
  }  
}

## ---

**Technical UI Documentation: PayPal-like Interface System**

### **1\. Visual Foundation (Design Tokens)**

#### **Color Palette**

Sistem warna menggunakan pendekatan *high-contrast* untuk profesionalitas finansial.

* **Primary (Action):** \#003087 (PayPal Blue \- Deep), \#0070E0 (Bright Blue for links/CTAs).  
* **Secondary:** \#FFFFFF (Pure White), \#F5F7FA (Light Gray Background).  
* **Surface/Card:** \#FFFFFF dengan border \#E5E7EB.  
* **Semantic Colors:**  
  * **Success:** \#28806A (Text), \#D1F2EB (Background Pill).  
  * **Error/Danger:** \#D93602 (Chart Negative/Alerts).  
  * **Warning/Alert:** \#FFBC05 (Yellow banner background).  
  * **Neutral/Draft:** \#6B7280 (Gray text/icons).

#### **Typography**

Estimasi menggunakan font proprietary *PayPal Sans* atau fallback *Inter/Open Sans*.

* **Heading 1 (Hero/Balance):** 2.25rem (36px) | Bold | Line-height: 1.2.  
* **Heading 2 (Section):** 1.5rem (24px) | Semibold | Line-height: 1.3.  
* **Body (Primary):** 1rem (16px) | Regular | Line-height: 1.5.  
* **Caption/Small:** 0.875rem (14px) | Regular/Medium | Line-height: 1.4.

#### **Shadows & Elevations**

PayPal menggunakan elevasi yang sangat rendah untuk menjaga kesan bersih dan "flat".

* **Card Shadow:** box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);  
* **Focus State:** Ring blue offset 2px.

### ---

**2\. Layout System**

* **Grid System:** Menggunakan **12-column grid** dengan max-width kontainer 1280px.  
* **Spacing Scale:** Konsisten menggunakan **Base 8px** (4, 8, 12, 16, 24, 32, 48, 64).  
  * *Gutter antar card:* 24px.  
  * *Section margin:* 48px.  
* **Flexbox Patterns:**  
  * **Header Nav:** display: flex; justify-content: space-between; align-items: center;  
  * **Quick Links:** display: flex; gap: 16px; overflow-x: auto; (pada mobile).  
* **Responsiveness:**  
  * Sidebar/Insights berpindah dari samping ke bawah (stacking) pada breakpoint \< 1024px.  
  * Invoice preview (Image 4\) bersifat opsional/hidden pada layar di bawah 768px.

### ---

**3\. Illustration & Iconography Style**

* **Icon Style:** Outlined/Linear dengan stroke-width 1.5px atau 2px. Warna menyesuaikan context (Primary blue atau Gray).  
* **Illustrations:** Flat design dengan penggunaan *muted colors* dan bentuk geometris yang melengkung (organik), memberikan kesan ramah dan tidak kaku.

### ---

**4\. Component Breakdown (Atomic Level)**

#### **A. Buttons**

* **Primary Button (Pill):** \* border-radius: 9999px.  
  * padding: 12px 24px.  
  * background: \#003087; color: white;.  
  * *Hover:* filter: brightness(1.1);.  
* **Secondary/Outline Button:** \* border: 1px solid \#003087; color: \#003087;.  
* **Ghost Button (Icon only):** \* border-radius: 50%.

#### **B. Cards (The Building Blocks)**

* **Container:** \* background: \#FFFFFF.  
  * border: 1px solid \#E5E7EB.  
  * border-radius: 16px (Sangat rounded untuk kesan modern).  
  * padding: 24px.

#### **C. Input Fields & Forms**

* **Text Input:** \* border: 1px solid \#D1D5DB.  
  * border-radius: 8px.  
  * padding: 12px 16px.  
* **Select/Dropdown:** Menggunakan chevron icon di sisi kanan.

#### **D. Data Display (Table & Charts)**

* **Status Badges:** \* padding: 4px 12px.  
  * font-size: 12px.  
  * border-radius: 12px.  
* **Crypto Chart:** \* Sistem koordinat menggunakan SVG path.  
  * Color: \#D93602 (Negative trend).

### ---

**5\. Accessibility (WCAG 2.1 Compliance)**

* **Color Contrast:** \* Teks utama (\#000000 atau \#242729) di atas background putih mencapai rasio \> 7:1 (Level AAA).  
  * Action Button blue (\#0070BA) mencapai rasio \> 4.5:1 (Level AA).  
* **Touch Targets:** \* Semua elemen interaktif (Quick links, Tab Crypto, Button) memiliki tinggi minimal 44px hingga 48px, ideal untuk penggunaan mobile/touch.  
* **Visual Hierarchy:** Penggunaan ukuran font yang kontras antara "Total Balance" dan "Label" membantu pengguna tunanetra ringan untuk membedakan informasi penting dengan cepat.

