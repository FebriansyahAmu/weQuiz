# PRD — weQuiz: Ujian Pemindahan Jabatan & Peningkatan Skill (Casting Divisi Molding)

| | |
|---|---|
| **Status** | Draft v1 — menunggu keputusan pada §12 (Pertanyaan Terbuka) |
| **Tanggal** | 2026-10-21 |
| **Sumber soal** | `CASTING + KUNCI JAWABAN.DOCX.pdf` (39 halaman, 250 soal) |
| **Stack** | Next.js 16.4 (App Router) · React 19.3 · Tailwind CSS v4 · Prisma ORM 7.x · Supabase Postgres · Vercel |

---

## 1. Ringkasan

weQuiz adalah web ujian sederhana tanpa login untuk karyawan Casting Divisi Molding. Peserta cukup mengisi nama, mengerjakan soal dari bank soal resmi (pilihan tunggal, multi jawaban, dan benar/salah), lalu langsung melihat nilai dalam bentuk persentase beserta pembahasan jawabannya.

Walaupun sederhana, aplikasi ini harus terasa **elegan, modern, interaktif, dan responsif**, terutama di HP karena banyak karyawan lapangan yang akan memakai HP.

## 2. Tujuan & Non-Tujuan

### Tujuan
1. Peserta bisa mulai ujian dalam ≤ 2 langkah: isi nama, lalu tekan **Mulai**.
2. Ketiga tipe soal didukung dengan UX yang jelas: **Pilihan Tunggal**, **Multi Jawaban**, dan **Benar/Salah**.
3. Penilaian otomatis berupa persentase `benar / jumlah soal × 100`.
4. Semua data (bank soal, sesi ujian, jawaban, hasil) tersimpan di Supabase Postgres lewat Prisma.
5. Kunci jawaban **tidak pernah** dikirim ke browser selama ujian berlangsung, dan penilaian dilakukan di server.
6. Kode fullstack memiliki lapisan yang jelas (routes → services → DAL → db) supaya mudah dirawat.
7. Bisa di-deploy ke Vercel tanpa konfigurasi tambahan selain environment variable.

### Non-Tujuan (v1)
- Login atau autentikasi peserta.
- Editor bank soal lewat UI (CRUD soal). Soal dimasukkan lewat seed script.
- Proctoring/anti-cheat tingkat lanjut (deteksi tab, kamera, dll.).
- Multi-tenant atau banyak divisi. Fokus v1 hanya Casting Divisi Molding.
- Ekspor sertifikat PDF.

## 3. Pengguna

| Persona | Kebutuhan |
|---|---|
| **Peserta ujian** (karyawan molding, sebagian besar memakai HP) | Masuk cepat, teks soal mudah dibaca, tombol jawaban besar, tahu progres, tidak kehilangan jawaban kalau koneksi putus atau halaman ter-refresh |
| **Pengawas/HR** (v1: opsional, lihat §12) | Melihat rekap nilai peserta |

---

## 4. Analisis Bank Soal

### 4.1 Komposisi

| Bagian | Nomor | Jumlah | Format kunci di PDF |
|---|---|---|---|
| A. Pilihan Tunggal | 1–108 | **108** | `答案 : B` |
| B. Multi Jawaban | 109–183 | **75** | `答案: A, C, D` · `答案: AD` · no. 179–183 kuncinya ada di awal soal, mis. `(ABDE)` |
| C. Benar/Salah | 184–250 | **67** | `答案: （√）/（X）` · no. 239–243 `【 √ 】` · no. 244–245 `[ B ]` (= Benar) · no. 246–250 `(√)` di akhir kalimat |
| **Total** | | **250** | |

### 4.2 Level (dari keterangan warna di akhir dokumen)

Di akhir PDF tertulis: **LV1 = merah, LV2 = biru, LV3 = maroon**. Soal berwarna **hitam** adalah materi umum (K3, peraturan perusahaan, hak/kewajiban) yang juga memiliki terjemahan Mandarin. Pemetaan berdasarkan warna teks di PDF:

| Level | Pilihan Tunggal | Multi Jawaban | Benar/Salah |
|---|---|---|---|
| **LV1** (merah) | 1–50 | 109–141, 157–171 | 184–208, 224–238 |
| **LV2** (biru) | 51–70 | 142–156 | 209–223 |
| **LV3** (maroon) | 71–90 | — | — |
| **UMUM** (hitam) | 91–108 | 172–183 | 239–250 |

