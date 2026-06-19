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

    // Row 0: instruction 1
    const instr1 = [
      'Baris keempat adalah contoh, tidak perlu dihapus',
      ...Array(NUM_COLS - 1).fill(''),
    ];
    // Row 1: instruction 2
    const instr2 = [
      'Isikan mulai dari baris ke lima',
      ...Array(NUM_COLS - 1).fill(''),
    ];
    // Row 2: column header
    const header = [
      'Lantai',
      'Area / Sub Kategori',
      'Ruang',
      'Item / Perabot',
      'Pjg',
      'Lbr',
      'Tgi',
      'Vol',
      'Sat',
      'Jml',
      'Harga Sat',
      'Harga Total',
      'Keterangan',
    ];
    // Row 3: example (baris ketiga)
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

    const worksheet = XLSX.utils.aoa_to_sheet([
      instr1,
      instr2,
      header,
      example,
    ]);

    // Merge instruction rows across all columns
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: NUM_COLS - 1 } }, // instruction 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: NUM_COLS - 1 } }, // instruction 2
      // Dimensi (m) spanning Pjg/Lbr/Tgi in header row (cols 4-6)
      // removed — single header row; Pjg/Lbr/Tgi labels are self-explanatory
    ];

    const thin = { style: 'thin' };
    const border = { top: thin, bottom: thin, left: thin, right: thin };

    const instrStyle = {
      font: { bold: true, italic: true, color: { rgb: '7F6000' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFF2CC' } },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
    };

    const headerStyle = {
      border,
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };

    // Apply instruction style to rows 0 and 1
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!worksheet[ref]) worksheet[ref] = { t: 's', v: '' };
        worksheet[ref].s = { ...instrStyle };
      }
    }

    // Apply header style to row 2
    for (let c = 0; c < NUM_COLS; c++) {
      const ref = XLSX.utils.encode_cell({ r: 2, c });
      if (worksheet[ref]) worksheet[ref].s = { ...headerStyle };
    }

    // Apply light blue background to example row (row 3)
    const exampleStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
      alignment: { vertical: 'center' },
    };
    for (let c = 0; c < NUM_COLS; c++) {
      const ref = XLSX.utils.encode_cell({ r: 3, c });
      if (worksheet[ref]) worksheet[ref].s = { ...exampleStyle };
    }

    worksheet['!rows'] = [{ hpt: 18 }, { hpt: 18 }, { hpt: 22 }];

    worksheet['!cols'] = [
      { wch: 8 }, // Lantai
      { wch: 22 }, // Area / Sub Kategori
      { wch: 16 }, // Ruang
      { wch: 32 }, // Item / Perabot
      { wch: 7 }, // Pjg
      { wch: 7 }, // Lbr
      { wch: 7 }, // Tgi
      { wch: 8 }, // Vol
      { wch: 7 }, // Sat
      { wch: 6 }, // Jml
      { wch: 14 }, // Harga Sat
      { wch: 14 }, // Harga Total
      { wch: 44 }, // Keterangan
    ];

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
        // Skip: row 0 (instr1) + row 1 (instr2) + row 2 (header) + row 3 (contoh) = start from index 4
        const dataRows = allRows
          .slice(4)
          .filter((r) => r.some((v) => v != null && v !== ''));

        if (!dataRows.length) {
          toast.error('File Excel kosong atau tidak valid');
          setIsLoadingFile(false);
          return;
        }

        const parseNum = (val: any) =>
          val != null && val !== '' ? Number(val) : null;

        // Column order matches template: 0=Lantai, 1=Area/SubKat, 2=Ruang, 3=Item,
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
