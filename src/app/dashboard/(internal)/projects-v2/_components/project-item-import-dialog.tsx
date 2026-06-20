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
    const NUM_COLS = 13;
    const e = Array(NUM_COLS).fill('');

    // Row 0: instruction 1
    // Row 1: instruction 2
    // Row 2: column header row 1 (CH1)
    // Row 3: column header row 2 (CH2)
    // Row 4: example row (EX)  ← "baris keempat"
    // Row 5+: user fills in here ← "baris ke lima"
    const CH1 = 2;
    const CH2 = 3;
    const EX = 4;

    const colHeader1 = [
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

    const instrRow1 = [
      'Baris ke-5 adalah contoh, jangan dihapus!',
      ...Array(NUM_COLS - 1).fill(''),
    ];
    const instrRow2 = [
      'Isikan mulai dari baris ke-6',
      ...Array(NUM_COLS - 1).fill(''),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([
      instrRow1,
      instrRow2,
      colHeader1,
      colHeader2,
      example,
      ...emptyDataRows,
    ]);

    // ── Merges ───────────────────────────────────────────────────────────────
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: NUM_COLS - 1 } }, // instruction 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: NUM_COLS - 1 } }, // instruction 2
      { s: { r: CH1, c: 0 }, e: { r: CH2, c: 0 } }, // Lantai
      { s: { r: CH1, c: 1 }, e: { r: CH2, c: 1 } }, // Area / Sub Kat
      { s: { r: CH1, c: 2 }, e: { r: CH2, c: 2 } }, // Ruang
      { s: { r: CH1, c: 3 }, e: { r: CH2, c: 3 } }, // Item / Perabot
      { s: { r: CH1, c: 4 }, e: { r: CH1, c: 6 } }, // Dimensi (m)
      { s: { r: CH1, c: 7 }, e: { r: CH2, c: 7 } }, // Vol
      { s: { r: CH1, c: 8 }, e: { r: CH2, c: 8 } }, // Sat
      { s: { r: CH1, c: 9 }, e: { r: CH2, c: 9 } }, // Jml
      { s: { r: CH1, c: 10 }, e: { r: CH2, c: 10 } }, // Harga Sat
      { s: { r: CH1, c: 11 }, e: { r: CH2, c: 11 } }, // Harga Total
      { s: { r: CH1, c: 12 }, e: { r: CH2, c: 12 } }, // Keterangan
    ];

    // ── Styles ───────────────────────────────────────────────────────────────
    const thin = { style: 'thin' };
    const border = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (row: number, col: number, style: object) => {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[ref]) worksheet[ref] = { t: 's', v: '' };
      worksheet[ref].s = style;
    };

    // Instruction rows — light yellow background, orange italic text
    const instrStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: 'FFF3CD' } },
      font: { italic: true, color: { rgb: 'E65100' } },
      alignment: { vertical: 'center' },
    };
    [0, 1].forEach((rr) => setStyle(rr, 0, instrStyle));

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

    // Example row — light blue background, center-align specific columns
    const exCenterCols = new Set([0, 4, 5, 6, 7, 9]);
    for (let cc = 0; cc < NUM_COLS; cc++) {
      const ref = XLSX.utils.encode_cell({ r: EX, c: cc });
      if (worksheet[ref])
        worksheet[ref].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
          alignment: {
            vertical: 'center',
            wrapText: true,
            ...(exCenterCols.has(cc) && { horizontal: 'center' }),
          },
        };
    }

    // ── Column widths & row heights ───────────────────────────────────────────
    worksheet['!cols'] = [
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
    worksheet['!rows'] = [{ hpt: 22 }, { hpt: 18 }];

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
        // Skip: 2 instruction rows + 2 col-header rows + 1 example row = 5 rows
        const raw = allRows
          .slice(5)
          .filter((r) => r.some((v) => v != null && v !== ''));

        // Forward-fill merged cells for Lantai (col 0), Area/Sub Kat (col 1), Ruang (col 2)
        let lastLantai: CellValue = null;
        let lastSubKat: CellValue = null;
        let lastRuang: CellValue = null;
        const dataRows = raw.map((r) => {
          const row = [...r];
          if (row[0] != null && row[0] !== '') lastLantai = row[0];
          else row[0] = lastLantai;
          if (row[1] != null && row[1] !== '') lastSubKat = row[1];
          else row[1] = lastSubKat;
          if (row[2] != null && row[2] !== '') lastRuang = row[2];
          else row[2] = lastRuang;
          return row;
        });

        if (!dataRows.length) {
          toast.error('File Excel kosong atau tidak valid');
          setIsLoadingFile(false);
          return;
        }

        const parseNum = (val: any) =>
          val != null && val !== '' ? Number(val) : null;

        // Column order: 0=Lantai, 1=Area/SubKat, 2=Ruang, 3=Item,
        // 4=Pjg, 5=Lbr, 6=Tgi, 7=Vol, 8=Sat, 9=Jml, 10=HargaSat, 11=HargaTotal, 12=Keterangan
        const items = dataRows
          .map((row) => ({
            lantai: row[0] != null ? String(row[0]) : '',
            sub_kategori: row[1] != null ? String(row[1]) : null,
            ruang: row[2] != null ? String(row[2]) : '',
            item: String(row[3] ?? '').trim(),
            panjang: parseNum(row[4]),
            lebar: parseNum(row[5]),
            tinggi: parseNum(row[6]),
            volume: parseNum(row[7]),
            satuan: row[8] != null ? String(row[8]) : 'UNIT',
            jumlah:
              row[9] != null && row[9] !== '' && row[9] !== false
                ? Number(row[9])
                : 1,
            harga_satuan: parseNum(row[10]),
            harga: parseNum(row[11]),
            keterangan: row[12] != null ? String(row[12]) : '',
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