> ⚠️ Pemetaan ini dibaca dari warna tampilan PDF dan **perlu dikonfirmasi** sebelum seed final (lihat §12).

### 4.3 Karakteristik Data
- **Jumlah opsi bervariasi.** Mayoritas 4 opsi (A–D). Soal no. 52, 89, 90 di Pilihan Tunggal dan banyak soal Multi Jawaban memiliki **5 opsi (A–E)**. Skema harus mendukung jumlah opsi dinamis.
- **Bilingual (ID + 中文).** Soal 91–108, 173–183, dan 239–250 punya terjemahan Mandarin, sehingga disediakan field opsional `textZh` pada soal dan opsi. UI menampilkan terjemahan sebagai teks sekunder (bisa di-toggle).
- **Benar/Salah** disimpan sebagai soal dengan 2 opsi tetap (`Benar`, `Salah`). Dengan begitu mesin penilaian sama untuk semua tipe.

### 4.4 Temuan Kualitas Data (perlu keputusan/perbaikan saat seed)

| No. | Temuan | Usulan |
|---|---|---|
| 10 vs 111 | Soal sama ("Faktor resiko bahaya pada laddle"). No. 10 opsi b "Kebanjiran" dengan kunci A, sedangkan no. 111 opsi b "Kebakaran" dengan kunci A, B | Tetap dua soal terpisah, tetapi tandai `duplicateOf`. Hindari keduanya muncul di satu sesi |
| 16 ≈ 57, 27 ≈ 60, 29 ≈ 64, 42 ≈ 53, 70 ≈ 113, 47 ≈ 125 | Soal mirip/duplikat substansi | Kelompokkan dengan `groupKey` supaya pengacak tidak memilih dua soal dari grup yang sama |
| 11 vs 43 | Jarak aman tabung oksigen dari api: 5 m (no. 11) vs 10 m untuk semua tabung gas (no. 43) | Tidak bertentangan secara format, tetapi **perlu konfirmasi SME** |
| 182 | Terjemahan Mandarin opsi **e** salah (menyalin opsi d) | Perbaiki saat seed, atau kosongkan `textZh` opsi tersebut |
| 179–183 | Kunci ditulis di awal kalimat soal (`(ABDE) Berikut…`) | Parser membuang prefix dari teks soal |
| 244–245 | Kunci ditulis `[ B ]`, bukan √/X | Diartikan **Benar** |
| 174 | Soal "kecuali" pada Multi Jawaban | Tidak ada perubahan. Pastikan teks "kecuali" ditonjolkan di UI (lihat §7.4) |
| Typo | "Mempu" (172b), "Breada" (140d), "danpa" (194), "dam" (207), "alan napas" (207), "haris" (204), "cai" (201), "Meniggalkan" (22a), dll. | Diperbaiki saat penyusunan `seed/questions.json`, lalu direview bersama sebelum seed final |

### 4.5 Strategi Ekstraksi
1. Soal ditranskripsi ke tiga file sumber kebenaran per tipe, yaitu **`prisma/seed/data/{single,multiple,true-false}.json`**, yang di-commit ke repo dan bisa direview di PR. Daftar koreksi dan catatan SME ada di [`prisma/seed/README.md`](../prisma/seed/README.md).
2. Format ringkas per soal (opsi berlabel A–E sesuai urutan array):
   ```json
   { "number": 1, "level": "LV1", "text": "Sebelum menjalankan mesin cetakan, …?",
     "options": ["Keadaan mental pekerja", "Fungsi normal mesin cetakan", "…"], "answer": "B" }
   { "number": 109, "level": "LV1", "groupKey": "…", "options": ["…"], "answer": ["A", "C", "D"] }
   { "number": 239, "level": "GENERAL", "text": "…", "textZh": "…", "answer": true }
   ```
3. Validasi dengan Zod (`src/lib/validation/question-bank.ts`) sebelum seed. Aturannya: kunci harus menunjuk opsi yang ada, label kunci unik, panjang `optionsZh` sama dengan `options`, field asing ditolak, nomor unik di semua file, dan setiap `groupKey` dipakai minimal 2 soal. Data lalu dinormalisasi menjadi `Question` + `Option` (`isCorrect`), dan soal Benar/Salah menjadi dua opsi `BENAR` / `SALAH`.
4. `prisma db seed` (`prisma/seed/seed.mts`) bersifat idempoten. Soal baru dimasukkan secara bulk, soal yang berubah di-update dengan opsi di-upsert per label (ID opsi tetap), dan soal yang hilang dari file dinonaktifkan.
5. `tests/question-bank.test.ts` mencocokkan **seluruh 250 kunci** dengan tabel kunci yang ditranskripsi terpisah, serta memvalidasi pemetaan level.

