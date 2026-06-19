'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Download, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
// import * as XLSX from 'xlsx';
import * as XLSX from 'xlsx-js-style';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { projectV2Service } from '@/features/projects/services/project-v2-service';

interface ProjectItemImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export function ProjectItemImportDialog({
  open,
  onOpenChange,
  projectId,
}: ProjectItemImportDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) setFile(null);
  }, [open]);

  const handleDownloadTemplate = () => {
    const NUM_COLS = 14;
    const e = Array(NUM_COLS).fill(''); // empty row helper

    // helper: fill specific columns in an empty row
    const r = (cols: Record<number, string | number>) => {
      const row = [...e];
      for (const [k, v] of Object.entries(cols))
        row[Number(k)] = v as string | number;
      return row;
    };

    // ── Document header ──────────────────────────────────────────────────────
    // Row  0: top-right doc code (MKT / Rev)
    // Row  1: top-right doc code (001 / Terbit)
    // Row  2: empty
    // Row  3: "Kepada Yth."         | Nomor
    // Row  4: [Nama Penerima]        | Marketing
    // Row  5: [Jabatan]              | Perihal
    // Row  6: [Perusahaan / Instansi]
    // Row  7: [Alamat]               | Tanggal
    // Row  8: [Kota]
    // Row  9: empty
    // Row 10: Up : [Nama / Jabatan]
    // Row 11: empty
    // Row 12: Dengan hormat,
    // Row 13: empty
    // Row 14: body text
    // Row 15: "dengan perincian sebagai berikut :"
    // Row 16: empty
    // ── Column headers ───────────────────────────────────────────────────────
    // Row 17: main header  (with Dimensi(m) merge)
    // Row 18: sub-header   (Pjg | Lbr | Tgi)
    // ── Example ──────────────────────────────────────────────────────────────
    // Row 19: example data (light blue)
    // ── Data ─────────────────────────────────────────────────────────────────
    // Row 20+: user fills in here
    const CH1 = 17; // column-header row 1
    const CH2 = 18; // column-header row 2
    const EX = 19; // example row
    const FOOTER_START = 69; // footer after 49 empty data rows (20–68)

    const docRows = [
      r({ 12: 'MKT', 13: 'Rev : 00' }), // 0
      r({ 12: '001', 13: 'Terbit : 08/25' }), // 1
      [...e], // 2
      r({ 0: 'Kepada Yth.', 11: 'Nomor', 12: ': ............ ' }), // 3
      r({ 0: '[Nama Penerima]', 11: 'Marketing', 12: ': ............ ' }), // 4
      r({
        0: '[Jabatan / Posisi]',
        11: 'Perihal',
        12: ': ............',
      }), // 5
      r({ 0: '[Nama Perusahaan / Instansi]' }), // 6
      r({ 0: '[Alamat]', 11: 'Tanggal', 12: ': ............ ' }), // 7
      r({ 0: '[Kota & Kode Pos]' }), // 8
      [...e], // 9
      r({ 0: 'Up : [Nama / Jabatan]' }), // 10
      [...e], // 11
      r({ 0: 'Dengan hormat,' }), // 12
      [...e], // 13
      r({
        0: 'Bersama surat ini, kami dari PT. Dharma Putra Sejahtera Abadi, berkeinginan mengajukan Penawaran harga pengadaan [Nama Proyek]',
      }), // 14
      r({ 0: 'dengan perincian sebagai berikut :' }), // 15
      [...e], // 16
    ];

    const colHeader1 = [
      'No',
      'Lantai',
      'Area / Sub Kategori',
      'Ruang',
      'Item / Perabot',
      'Dimensi (m)',
      '',
      '',
      'Vol',
      'Sat',
      'Jml',
      'Harga Sat',
      'Harga Total',
      'Keterangan',
    ];
    const colHeader2 = [
      '',
      '',
      '',
      '',
      '',
      'Pjg',
      'Lbr',
      'Tgi',
      '',
      '',
      '',
      '',
      '',
      '',
    ];
    const example = [
      1,
      '4',
      'RAWAT INAP PADMA',
      'SELASAR',
      'PAPAN NAMA RUANG DAN NOMOR KAMAR',
      0.3,
      0.15,
      0.02,
      1.0,
      'UNIT',
      8,
      350000,
      2800000,
      'BB LAPIS HPL GOLD TEAK, AKRILIK HITAM TEBAL 1 CM, AKRILIK PUTIH 5 MM, STICKER PENAMAAN HITAM BASE SILVER CHROME, AKRILIK BENING 3 MM',
    ];

    const emptyDataRows = Array(49)
      .fill(null)
      .map(() => [...e]);
    const footerArr = [
      r({ 9: 'TOTAL', 11: '', 12: '' }), // FT0 idx 69
      r({ 9: 'DPP LAIN', 10: '(          x 11/12)', 11: '12%', 12: '' }), // FT1 idx 70
      r({ 9: 'GRANDTOTAL', 11: '', 12: '' }), // FT2 idx 71
      r({ 9: 'TERBILANG :', 10: '' }), // FT3 idx 72
      ...Array(13)
        .fill(null)
        .map(() => [...e]), // FT4-FT16 idx 73-85
      r({ 0: 'Catatan :' }), // FT17 idx 86
      r({ 0: '1. Harga diatas sudah termasuk Biaya pengiriman dan setting' }), // FT18 idx 87
      r({ 0: '2. Harga diatas sudah termasuk Pajak PPN.' }), // FT19 idx 88
      r({
        0: '3. Layanan desain disediakan secara gratis, tidak menambah nilai penawaran.',
      }), // FT20 idx 89
      [...e], // FT21 idx 90
      r({ 0: 'Tata cara pembayaran :' }), // FT22 idx 91
      r({
        0: 'Progres I (30%) : Alat Umum (Furniture) masih dalam proses produksi dan masih berada di lokasi rekanan / Vendor JV.',
      }), // FT23 idx 92
      r({
        0: 'Progres II (30%) : Alat Umum (Furniture) sebagian sudah terkirim dan terpasang di lokasi milik RS Hermina, dan sebagian lainnya masih dalam proses produksi dan masih berada di lokasi rekanan / Vendor  JV.',
      }), // FT24 idx 93
      r({
        0: 'Progres III (35%) : Alat Umum (Furniture) seluruhnya sudah terkirim dan terpasang di lokasi RS Hermina.',
      }), // FT25 idx 94
      r({
        0: 'Retensi (5%) : Tagihan setelah masa retensi selesai, yaitu 3 bulan setelah Alat Umum (Furniture) selesai terpasang 100% yang didasarkan oleh Berita Acara Serah Terima (BAST) dan telah di tandatangani oleh perwakilan RS Hermina dan rekanan / Vendor JV.',
      }), // FT26 idx 95
      [...e], // FT27 idx 96
      r({
        0: 'Demikian kami sampaikan penawaran harga ini, atas perhatian dan kepercayaan Bapak/Ibu kami ucapkan terima kasih.',
      }), // FT28 idx 97
      [...e], // FT29 idx 98
      [...e], // FT30 idx 99
      r({ 0: 'Hormat Kami,' }), // FT31 idx 100
      r({ 0: 'PT. Dharma Putra Sejahtera Abadi' }), // FT32 idx 101
      ...Array(5)
        .fill(null)
        .map(() => [...e]), // FT33-FT37 idx 102-106
      r({ 0: 'FX. Yosef Boyke Dharma, ST' }), // FT38 idx 107
      r({ 0: 'Direktur' }), // FT39 idx 108
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([
      ...docRows,
      colHeader1,
      colHeader2,
      example,
      ...emptyDataRows,
      ...footerArr,
    ]);

    // ── Merges ───────────────────────────────────────────────────────────────
    worksheet['!merges'] = [
      // Doc header — left text columns (0-8, +1 for No col)
      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }, // Kepada Yth.
      { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } }, // Nama Penerima
      { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } }, // Jabatan
      { s: { r: 6, c: 0 }, e: { r: 6, c: 8 } }, // Perusahaan
      { s: { r: 7, c: 0 }, e: { r: 7, c: 8 } }, // Alamat
      { s: { r: 8, c: 0 }, e: { r: 8, c: 8 } }, // Kota
      { s: { r: 10, c: 0 }, e: { r: 10, c: 8 } }, // Up
      { s: { r: 12, c: 0 }, e: { r: 12, c: 8 } }, // Dengan hormat
      { s: { r: 14, c: 0 }, e: { r: 14, c: 13 } }, // body text
      { s: { r: 15, c: 0 }, e: { r: 15, c: 8 } }, // perincian
      // Column headers (all shifted +1 for No col)
      { s: { r: CH1, c: 0 }, e: { r: CH2, c: 0 } }, // No
      { s: { r: CH1, c: 1 }, e: { r: CH2, c: 1 } }, // Lantai
      { s: { r: CH1, c: 2 }, e: { r: CH2, c: 2 } }, // Area / Sub Kat
      { s: { r: CH1, c: 3 }, e: { r: CH2, c: 3 } }, // Ruang
      { s: { r: CH1, c: 4 }, e: { r: CH2, c: 4 } }, // Item / Perabot
      { s: { r: CH1, c: 5 }, e: { r: CH1, c: 7 } }, // Dimensi (m)
      { s: { r: CH1, c: 8 }, e: { r: CH2, c: 8 } }, // Vol
      { s: { r: CH1, c: 9 }, e: { r: CH2, c: 9 } }, // Sat
      { s: { r: CH1, c: 10 }, e: { r: CH2, c: 10 } }, // Jml
      { s: { r: CH1, c: 11 }, e: { r: CH2, c: 11 } }, // Harga Sat
      { s: { r: CH1, c: 12 }, e: { r: CH2, c: 12 } }, // Harga Total
      { s: { r: CH1, c: 13 }, e: { r: CH2, c: 13 } }, // Keterangan
      // Footer financial box (all shifted +1)
      { s: { r: FOOTER_START, c: 9 }, e: { r: FOOTER_START, c: 10 } }, // TOTAL label
      { s: { r: FOOTER_START, c: 11 }, e: { r: FOOTER_START, c: 12 } }, // TOTAL value
      { s: { r: FOOTER_START + 2, c: 9 }, e: { r: FOOTER_START + 2, c: 10 } }, // GRANDTOTAL label
      { s: { r: FOOTER_START + 2, c: 11 }, e: { r: FOOTER_START + 2, c: 12 } }, // GRANDTOTAL value
      { s: { r: FOOTER_START + 3, c: 10 }, e: { r: FOOTER_START + 3, c: 12 } }, // TERBILANG value
    ];

    // ── Styles ───────────────────────────────────────────────────────────────
    const thin = { style: 'thin' };
    const border = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (row: number, col: number, style: object) => {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[ref]) worksheet[ref] = { t: 's', v: '' };
      worksheet[ref].s = style;
    };

    // Doc code block (rows 0-1, cols 10-11) — small table with border
    const docCodeStyle = {
      border,
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
    [
      [0, 12],
      [0, 13],
      [1, 12],
      [1, 13],
    ].forEach(([rr, cc]) => setStyle(rr, cc, docCodeStyle));

    // Recipient name: bold + underline
    setStyle(4, 0, { font: { bold: true, underline: true } });
    // Up line: bold italic underline
    setStyle(10, 0, { font: { bold: true, italic: true, underline: true } });
    // "dengan perincian": bold
    setStyle(15, 0, { font: { bold: true } });

    // Column header style
    const headerStyle = {
      border,
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };
    for (let rr = CH1; rr <= CH2; rr++) {
      for (let cc = 0; cc < NUM_COLS; cc++)
        setStyle(rr, cc, { ...headerStyle });
    }

    // Example row — light blue background
    for (let cc = 0; cc < NUM_COLS; cc++) {
      const ref = XLSX.utils.encode_cell({ r: EX, c: cc });
      if (worksheet[ref])
        worksheet[ref].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
          alignment: { vertical: 'center' },
        };
    }

    // ── Footer styles ─────────────────────────────────────────────────────────
    const FS = FOOTER_START;
    const boxLabel = {
      border,
      font: { bold: true },
      alignment: { vertical: 'center' },
    };
    const boxVal = { border, alignment: { vertical: 'center' } };

    // TOTAL (FS+0): cols 9-10 merged label, cols 11-12 merged value
    [9, 10].forEach((cc) => setStyle(FS, cc, boxLabel));
    [11, 12].forEach((cc) => setStyle(FS, cc, boxVal));

    // DPP LAIN (FS+1): col 9 label, col 10 formula hint, col 11 rate, col 12 value
    setStyle(FS + 1, 9, boxLabel);
    setStyle(FS + 1, 10, boxLabel);
    setStyle(FS + 1, 11, {
      border,
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    setStyle(FS + 1, 12, boxVal);

    // GRANDTOTAL (FS+2): cols 9-10 merged label, cols 11-12 merged value
    [9, 10].forEach((cc) => setStyle(FS + 2, cc, boxLabel));
    [11, 12].forEach((cc) => setStyle(FS + 2, cc, boxVal));

    // TERBILANG (FS+3): col 9 label, cols 10-12 merged value
    setStyle(FS + 3, 9, boxLabel);
    [10, 11, 12].forEach((cc) => setStyle(FS + 3, cc, boxVal));

    // Text section headers
    setStyle(FS + 17, 0, { font: { bold: true, underline: true } }); // Catatan
    setStyle(FS + 22, 0, { font: { bold: true, underline: true } }); // Tata cara pembayaran
    setStyle(FS + 32, 0, { font: { bold: true, underline: true } }); // PT. Dharma
    setStyle(FS + 38, 0, { font: { bold: true, underline: true } }); // FX. Yosef
    setStyle(FS + 39, 0, { font: { bold: true, underline: true } }); // Direktur

    // ── Column widths & row heights ───────────────────────────────────────────
    worksheet['!cols'] = [
      { wch: 5 }, // No
      { wch: 10 }, // Lantai
      { wch: 22 }, // Area / Sub Kategori
      { wch: 16 }, // Ruang
      { wch: 32 }, // Item / Perabot
      { wch: 7 }, // Pjg
      { wch: 7 }, // Lbr
      { wch: 7 }, // Tgi
      { wch: 8 }, // Vol
      { wch: 7 }, // Sat
      { wch: 6 }, // Jml
      { wch: 16 }, // Harga Sat
      { wch: 16 }, // Harga Total
      { wch: 44 }, // Keterangan
    ];
    worksheet['!rows'] = Array(CH1).fill({ hpt: 15 });
    worksheet['!rows'][CH1] = { hpt: 22 };
    worksheet['!rows'][CH2] = { hpt: 18 };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Item');
    XLSX.writeFile(workbook, 'Template_Import_Project_Item.xlsx', {
      cellStyles: true,
    });
    toast.success('Template Excel berhasil didownload');
  };

  const mutation = useMutation({
    mutationFn: (items: any[]) =>
      projectV2Service.createProjectItemsBulk(projectId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Data item berhasil diimpor');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Terjadi kesalahan saat mengimpor data'
      );
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Pilih file Excel terlebih dahulu');
      return;
    }

    setIsLoadingFile(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // header:1 returns raw arrays; data starts at row index 2 (after 2 header rows)
        type CellValue = string | number | boolean | null | undefined;
        const allRows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
          header: 1,
          raw: true,
          rawNumbers: true,
        });
        // Skip: 17 doc-header rows + 2 col-header rows + 1 example row = 20 rows
        const raw = allRows
          .slice(20)
          .filter((r) => r.some((v) => v != null && v !== ''));

        // Forward-fill merged cells for Lantai (col 1), Area/Sub Kat (col 2), Ruang (col 3)
        let lastLantai: CellValue = null;
        let lastSubKat: CellValue = null;
        let lastRuang: CellValue = null;
        const dataRows = raw.map((r) => {
          const row = [...r];
          if (row[1] != null && row[1] !== '') lastLantai = row[1];
          else row[1] = lastLantai;
          if (row[2] != null && row[2] !== '') lastSubKat = row[2];
          else row[2] = lastSubKat;
          if (row[3] != null && row[3] !== '') lastRuang = row[3];
          else row[3] = lastRuang;
          return row;
        });

        if (!dataRows.length) {
          toast.error('File Excel kosong atau tidak valid');
          setIsLoadingFile(false);
          return;
        }

        const parseNum = (val: any) =>
          val != null && val !== '' ? Number(val) : null;

        // Column order: 0=No, 1=Lantai, 2=Area/SubKat, 3=Ruang, 4=Item,
        // 5=Pjg, 6=Lbr, 7=Tgi, 8=Vol, 9=Sat, 10=Jml, 11=HargaSat, 12=HargaTotal, 13=Keterangan
        const items = dataRows
          .map((row) => ({
            lantai: row[1] != null ? String(row[1]) : '',
            sub_kategori: row[2] != null ? String(row[2]) : null,
            ruang: row[3] != null ? String(row[3]) : '',
            item: String(row[4] ?? '').trim(),
            panjang: parseNum(row[5]),
            lebar: parseNum(row[6]),
            tinggi: parseNum(row[7]),
            volume: parseNum(row[8]),
            satuan: row[9] != null ? String(row[9]) : 'UNIT',
            jumlah:
              row[10] != null && row[10] !== '' && row[10] !== false
                ? Number(row[10])
                : 1,
            harga_satuan: parseNum(row[11]),
            harga: parseNum(row[12]),
            keterangan: row[13] != null ? String(row[13]) : '',
            custom: false,
          }))
          .filter((item) => item.item);

        if (!items.length) {
          toast.error("Tidak ada baris valid (kolom 'item' harus terisi)");
          setIsLoadingFile(false);
          return;
        }

        mutation.mutate(items);
      } catch (err) {
        console.error(err);
        toast.error('Gagal membaca file Excel');
      } finally {
        setIsLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Import Item</DialogTitle>
            <DialogDescription>
              Import data item secara massal. Kolom wajib: <strong>item</strong>
              . Kolom lain bersifat opsional.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-6 py-4'>
            <div className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wider text-neutral-500'>
                Langkah 1: Download Template
              </Label>
              <Button
                type='button'
                variant='outline'
                className='w-full justify-start border-dashed border-blue-300 hover:bg-blue-50 text-blue-700'
                onClick={handleDownloadTemplate}
              >
                <Download className='mr-2 h-4 w-4 text-blue-600' />
                Download Template Excel
              </Button>
            </div>

            <div className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wider text-neutral-500'>
                Langkah 2: Upload File
              </Label>
              <Input
                id='excel-file'
                type='file'
                accept='.xlsx,.xls'
                onChange={handleFileChange}
                ref={fileInputRef}
                className='hidden'
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className='border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all flex flex-col items-center gap-2'
              >
                <Upload className='h-8 w-8 text-neutral-400' />
                {file ? (
                  <div className='flex items-center gap-1 text-green-700 text-sm font-semibold'>
                    <CheckCircle2 className='h-4 w-4' />
                    {file.name}
                  </div>
                ) : (
                  <>
                    <span className='text-sm text-neutral-600'>
                      Klik untuk memilih file Excel
                    </span>
                    <span className='text-xs text-neutral-400'>
                      Mendukung format .xlsx, .xls
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              disabled={!file || mutation.isPending || isLoadingFile}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              {(mutation.isPending || isLoadingFile) && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Import Data
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
