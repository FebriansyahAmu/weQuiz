# Bank Soal — Casting Divisi Molding

Sumber kebenaran bank soal untuk weQuiz, ditranskripsi dari `CASTING + KUNCI JAWABAN.DOCX.pdf` (250 soal).

| File | Nomor | Jumlah | Format `answer` |
|---|---|---|---|
| `data/single.json` | 1–108 | 108 | huruf, mis. `"B"` |
| `data/multiple.json` | 109–183 | 75 | daftar huruf, mis. `["A", "C", "D"]` |
| `data/true-false.json` | 184–250 | 67 | `true` (Benar) / `false` (Salah) |

Field lain: `level` (`LV1` / `LV2` / `LV3` / `GENERAL`), `groupKey` (opsional), `textZh` / `optionsZh` (opsional, terjemahan Mandarin). Opsi diberi label A–E sesuai urutan array.

## Menjalankan

```bash
npm run db:seed   # validasi + upsert ke database (aman dijalankan berulang)
npm test          # validasi data + cocokkan 250 kunci dengan transkripsi kedua
```

Seed bersifat idempoten:
- Soal baru dimasukkan.
- Soal yang berubah diperbarui, dan ID opsi dipertahankan (riwayat jawaban menyimpan ID opsi).
- Soal yang dihapus dari file **dinonaktifkan**, tidak dihapus dari database.

Setiap perubahan pada kunci jawaban juga harus dilakukan di tabel kunci pada `tests/question-bank.test.ts`. Jika hanya salah satu yang diubah, tes akan gagal.

## Level

Dari keterangan warna di akhir dokumen sumber (LV1 merah, LV2 biru, LV3 maroon). Soal berwarna hitam diberi level `GENERAL`.

| Level | Nomor |
|---|---|
| LV1 | 1–50, 109–141, 157–171, 184–208, 224–238 |
| LV2 | 51–70, 142–156, 209–223 |
| LV3 | 71–90 |
| GENERAL | 91–108, 172–183, 239–250 |

## Grup soal mirip (`groupKey`)

Soal dengan `groupKey` yang sama menguji materi yang sama. Pengacak soal tidak akan memilih lebih dari satu soal per grup dalam satu sesi ujian.

| groupKey | Nomor |
|---|---|
| `mesin-berputar-perawatan` | 9, 118 |
| `risiko-laddle` | 10, 111 |
| `rantai-jatuh` | 16, 57 |
| `torch-pemeriksaan` | 26, 129 |
| `torch-sambungan` | 27, 60, 131 |
| `pipa-oksigen-lounder` | 28, 132 |
| `cungkil-besi-dingin` | 29, 64 |
| `rambut-helm` | 32, 152 |
| `pengawasan-pemuatan-nikel` | 37, 192 |
| `simper` | 39, 136, 248 |
| `kebocoran-lounder-utama` | 41, 196 |
| `line-cetakan-putus` | 42, 53, 201 |
| `dasar-saluran` | 46, 122 |
| `ketebalan-pasir-kuarsa` | 47, 125 |
| `balok-cetakan-lepas` | 55, 203 |
| `breaker-pemeriksaan` | 69, 139 |
| `apd-molding` | 70, 113 |
| `tujuan-apd` | 82, 150 |
| `pompa-rusak` | 84, 205 |
| `sabuk-pengaman` | 85, 153 |
| `prinsip-k3` | 92, 177 |
| `hak-perusahaan` | 104, 181 |
| `peraturan-perusahaan` | 106, 246 |
| `hak-karyawan` | 108, 179 |
| `loto-pemasang` | 116, 224 |
| `loto-parit` | 162, 184 |

## Koreksi terhadap dokumen sumber

Kunci jawaban **tidak ada yang diubah**. Koreksi hanya pada penulisan.

**Penanda kunci di dalam teks dihapus.** Contohnya awalan `(ABDE)` di no. 179–183, `【 √ 】` di no. 239–243, `[ B ]` (= Benar) di no. 244–245, dan `(√)` / `(X)` di no. 246–250.

**Ejaan:**
- disemprotkan (2), dikontrol (4), dialirkan (20), dilakukan (21, 25, 45), Meninggalkan (22)
- ke dalam (32), di lapangan (39, 194), ke atasan (42), dibersihkan / di tempat (44), di bawah (45, 92, 99, 100, 120), di dalam (47)
- memengaruhi (55), ke rumah sakit (77), cat (26), kacamata (70), Sembarang (74)
- berhubungan (112), tersangkut (128), Menggunakan (135), Berada / mengoperasikan (140), Pemeliharaan (157), Mampu (172)
- Cedera (178), menggunakan (180, 183), lokasi (192), tanpa (194), furnace (199), cair (201), harus (204), jalan napas / dan (207)
- sedimentasi (236, 237), hierarki (240), di mana (102, 245), di antaranya (106, 246), sanksi (247)
- risiko (10, 111, 120, 124, 128), kelembapan (125), lembap (170), aksesori (164), suplai (173)

**Istilah diseragamkan:**
- castabel → castable (6, 63, 72)
- tepping → tapping (17)
- laddel → laddle (50)
- londer / lunder / launder → lounder (132, 144, 193, 195, 198)
- "jalur patahan" → "jalur yang putus" (201)

**Kalimat dirapikan tanpa mengubah makna:** 25, 36, 43, 49, 56, 63, 71, 74, 77, 143, 187, 206, 240, 241.

**Format:**
- `. . .` menjadi `...`
- `1,5 meter` menjadi `1.5 meter` (132)
- `300mm` menjadi `300 mm` (51)
- Huruf kapital di awal opsi
- Opsi bilingual dipisah ke `options` dan `optionsZh` (mis. no. 107 `4 hari` / `4 天`)

**Terjemahan Mandarin:**
- 95a 入取 → 录取
- 100a 心里 → 心理
- 179a "有功有义务获得报仇…" → "员工有权获得工资或其他因工作所获得的报酬。"
- 179b 有义务 → 有权 (opsi tentang hak karyawan)
- 182e: di sumber, terjemahannya menyalin opsi d. Diganti dengan "公司有义务向员工提供合适的工作服。"

## Perlu ditinjau SME

| No. | Catatan |
|---|---|
| 10 | Opsi b "Kebanjiran". Di soal kembarannya (no. 111), opsi b adalah "Kebakaran" dan termasuk kunci. Kemungkinan typo, tetapi kunci no. 10 (A) tidak terpengaruh |
| 11 vs 43 | Jarak aman tabung oksigen dari api 5 m (no. 11), sedangkan semua tabung gas dari api terbuka 10 m (no. 43) |
| 140 | Opsi d "Berada di area mesin tanpa izin" juga terlihat sebagai larangan, tetapi tidak termasuk kunci (A, B, E) |
| 174 | Terjemahan opsi c "开玩笑边工作" kurang tepat (lebih tepat "边开玩笑边工作") |