---

## 5. Aturan Ujian & Penilaian

### 5.1 Alur
1. **Landing.** Peserta mengisi nama (wajib, 2–80 karakter, di-trim), lalu memilih paket ujian (lihat §5.2).
2. **Mulai.** Server membuat `Attempt` dan memilih serta mengurutkan soal. Browser hanya menerima soal **tanpa** `isCorrect`.
3. **Mengerjakan.** Setiap jawaban di-autosave ke server (debounce kurang lebih 400 ms). Peserta boleh melompat antar soal, menandai soal untuk dicek ulang ("ragu-ragu"), dan mengubah jawaban selama belum submit.
4. **Submit.** Dialog konfirmasi menampilkan jumlah soal yang belum dijawab dan yang ditandai ragu. Setelah submit, server menilai dan mengunci attempt.
5. **Hasil.** Menampilkan skor %, rincian benar/salah/kosong per tipe soal, dan mode review (jawaban peserta vs kunci).

### 5.2 Paket Ujian (konfigurasi sesi)
Satu set preset disimpan di kode (`src/config/exam-presets.ts`). Usulan default:

| Preset | Isi |
|---|---|
| **Standar** (default) | 50 soal acak: 25 Pilihan Tunggal, 15 Multi Jawaban, 10 Benar/Salah |
| **Per Level** | Filter LV1 / LV2 / LV3 (+ soal UMUM), komposisi proporsional |
| **Lengkap** | Seluruh 250 soal |

- Urutan tampilan: dikelompokkan per tipe (A, lalu B, lalu C), dan soal di dalam setiap kelompok diacak. Urutan opsi **tidak** diacak karena ada opsi "Semua jawaban benar" atau "Semua jawaban salah" yang bergantung pada posisi.
- Pengacakan menghindari dua soal dengan `groupKey` yang sama dalam satu sesi.
- Timer: **opsional per preset** (usulan: Standar 60 menit). Saat waktu habis, server otomatis menilai jawaban yang sudah tersimpan. Batas waktu divalidasi di server (`startedAt + durationSec`), tidak hanya mengandalkan timer di browser.

### 5.3 Rumus Penilaian
```
skor (%) = (jumlah soal benar / jumlah soal dalam sesi) × 100   → dibulatkan 1 desimal
```
- **Pilihan Tunggal & Benar/Salah:** benar jika opsi yang dipilih adalah opsi benar.
- **Multi Jawaban:** benar **hanya jika himpunan opsi yang dipilih sama persis** dengan himpunan kunci (all-or-nothing). Kurang satu atau kelebihan satu dihitung salah.
- **Tidak dijawab** dihitung salah, tetapi ditampilkan terpisah sebagai "Kosong" di rincian.
- Tidak ada pengurangan nilai (negative marking).
- Penilaian ada di `src/server/services/scoring.ts` sebagai **fungsi murni** (pure function) yang diuji unit test.

> Opsi lanjutan (bukan default): nilai parsial untuk Multi Jawaban. Lihat §12.

### 5.4 Ketahanan Sesi
- `attemptId` disimpan di `localStorage`. Jika halaman di-refresh atau browser ditutup, peserta ditawari **"Lanjutkan ujian"** dari server.
- Jawaban adalah sumber kebenaran di server. Jika autosave gagal (offline), jawaban diantrikan di browser, ditandai indikator "Belum tersimpan", lalu dikirim ulang otomatis.
- Attempt yang sudah `SUBMITTED` tidak bisa diubah (dicek di service, bukan hanya di UI).

---

## 6. Kebutuhan Fungsional

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-01 | Form nama + pilihan preset + tombol Mulai | P0 |
| F-02 | Render 3 tipe soal: radio card (Tunggal), checkbox card + label "Pilih semua yang benar" (Multi), dua tombol besar Benar/Salah | P0 |
| F-03 | Navigasi Sebelumnya/Berikutnya + grid navigator nomor soal (status: kosong / terjawab / ragu / aktif) | P0 |
| F-04 | Autosave per jawaban + indikator status simpan | P0 |
| F-05 | Tandai "ragu-ragu" per soal | P0 |
| F-06 | Dialog konfirmasi submit (ringkasan soal kosong & ragu) | P0 |
| F-07 | Penilaian di server + halaman hasil (skor %, benar/salah/kosong, rincian per tipe) | P0 |
| F-08 | Mode review: setiap soal menampilkan pilihan peserta vs kunci, dengan filter "Hanya yang salah" | P0 |
| F-09 | Lanjutkan ujian setelah refresh | P0 |
| F-10 | Timer hitung mundur + auto-submit | P1 |
| F-11 | Toggle terjemahan 中文 untuk soal bilingual | P1 |
| F-12 | Shortcut keyboard (lihat §7.3) | P1 |
| F-13 | Riwayat/leaderboard publik di halaman utama (nama + skor) | P2 (lihat §12) |
| F-14 | Rekap admin dilindungi `ADMIN_KEY` + ekspor CSV | P2 (lihat §12) |

## 7. UX & Desain

### 7.1 Arah Visual — "Industrial Precision"
Konteks aplikasi ini adalah pabrik pengecoran nikel: logam cair, panas, dan keselamatan kerja. Desainnya mengambil karakter itu secara **halus dan elegan**, bukan meniru tampilan pabrik secara harfiah.

- **Palet**
  - Netral: *graphite* gelap (`#0F1115`) dan *paper* hangat (`#F6F4EF`) untuk mode terang.
  - Aksen utama: **molten amber** (`#F59E0B` → `#EA580C`, gradien halus seperti logam cair) untuk aksi utama dan progres.
  - Semantik: sukses *emerald* (`#10B981`), salah *rose* (`#E11D48`), ragu *sky* (`#0EA5E9`). Selalu ditemani ikon atau teks, tidak hanya warna.
  - Semua kombinasi teks memenuhi WCAG AA (4.5:1).
- **Tipografi (2 keluarga)**: *Space Grotesk* untuk heading dan angka skor (teknis dan tegas), *Inter* untuk teks soal (keterbacaan tinggi). Font CJK fallback: `"Noto Sans SC", system-ui` untuk teks 中文. Dimuat lewat `next/font`.
- **Skala**: tipe 12/14/16/18/24/32/48 px. Spasi berbasis 4 px. Teks soal minimal 18 px di HP.
- **Tema**: terang dan gelap (mengikuti sistem, bisa di-toggle), didefinisikan sebagai CSS variables di `@theme` Tailwind v4.
- **Detail elegan**: kartu dengan border tipis dan sedikit *noise/grain*, highlight amber pada opsi terpilih, nomor soal monospace, garis progres tipis di atas halaman yang "menyala" seperti logam panas.

### 7.2 Layar Utama

| Layar | Isi & Interaksi |
|---|---|
| **Landing `/`** | Hero singkat (judul ujian, divisi, jumlah soal per preset), input nama dengan fokus otomatis, kartu pilihan preset, tombol **Mulai Ujian**. Banner "Lanjutkan ujian, {nama}?" jika ada attempt aktif |
| **Ujian `/exam/[attemptId]`** | Header sticky: nama peserta, timer, progres `12/50`, indikator simpan. Kartu soal: badge tipe + level, nomor, teks, opsi. Footer sticky: Sebelumnya · Ragu-ragu · Berikutnya. Navigator: sidebar di desktop (≥ 1024 px), **bottom sheet** di HP |
| **Hasil `/result/[attemptId]`** | Cincin skor animasi (angka naik 0 → skor), label predikat, kartu statistik (Benar/Salah/Kosong/Durasi), bar per tipe soal, tombol **Lihat Pembahasan** dan **Ujian Lagi** |
| **Review `/result/[attemptId]/review`** | Daftar soal dengan penanda ✓/✗, opsi peserta vs kunci (hijau = kunci, merah = pilihan salah), filter "Semua / Salah / Kosong" |

### 7.3 Interaktivitas
- Animasi dengan **Motion** (`motion/react`): transisi antar soal (slide + fade, 200–250 ms), animasi pegas saat memilih opsi, *count-up* skor, stagger pada kartu hasil. Semua menghormati `prefers-reduced-motion`.
- Shortcut keyboard: `1–5` / `A–E` untuk memilih opsi, `B` / `S` untuk Benar/Salah, `←` / `→` untuk pindah soal, `R` untuk ragu-ragu, `Enter` untuk berikutnya. Ada tooltip daftar shortcut (ikon `?`).
- Gestur swipe kiri/kanan di HP untuk pindah soal.
- Haptic ringan (`navigator.vibrate`) saat memilih opsi di HP, jika didukung.
- Toast ringan untuk status autosave gagal/berhasil-ulang.
- Konfeti ringan di halaman hasil jika skor ≥ ambang lulus (lihat §12).

### 7.4 Aksesibilitas
- HTML semantik: `fieldset`/`legend` per soal, `role="radiogroup"` untuk Tunggal dan Benar/Salah, checkbox asli untuk Multi.
- Kata **"kecuali"**, **"tidak"**, dan **"dilarang"** dalam teks soal di-highlight (bold + garis bawah) untuk mengurangi salah baca.
- Fokus ring terlihat jelas, target sentuh minimal 44×44 px, navigator bisa dipakai dengan keyboard.
- Status jawaban di navigator memakai ikon/pola, tidak hanya warna.

### 7.5 Responsif
Mobile-first. Breakpoint: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Kartu soal maksimal ~720 px di desktop agar panjang baris nyaman dibaca.

---

## 8. Arsitektur Teknis

### 8.1 Prinsip Lapisan

```
UI (Server/Client Components)
   │  memanggil
   ▼
Server Actions (mutasi dari form)  /  Route Handlers  app/api/**  (JSON untuk fetch dari client)
   │  validasi input (Zod), terjemahkan error → response
   ▼
Services  src/server/services/**   ← logika bisnis: buat attempt, pilih soal, simpan jawaban, nilai
   │
   ▼
DAL  src/server/dal/**             ← satu-satunya lapisan yang menyentuh Prisma; return DTO aman
   │
   ▼
DB  src/server/db.ts               ← singleton PrismaClient + adapter pg
```

Aturan:
- File di `src/server/**` diawali `import "server-only"`. Client tidak bisa mengimpor DAL atau service.
- DAL **tidak pernah** mengembalikan `isCorrect` untuk query yang dipakai saat ujian. Ada DTO terpisah: `PublicQuestionDTO` (tanpa kunci) dan `ReviewQuestionDTO` (dengan kunci, hanya untuk attempt yang sudah submit).
- Validasi input di batas (action/route) memakai Zod. Service menerima tipe yang sudah tervalidasi.
- Error domain (`AttemptNotFound`, `AttemptLocked`, `TimeExpired`) adalah kelas error di `src/server/errors.ts`, dipetakan ke HTTP status di satu helper.
- Halaman ujian dan hasil memakai `dynamic` rendering (data per attempt). Landing boleh statis dengan data preset dari kode.

### 8.2 Struktur Folder

```
docs/
  PRD.md
prisma/
  schema.prisma
  migrations/
  seed/
    data/                   # bank soal sumber kebenaran: single / multiple / true-false .json
    seed.mts                # validasi Zod + upsert idempoten
    README.md               # level, groupKey, log koreksi, catatan SME
prisma.config.ts            # Prisma 7: datasource URL & seed command
src/
  app/
    layout.tsx
    page.tsx                         # landing
    exam/[attemptId]/page.tsx        # ruang ujian
    result/[attemptId]/page.tsx
    result/[attemptId]/review/page.tsx
    api/
      attempts/route.ts                       # POST  buat attempt
      attempts/[id]/route.ts                  # GET   state attempt (soal publik + jawaban)
      attempts/[id]/answers/route.ts          # PUT   simpan jawaban (autosave)
      attempts/[id]/submit/route.ts           # POST  submit & nilai
      attempts/[id]/result/route.ts           # GET   hasil (hanya setelah selesai)
      attempts/[id]/review/route.ts           # GET   pembahasan + kunci (hanya setelah selesai)
      health/route.ts                         # GET   cek koneksi DB
  components/
    ui/                     # primitif: Button, Card, Dialog, Sheet, Badge, Progress, Toast
    exam/                   # QuestionCard, OptionItem, TrueFalseToggle, Navigator, ExamHeader, SubmitDialog, Timer
    result/                 # ScoreRing, StatCard, TypeBreakdown, ReviewItem
  hooks/
    useAutosave.ts
    useExamKeyboard.ts
    useCountdown.ts
  lib/
    cn.ts
    domain.ts               # konstanta tipe/level/status soal (aman untuk client)
    random.ts               # shuffle + PRNG ber-seed (untuk tes)
    validation/             # skema Zod bersama (input form & API, bank soal)
    format.ts
  config/
    exam-presets.ts
  server/
    db.ts
    env.ts
    errors.ts               # AppError + pemetaan kode → HTTP status
    http.ts                 # handleRoute, parseJsonBody, parseAttemptId
    actions/
      start-exam.ts         # server action untuk form landing
    dal/
      questions.dal.ts
      attempts.dal.ts
    services/
      attempt.service.ts
      question-picker.ts    # pengacakan + aturan groupKey (pure)
      scoring.ts            # pure
  types/
    dto.ts
tests/
  scoring.test.ts
  question-picker.test.ts
  question-bank.test.ts     # validasi data seed + cocokkan 250 kunci
```

### 8.3 Model Data (Prisma)

```prisma
enum QuestionType { SINGLE MULTIPLE TRUE_FALSE }
enum QuestionLevel { LV1 LV2 LV3 GENERAL }
enum AttemptStatus { IN_PROGRESS SUBMITTED EXPIRED }

model Question {
  id        String        @id @default(cuid())
  number    Int           @unique            // nomor asli di dokumen (1–250)
  type      QuestionType
  level     QuestionLevel
  groupKey  String?                          // pengelompokan soal mirip/duplikat
  text      String
  textZh    String?
  isActive  Boolean       @default(true)
  options   Option[]
  attemptQuestions AttemptQuestion[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  @@index([type, level, isActive])
}

model Option {
  id         String   @id @default(cuid())
  questionId String
  label      String                          // "A".."E" | "BENAR"/"SALAH"
  text       String
  textZh     String?
  isCorrect  Boolean
  order      Int
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  @@unique([questionId, label])
}

model Attempt {
  id              String        @id @default(cuid())
  participantName String
  presetKey       String
  status          AttemptStatus @default(IN_PROGRESS)
  startedAt       DateTime      @default(now())
  expiresAt       DateTime?                 // null = tanpa timer
  submittedAt     DateTime?
  totalQuestions  Int
  correctCount    Int?
  wrongCount      Int?
  unansweredCount Int?
  score           Decimal?      @db.Decimal(5, 2)   // 0.00 – 100.00
  questions       AttemptQuestion[]
  @@index([status, startedAt])
}

model AttemptQuestion {
  id                String   @id @default(cuid())
  attemptId         String
  questionId        String
  position          Int                       // urutan tampil di sesi
  selectedOptionIds String[]                  // kosong = belum dijawab
  flagged           Boolean  @default(false)
  isCorrect         Boolean?                  // diisi saat submit
  answeredAt        DateTime?
  attempt           Attempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question          Question @relation(fields: [questionId], references: [id])
  @@unique([attemptId, questionId])
  @@unique([attemptId, position])
}
```

Catatan desain:
- **Snapshot soal per attempt** (`AttemptQuestion`) memastikan hasil dan review tetap konsisten walaupun bank soal diperbarui kemudian. Jika teks soal bisa berubah setelah ujian, pertimbangkan menyimpan snapshot teks juga (v2).
- `selectedOptionIds` berupa array Postgres. Validasi di service memastikan ID milik soal tersebut, maksimal 1 untuk SINGLE/TRUE_FALSE.
- `cuid` untuk `attemptId` sulit ditebak, karena tanpa login URL attempt berfungsi sebagai "kunci" akses.

### 8.4 Kontrak API

| Method & Path | Body / Respon | Catatan |
|---|---|---|
| `POST /api/attempts` | `{ name, presetKey }` → `201 { attemptId }` | Juga tersedia sebagai Server Action `startExam` (`src/server/actions`) untuk form landing |
| `GET /api/attempts/:id` | → `AttemptSessionDTO` (soal publik, jawaban, `remainingSeconds`) | Tanpa kunci. Attempt yang lewat batas waktu otomatis dinilai (`EXPIRED`), dan client diarahkan ke hasil jika status ≠ `IN_PROGRESS` |
| `PUT /api/attempts/:id/answers` | `{ questionId, selectedOptionIds, flagged? }` → `{ savedAt }` | Idempotent. `400 INVALID_ANSWER` (opsi bukan milik soal / >1 untuk Tunggal & B/S), `409 ATTEMPT_LOCKED`, `409 TIME_EXPIRED` |
| `POST /api/attempts/:id/submit` | → `AttemptResultDTO` | Idempotent dan aman terhadap submit bersamaan (status diubah lewat conditional update di dalam transaksi) |
| `GET /api/attempts/:id/result` | → `AttemptResultDTO` | `409 ATTEMPT_NOT_FINISHED` jika belum selesai |
| `GET /api/attempts/:id/review` | → `AttemptReviewDTO` (dengan `isCorrect`) | Hanya untuk attempt yang sudah selesai |

Validasi input untuk semua endpoint: Zod. Respon error berbentuk `{ error: { code, message, details? } }`, dengan `message` dalam Bahasa Indonesia yang siap ditampilkan. ID yang formatnya salah dilaporkan sebagai `404 ATTEMPT_NOT_FOUND`. Batas waktu diberi toleransi 5 detik untuk autosave terakhir.

**Paket ujian (implementasi):** `standar` (25/15/10, 60 menit), `lv1` dan `lv2` (25/15/10 dari level tsb + UMUM, 60 menit), `lv3` (30/10/10, karena LV3 tidak punya soal Multi/B-S sendiri, 60 menit), dan `lengkap` (250 soal, tanpa timer). Setiap preset diuji 300× terhadap bank soal asli agar selalu bisa terisi.

### 8.5 Database & Prisma 7 + Supabase
- Versi Prisma dikunci di **7.10.1** (`prisma` & `@prisma/client`), karena dist-tag `latest` CLI saat ini menunjuk ke 8.0.0-rc.
- Prisma 7 memakai generator `prisma-client` (output ke `src/generated/prisma`, di-gitignore) dan **driver adapter** `@prisma/adapter-pg`.
- Konfigurasi koneksi berada di `prisma.config.ts`, bukan di `schema.prisma`.
- Dua connection string Supabase, keduanya lewat **pooler IPv4** (`aws-0-ap-northeast-1.pooler.supabase.com`). Host direct `db.<ref>.supabase.co` hanya IPv6 dan tidak terjangkau dari jaringan dev maupun Vercel.
  - `DATABASE_URL` → **Transaction pooler** (port `6543`) untuk runtime di Vercel (serverless, banyak koneksi singkat). Dipakai oleh `@prisma/adapter-pg` di `src/server/db.ts`. Wajib `?sslmode=require&uselibpqcompat=true`: tanpa parameter, node-postgres **tidak memakai TLS**, sedangkan `sslmode=require` saja gagal karena CA Supabase tidak ada di trust store Node.
  - `DIRECT_URL` → **Session pooler** (port `5432`) untuk Prisma CLI (`migrate`, `studio`). Dipakai sebagai `datasource.url` di `prisma.config.ts` (Prisma 7 tidak lagi punya `directUrl`).
  - Peningkatan ke depan: `sslmode=verify-full` dengan sertifikat CA Supabase (Dashboard → Database → SSL) agar sertifikat server juga diverifikasi.
- `PrismaClient` dibuat sebagai singleton di `src/server/db.ts` (aman terhadap hot reload di dev).
- Tidak ada database lokal. Development langsung ke project Supabase (disarankan memakai project/branch terpisah untuk dev vs production, lihat §12).
- RLS Supabase: tabel diakses hanya lewat server (role Postgres dari connection string), tanpa Supabase client di browser. Aktifkan RLS tanpa policy pada tabel publik agar tidak bisa dibaca lewat anon key/Data API.

### 8.6 Environment Variables

| Var | Kegunaan |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler (runtime) |
| `DIRECT_URL` | Supabase direct/session (migrasi) |
| `ADMIN_KEY` | (P2) akses halaman rekap |

Disediakan `.env.example`. `.env*` tidak di-commit.

### 8.7 Dependensi Rencana

| Paket | Fungsi |
|---|---|
| `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg` | ORM + driver |
| `zod` (v4) | validasi |
| `motion` | animasi |
| `clsx`, `tailwind-merge` | helper `cn()` |
| `lucide-react` | ikon |
| `server-only` | proteksi import server |
| `vitest` | unit test service murni |
| `tsx` | menjalankan seed TypeScript |

UI primitif (Dialog, Sheet) dibuat sendiri di atas elemen native `<dialog>` atau Radix primitives. Keputusan diambil saat fase UI.

---

## 9. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Performa | LCP < 2.5 s di 4G. Pindah soal < 100 ms (tanpa round-trip: semua soal sesi dimuat sekali di awal) |
| Keamanan | Kunci jawaban tidak pernah terkirim sebelum submit. Validasi waktu dan status di server. Input disanitasi (Zod) |
| Keandalan | Autosave dengan retry. Submit idempotent. Seed idempotent |
| Aksesibilitas | WCAG 2.1 AA |
| Kompatibilitas | Chrome/Edge/Safari/Firefox 2 versi terakhir, Android Chrome, iOS Safari |
| Kualitas kode | TypeScript strict, ESLint bersih, unit test untuk `scoring` & `question-picker` & validasi data seed |

## 10. Deployment (Vercel)
1. Hubungkan repo GitHub ke Vercel dan set `DATABASE_URL` & `DIRECT_URL` di Environment Variables.
2. Build command: `prisma generate && next build` (lewat script `build`). Ini memastikan client tergenerate di Vercel.
3. Migrasi production dijalankan **manual / CI** dengan `prisma migrate deploy` (bukan saat build), lalu seed sekali dengan `prisma db seed`.
4. Region fungsi Vercel diset sama dengan region Supabase. Project ini berada di **`ap-northeast-1` (Tokyo)**, jadi region fungsi Vercel = **`hnd1`** (via `vercel.json` → `"regions": ["hnd1"]`).
5. Host direct `db.<ref>.supabase.co` hanya IPv6 dan Vercel tidak mendukung IPv6 keluar, jadi **runtime & migrasi wajib lewat pooler** (`aws-0-ap-northeast-1.pooler.supabase.com`).

## 11. Rencana Implementasi Bertahap

| Tahap | Lingkup | Selesai jika |
|---|---|---|
| **0. Fondasi** | Install dependensi, Prisma 7 + `prisma.config.ts`, koneksi Supabase, struktur folder, `cn`, design tokens & font | `prisma migrate dev` sukses ke Supabase; halaman kosong dengan tema tampil |
| **1. Bank soal** | Transkripsi 250 soal ke `questions.json`, skema Zod, seed idempotent, test validasi data | `prisma db seed` → 250 soal; test data hijau |
| **2. Domain & API** | DAL, services (`question-picker`, `scoring`, attempt), route handlers, server action | Unit test hijau; alur API lengkap teruji manual |
| **3. UI Ujian** | Landing, ruang ujian (3 tipe soal, navigator, autosave, ragu, submit, resume) | Ujian bisa dikerjakan end-to-end di HP & desktop |
| **4. UI Hasil** | Halaman hasil + review | Skor & pembahasan tampil benar |
| **5. Polish** | Animasi, shortcut, timer, toggle 中文, dark mode, a11y pass | Checklist §7 terpenuhi |
| **6. Deploy** | Vercel + env + migrate deploy + seed production | URL production berjalan |
| **7. (P2)** | Rekap admin / leaderboard (sesuai keputusan §12) | — |

## 12. Pertanyaan Terbuka (perlu keputusan)

1. **Paket ujian:** apakah preset default (50 soal: 25/15/10) sudah sesuai, atau ujian harus selalu memakai seluruh 250 soal?
2. **Level:** apakah peserta memilih level (LV1/LV2/LV3), atau semua level dicampur? Apakah pemetaan warna di §4.2 benar?
3. **Timer:** perlu batas waktu? Berapa menit per preset?
4. **Nilai lulus / KKM:** apakah ada ambang lulus (mis. 70%) yang ditampilkan di hasil?
5. **Multi Jawaban:** tetap all-or-nothing (default PRD ini), atau memakai nilai parsial?
6. **Pembahasan:** boleh langsung menampilkan kunci jawaban setelah submit? Jika peserta bisa mengulang tanpa batas, kunci bisa "dihafal".
7. **Rekap hasil:** perlu halaman rekap untuk HR/pengawas (dilindungi `ADMIN_KEY`) dan ekspor CSV? Perlu leaderboard publik?
8. **Identitas peserta:** cukup nama saja, atau perlu NIK/ID karyawan opsional agar rekap tidak ambigu (nama sama)?
9. **Bahasa UI:** Bahasa Indonesia saja, atau perlu toggle UI 中文 penuh (bukan hanya terjemahan soal)?
10. **Lingkungan Supabase:** satu project untuk dev & prod, atau dua project terpisah?
11. **Temuan data §4.4:** setuju dengan usulan perbaikan typo dan penanganan duplikat?
