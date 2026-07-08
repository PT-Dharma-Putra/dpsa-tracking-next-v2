'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  FileText,
  Activity,
  ListChecks,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Upload,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Package,
  ClipboardCheck,
  Info,
  Calendar,
  User,
  MoreHorizontal,
  FileDown,
  Truck,
  BarChart3,
  History,
  Search,
  QrCode,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus, ClipboardList } from 'lucide-react';

import {
  projectV2Service,
  ProjectItemV2,
} from '@/features/projects/services/project-v2-service';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PengirimanFormDialog } from '@/app/dashboard/(internal)/projects-v2/pengiriman/_components/pengiriman-form-dialog';
import { PengirimanPerSpkFormDialog } from '@/app/dashboard/(internal)/projects-v2/pengiriman/_components/pengiriman-per-spk-form-dialog';
import {
  PengirimanService,
  Pengiriman,
} from '@/features/pengiriman/services/pengiriman-service';
import * as XLSX from 'xlsx-js-style';

export default function PerencanaanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  // Data Queries
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['project-v2-items', projectId],
    queryFn: () => projectV2Service.getProjectItems(projectId),
  });

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => projectV2Service.getDivisions(),
  });

  const { data: pics } = useQuery({
    queryKey: ['pics'],
    queryFn: () => projectV2Service.getPics(),
  });

  // Items Search State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showBelumTerkirim, setShowBelumTerkirim] = React.useState(false);

  // QR Code per-item State
  const [isItemQrDialogOpen, setIsItemQrDialogOpen] = React.useState(false);
  const [qrItem, setQrItem] = React.useState<ProjectItemV2 | null>(null);
  const [qrJumlah, setQrJumlah] = React.useState<string>('');

  // Mass Label Print State
  const [selectedLabelItemIds, setSelectedLabelItemIds] = React.useState<number[]>([]);
  const [isMassLabelDialogOpen, setIsMassLabelDialogOpen] = React.useState(false);
  const [massLabelConfig, setMassLabelConfig] = React.useState<Record<number, string>>({});

  const toggleSelectLabelItem = (id: number) => {
    setSelectedLabelItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllLabelItems = (checked: boolean) => {
    if (checked && items) {
      const filteredItems = items.filter((item) => {
        if (showBelumTerkirim) {
          const totalKeluar =
            item.detail_pengiriman?.reduce(
              (sum, d) => sum + Number(d.jumlah_keluar),
              0
            ) ?? 0;
          if (totalKeluar >= item.jumlah) return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.item?.toLowerCase().includes(q) ||
          (item.lantai ?? '').toLowerCase().includes(q) ||
          (item.ruang ?? '').toLowerCase().includes(q) ||
          (item.keterangan ?? '').toLowerCase().includes(q) ||
          (item.material_utama ?? '').toLowerCase().includes(q)
        );
      });
      setSelectedLabelItemIds(filteredItems.map(i => i.id));
    } else {
      setSelectedLabelItemIds([]);
    }
  };

  const openMassLabelDialog = () => {
    const initialConfig: Record<number, string> = {};
    selectedLabelItemIds.forEach(id => {
      const item = items?.find(i => i.id === id);
      initialConfig[id] = item ? item.jumlah.toString() : '';
    });
    setMassLabelConfig(initialConfig);
    setIsMassLabelDialogOpen(true);
  };

  const handlePrintMassLabel = () => {
    if (selectedLabelItemIds.length === 0 || !items) return;

    const selectedItems = items.filter(i => selectedLabelItemIds.includes(i.id));

    const spkYear = project?.spk?.tanggal_spk
      ? new Date(project.spk.tanggal_spk).getFullYear()
      : project?.created_at
      ? new Date(project.created_at).getFullYear()
      : '';
    const spkValue = [project?.spk?.nomor_spk, spkYear].filter(Boolean).join(' / ') || '-';

    const labelsData: string[] = [];

    selectedItems.forEach(item => {
      const customJumlah = massLabelConfig[item.id] ?? item.jumlah.toString();
      
      const rows: [string, string][] = [
        ['NAMA ITEM', item.item || '-'],
        ['UKURAN', `${item.panjang || '-'} x ${item.lebar || '-'} x ${item.tinggi || '-'}`],
        ['JUMLAH', customJumlah ? `${customJumlah} ${item.satuan || ''}`.trim() : '-'],
        ['RUANG', item.ruang || '-'],
        ['RUMAH SAKIT', project?.client?.name || '-'],
        ['NO. SPK/TAHUN', spkValue]
      ];

      const html = `
        <div class="label">
          <div class="hdr">
            <div class="logo"><img src="${window.location.origin}/Logo.png" alt="Logo"/></div>
            <div class="co">
              <p class="n">PT DHARMA PUTERA SEJAHTERA ABADI</p>
              <p class="it">Interior &amp; Furniture Manufaktur</p>
              <p>Jl. Matraman No. 88, Ringinsari, Maguwoharjo, Depok, Sleman, Yogyakarta</p>
              <p>Telepon : (0274) 2800089&nbsp;&nbsp;Fax : (0274) 433 2248</p>
              <p>E-mail : piutang.dpsa@gmail.com&nbsp;Website : www.dpm-jogja.com</p>
            </div>
            <div class="dc">
              <div class="dr">PROD</div><div class="dr b">003</div>
              <div class="db"><span>Rev:00</span><span>Terbit:<br>08/25</span></div>
            </div>
          </div>
          <div class="bd">
            <div class="info">
              ${rows
                .map(
                  ([l, v], ri) =>
                    `<div class="row${
                      ri === rows.length - 1 ? ' last' : ''
                    }"><div class="lbl">${l}</div><div class="sep">:</div><div class="val">${v}</div></div>`
                )
                .join('')}
            </div>
          </div>
        </div>`;
      labelsData.push(html);
    });

    const pages: string[][] = [];
    for (let i = 0; i < labelsData.length; i += 8) {
      pages.push(labelsData.slice(i, i + 8));
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Print Label Pengiriman Massal</title>
          <style>
            @page { size: A4 portrait; margin: 3mm; }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif;
              background: #fff;
            }
            * { box-sizing: border-box; }
            
            .pg {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-auto-rows: min-content;
              gap: 3mm;
              width: 100%;
              page-break-after: always;
              break-after: page;
            }
            .pg.last { page-break-after: auto; break-after: auto; }
            .empty { border: 1px dashed #ccc; }

            .label {
              width: 100%;
              height: auto;
              border: 1px solid #000;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              background: #fff;
              position: relative;
            }
            .hdr { display: flex; border-bottom: 1px solid #000; }
            .logo { width: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 4px; border-right: 1px solid #000; }
            .logo img { width: 34px; height: 34px; object-fit: contain; }
            .co { flex: 1; text-align: center; padding: 3px 5px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: center; }
            .co .n  { font-weight: 900; color: #1d4ed8; font-size: 8.5px; text-transform: uppercase; line-height: 1.2; margin: 0; }
            .co .it { font-style: italic; font-size: 7.5px; color: #525252; margin: 0; }
            .co p   { font-size: 7.5px; color: #525252; line-height: 1.3; margin: 0; }
            .dc { width: 58px; flex-shrink: 0; display: flex; flex-direction: column; text-align: center; font-size: 7.5px; }
            .dr { border-bottom: 1px solid #000; padding: 1px 2px; font-weight: 700; }
            .dr.b { font-size: 11px; }
            .db { display: flex; }
            .db span { flex: 1; padding: 1px 2px; line-height: 1.2; }
            .db span:first-child { border-right: 1px solid #000; }
            
            .bd {
              display: flex;
              flex: 1;
            }
            .info {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .row {
              display: flex;
              border-bottom: 1px solid #000;
            }
            .row.last { border-bottom: none; }
            .lbl {
              width: 32mm;
              font-weight: bold;
              font-size: 11px;
              padding: 8px 5px;
              border-right: 1px solid #000;
            }
            .sep {
              width: 5mm;
              text-align: center;
              padding: 8px 0;
              font-size: 11px;
              border-right: 1px solid #000;
            }
            .val {
              flex: 1;
              padding: 8px 5px;
              font-size: 11px;
            }
            
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${pages
            .map(
              (page, pi) => `
            <div class="pg${pi === pages.length - 1 ? ' last' : ''}">
              ${page.join('')}
              ${Array.from(
                { length: 8 - page.length },
                () => '<div class="empty"></div>'
              ).join('')}
            </div>`
            )
            .join('')}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openItemQrDialog = (item: ProjectItemV2) => {
    setQrItem(item);
    setQrJumlah(item.jumlah.toString());
    setIsItemQrDialogOpen(true);
  };

  const handlePrintItemQR = () => {
    if (!qrItem) return;

    const spkYear = project?.spk?.tanggal_spk
      ? new Date(project.spk.tanggal_spk).getFullYear()
      : project?.created_at
      ? new Date(project.created_at).getFullYear()
      : '';
    const spkValue =
      [project?.spk?.nomor_spk, spkYear].filter(Boolean).join(' / ') || '-';

    // Builds one label cell
    const makeLabelHTML = () => {
      const rows: [string, string][] = [
        ['NAMA ITEM', qrItem.item || '-'],
        [
          'UKURAN',
          `${qrItem.panjang || '-'} x ${qrItem.lebar || '-'} x ${
            qrItem.tinggi || '-'
          }`,
        ],
        ['JUMLAH', qrJumlah ? `${qrJumlah} ${qrItem.satuan || ''}`.trim() : '-'],
        ['RUANG', qrItem.ruang || '-'],
        ['RUMAH SAKIT', project?.client?.name || '-'],
        ['NO. SPK/TAHUN', spkValue]
      ];

      return `
        <div class="label">
          <div class="hdr">
            <div class="logo"><img src="${
              window.location.origin
            }/Logo.png" alt="Logo"/></div>
            <div class="co">
              <p class="n">PT DHARMA PUTERA SEJAHTERA ABADI</p>
              <p class="it">Interior &amp; Furniture Manufaktur</p>
              <p>Jl. Matraman No. 88, Ringinsari, Maguwoharjo, Depok, Sleman, Yogyakarta</p>
              <p>Telepon : (0274) 2800089&nbsp;&nbsp;Fax : (0274) 433 2248</p>
              <p>E-mail : piutang.dpsa@gmail.com&nbsp;Website : www.dpm-jogja.com</p>
            </div>
            <div class="dc">
              <div class="dr">PROD</div><div class="dr b">003</div>
              <div class="db"><span>Rev:00</span><span>Terbit:<br>08/25</span></div>
            </div>
          </div>
          <div class="bd">
            <div class="info">
              ${rows
                .map(
                  ([l, v], ri) =>
                    `<div class="row${
                      ri === rows.length - 1 ? ' last' : ''
                    }"><div class="lbl">${l}</div><div class="sep">:</div><div class="val">${v}</div></div>`
                )
                .join('')}
            </div>
          </div>
        </div>`;
    };

    const labelsData = [makeLabelHTML()];

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label Produksi</title>
          <style>
            @page { size: auto; margin: 3mm; }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            * { box-sizing: border-box; }
            
            .label {
              width: 100mm;
              height: auto;
              border: 1px solid #000;
              margin: 4px auto;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              background: #fff;
              position: relative;
            }
            .hdr { display: flex; border-bottom: 1px solid #000; }
            .logo { width: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 4px; border-right: 1px solid #000; }
            .logo img { width: 34px; height: 34px; object-fit: contain; }
            .co { flex: 1; text-align: center; padding: 3px 5px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: center; }
            .co .n  { font-weight: 900; color: #1d4ed8; font-size: 8.5px; text-transform: uppercase; line-height: 1.2; margin: 0; }
            .co .it { font-style: italic; font-size: 7.5px; color: #525252; margin: 0; }
            .co p   { font-size: 7.5px; color: #525252; line-height: 1.3; margin: 0; }
            .dc { width: 58px; flex-shrink: 0; display: flex; flex-direction: column; text-align: center; font-size: 7.5px; }
            .dr { border-bottom: 1px solid #000; padding: 1px 2px; font-weight: 700; }
            .dr.b { font-size: 11px; }
            .db { display: flex; }
            .db span { flex: 1; padding: 1px 2px; line-height: 1.2; }
            .db span:first-child { border-right: 1px solid #000; }
            
            .bd {
              display: flex;
              flex: 1;
            }
            .info {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .row {
              display: flex;
              border-bottom: 1px solid #000;
            }
            .row.last { border-bottom: none; }
            .lbl {
              width: 32mm;
              font-weight: bold;
              font-size: 11px;
              padding: 8px 5px;
              border-right: 1px solid #000;
            }
            .sep {
              width: 5mm;
              text-align: center;
              padding: 8px 0;
              font-size: 11px;
              border-right: 1px solid #000;
            }
            .val {
              flex: 1;
              padding: 8px 5px;
              font-size: 11px;
            }
            .qr {
              width: 26mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2px;
            }
            .qr svg { width: 20mm; height: 20mm; }
            .qr p { 
              margin: 2px 0 0; 
              font-size: 8px; 
              font-family: monospace;
              font-weight: bold; 
            }
            
            @media print {
              body { padding: 3mm; background: none; }
              .label { margin: 0; box-shadow: none; border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          ${labelsData.join('')}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportBelumTerkirim = () => {
    const belumTerkirimItems = (items ?? []).filter((item) => {
      const totalKeluar =
        item.detail_pengiriman?.reduce(
          (sum, d) => sum + Number(d.jumlah_keluar),
          0
        ) ?? 0;
      return totalKeluar < item.jumlah;
    });

    if (belumTerkirimItems.length === 0) {
      toast.error('Tidak ada item yang belum terkirim untuk diekspor');
      return;
    }

    const wb = XLSX.utils.book_new();

    const headerStyle = {
      font: { bold: true, sz: 10 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
      fill: { fgColor: { rgb: 'F5F5F5' } },
    };

    const dataStyleCenter = {
      font: { sz: 10 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const dataStyleLeft = {
      font: { sz: 10 },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const wsData: any[][] = [
      [
        { v: 'NO', t: 's', s: headerStyle },
        { v: 'LANTAI', t: 's', s: headerStyle },
        { v: 'RUANG', t: 's', s: headerStyle },
        { v: 'NO. SPK', t: 's', s: headerStyle },
        { v: 'ITEM/PERABOT', t: 's', s: headerStyle },
        { v: 'DIMENSI (METER)', t: 's', s: headerStyle },
        '',
        '',
        { v: 'VOL', t: 's', s: headerStyle },
        { v: 'SAT', t: 's', s: headerStyle },
        { v: 'JML', t: 's', s: headerStyle },
        { v: 'KET', t: 's', s: headerStyle },
      ],
      [
        '',
        '',
        '',
        '',
        '',
        { v: 'P', t: 's', s: headerStyle },
        { v: 'L', t: 's', s: headerStyle },
        { v: 'T', t: 's', s: headerStyle },
        '',
        '',
        '',
        '',
      ],
    ];

    belumTerkirimItems.forEach((item, idx) => {
      const totalKeluar =
        item.detail_pengiriman?.reduce(
          (sum, d) => sum + Number(d.jumlah_keluar),
          0
        ) ?? 0;
      const sisaJml = item.jumlah - totalKeluar;

      wsData.push([
        { v: idx + 1, t: 'n', s: dataStyleCenter },
        { v: item.lantai || '-', t: 's', s: dataStyleCenter },
        { v: item.ruang || '-', t: 's', s: dataStyleLeft },
        {
          v: project?.spk_number || project?.spk?.nomor_spk || '-',
          t: 's',
          s: dataStyleCenter,
        },
        { v: item.item || '-', t: 's', s: dataStyleLeft },
        { v: item.panjang || '-', t: 's', s: dataStyleCenter },
        { v: item.lebar || '-', t: 's', s: dataStyleCenter },
        { v: item.tinggi || '-', t: 's', s: dataStyleCenter },
        { v: item.volume || '-', t: 's', s: dataStyleCenter },
        { v: item.satuan || '-', t: 's', s: dataStyleCenter },
        {
          v: sisaJml,
          t: 'n',
          s: { ...dataStyleCenter, font: { bold: true, sz: 10 } },
        },
        { v: item.keterangan || '-', t: 's', s: dataStyleLeft },
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
      { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
      { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } },
      { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },
      { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } },
      { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } },
      { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } },
    ];

    ws['!cols'] = [
      { wch: 5 }, // NO
      { wch: 10 }, // LANTAI
      { wch: 20 }, // RUANG
      { wch: 15 }, // SPK
      { wch: 30 }, // ITEM
      { wch: 8 }, // P
      { wch: 8 }, // L
      { wch: 8 }, // T
      { wch: 8 }, // VOL
      { wch: 10 }, // SAT
      { wch: 8 }, // JML
      { wch: 20 }, // KET
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Belum Terkirim');
    const clientName = project?.client?.name || '';
    const safeClientName = clientName.replace(/[^a-zA-Z0-9 _-]/g, '');
    const fileName = `Belum Terkirim ${safeClientName}`.trim() + '.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  // Gambar Kerja State
  const [isGkDialogOpen, setIsGkDialogOpen] = React.useState(false);
  const [gkItem, setGkItem] = React.useState<ProjectItemV2 | null>(null);
  const [gkFile, setGkFile] = React.useState<File | null>(null);
  const [gkStart, setGkStart] = React.useState<string>('');
  const [gkEnd, setGkEnd] = React.useState<string>('');

  const uploadGkMutation = useMutation({
    mutationFn: (payload: {
      file?: File;
      tanggal_mulai?: string;
      tanggal_selesai?: string;
    }) => projectV2Service.uploadGambarKerja(gkItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Gambar Kerja updated');
      setIsGkDialogOpen(false);
      setGkFile(null);
    },
    onError: () => {
      toast.error('Failed to update Gambar Kerja');
    },
  });

  const handleGkUpload = () => {
    if (!gkItem) return;
    uploadGkMutation.mutate({
      file: gkFile || undefined,
      tanggal_mulai: gkStart || undefined,
      tanggal_selesai: gkEnd || undefined,
    });
  };

  const openGkUpload = (item: ProjectItemV2) => {
    setGkItem(item);
    setGkStart(item.gambar_kerja?.tanggal_mulai || '');
    setGkEnd(item.gambar_kerja?.tanggal_selesai || '');
    setGkFile(null);
    setIsGkDialogOpen(true);
  };

  // Dokubah State
  const [isDokubahDialogOpen, setIsDokubahDialogOpen] = React.useState(false);
  const [dokubahFile, setDokubahFile] = React.useState<File | string | null>(
    null
  );
  const [dokubahRekapFile, setDokubahRekapFile] = React.useState<
    File | string | null
  >(null);
  const [dokubahStart, setDokubahStart] = React.useState<string>('');
  const [dokubahEnd, setDokubahEnd] = React.useState<string>('');

  const uploadDokubahMutation = useMutation({
    mutationFn: (payload: {
      file?: File | string;
      file_rekap_dokubah?: File | string;
      tanggal_mulai?: string;
      tanggal_selesai?: string;
    }) => projectV2Service.uploadDokubah(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects-v2', projectId],
      });
      toast.success('Dokubah updated');
      setIsDokubahDialogOpen(false);
      setDokubahFile(null);
      setDokubahRekapFile(null);
    },
    onError: () => {
      toast.error('Failed to update Dokubah');
    },
  });

  const handleDokubahUpload = () => {
    uploadDokubahMutation.mutate({
      file: dokubahFile || undefined,
      file_rekap_dokubah: dokubahRekapFile || undefined,
      tanggal_mulai: dokubahStart || undefined,
      tanggal_selesai: dokubahEnd || undefined,
    });
  };

  const openDokubahUpload = () => {
    setDokubahStart(project?.dokubah?.tanggal_mulai || '');
    setDokubahEnd(project?.dokubah?.tanggal_selesai || '');
    setDokubahFile(project?.dokubah?.file || null);
    setDokubahRekapFile(project?.dokubah?.file_rekap_dokubah || null);
    setIsDokubahDialogOpen(true);
  };

  // Stok Material State
  const [isStokDialogOpen, setIsStokDialogOpen] = React.useState(false);
  const [stokItem, setStokItem] = React.useState<ProjectItemV2 | null>(null);
  const [stokMenerima, setStokMenerima] = React.useState<string>('');
  const [stokKeluar, setStokKeluar] = React.useState<string>('');
  const [stokPicId, setStokPicId] = React.useState<string>('');
  const [stokStatus, setStokStatus] = React.useState<string>('');
  const [stokDeskripsiBelumLengkap, setStokDeskripsiBelumLengkap] =
    React.useState<string>('');
  const [stokPicOpen, setStokPicOpen] = React.useState(false);
  const [isManualPic, setIsManualPic] = React.useState(false);
  const [newPicName, setNewPicName] = React.useState('');
  const [newPicJabatan, setNewPicJabatan] = React.useState('');

  const updateStokMutation = useMutation({
    mutationFn: (payload: {
      ketersediaan_stok?: string;
      tanggal_menerima_dokubah?: string;
      tanggal_keluar?: string;
      pic_id?: number;
      new_pic_name?: string;
      new_pic_jabatan?: string;
      deskripsi_belum_lengkap?: string;
    }) => projectV2Service.updateBahanBaku(stokItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Stok Material updated');
      setIsStokDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update Stok Material');
    },
  });

  const handleStokUpdate = () => {
    if (!stokItem) return;
    updateStokMutation.mutate({
      ketersediaan_stok: stokStatus || undefined,
      tanggal_menerima_dokubah: stokMenerima || undefined,
      tanggal_keluar: stokKeluar || undefined,
      pic_id: isManualPic
        ? undefined
        : stokPicId
        ? parseInt(stokPicId)
        : undefined,
      new_pic_name: isManualPic ? newPicName : undefined,
      new_pic_jabatan: isManualPic ? newPicJabatan : undefined,
      deskripsi_belum_lengkap:
        stokStatus === 'Belum Lengkap' ? stokDeskripsiBelumLengkap : '',
    });
  };

  const openStokDialog = (item: ProjectItemV2) => {
    setStokItem(item);
    setStokStatus(item.bahan_baku?.ketersediaan_stok || '');
    setStokMenerima(item.bahan_baku?.tanggal_menerima_dokubah || '');
    setStokKeluar(item.bahan_baku?.tanggal_keluar || '');
    setStokPicId(item.bahan_baku?.pic_id?.toString() || '');
    setStokDeskripsiBelumLengkap(
      item.bahan_baku?.deskripsi_belum_lengkap || ''
    );
    setIsManualPic(false);
    setNewPicName('');
    setNewPicJabatan('');
    setIsStokDialogOpen(true);
  };

  // Barang Jadi Masuk State
  const [isBjDialogOpen, setIsBjDialogOpen] = React.useState(false);
  const [bjItem, setBjItem] = React.useState<ProjectItemV2 | null>(null);
  const [bjTanggal, setBjTanggal] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [bjJumlah, setBjJumlah] = React.useState<number>(0);
  const [bjFile, setBjFile] = React.useState<File | null>(null);

  const updateBjMutation = useMutation({
    mutationFn: (payload: {
      tanggal: string;
      jumlah: number;
      file?: File | null;
    }) => projectV2Service.updateBarangJadiMasuk(bjItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Barang Masuk recorded');
      setIsBjDialogOpen(false);
      setBjJumlah(0);
      setBjFile(null);
    },
    onError: () => {
      toast.error('Failed to record Barang Masuk');
    },
  });

  const handleBjUpdate = () => {
    if (!bjItem) return;

    const currentTotal =
      bjItem.barang_jadi_masuk?.reduce((sum, bj) => sum + bj.jumlah, 0) || 0;
    if (currentTotal + bjJumlah > bjItem.jumlah) {
      toast.error(
        `Total barang (${
          currentTotal + bjJumlah
        }) tidak boleh melebihi jumlah order (${bjItem.jumlah})`
      );
      return;
    }

    updateBjMutation.mutate({
      tanggal: bjTanggal,
      jumlah: bjJumlah,
      file: bjFile,
    });
  };

  const openBjDialog = (item: ProjectItemV2) => {
    setBjItem(item);
    setBjJumlah(0);
    setBjFile(null);
    setIsBjDialogOpen(true);
  };

  // Barang Jadi Terpacking State
  const [isPackingDialogOpen, setIsPackingDialogOpen] = React.useState(false);
  const [packingItem, setPackingItem] = React.useState<ProjectItemV2 | null>(
    null
  );
  const [packingTanggal, setPackingTanggal] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [packingJumlah, setPackingJumlah] = React.useState<number>(0);

  const updatePackingMutation = useMutation({
    mutationFn: (payload: { tanggal: string; jumlah: number }) =>
      projectV2Service.updateBarangJadiTerpacking(packingItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Packing recorded');
      setIsPackingDialogOpen(false);
      setPackingJumlah(0);
    },
    onError: () => {
      toast.error('Failed to record Packing');
    },
  });

  const handlePackingUpdate = () => {
    if (!packingItem) return;

    const currentTotal =
      packingItem.barang_jadi_terpacking?.reduce(
        (sum, p) => sum + p.jumlah,
        0
      ) || 0;
    if (currentTotal + packingJumlah > packingItem.jumlah) {
      toast.error(
        `Total packing (${
          currentTotal + packingJumlah
        }) tidak boleh melebihi jumlah order (${packingItem.jumlah})`
      );
      return;
    }

    updatePackingMutation.mutate({
      tanggal: packingTanggal,
      jumlah: packingJumlah,
    });
  };

  const openPackingDialog = (item: ProjectItemV2) => {
    setPackingItem(item);
    setPackingJumlah(0);
    setIsPackingDialogOpen(true);
  };

  // Order Gambar Kerja State
  const [isOrderGkDialogOpen, setIsOrderGkDialogOpen] = React.useState(false);
  const [orderGkFile, setOrderGkFile] = React.useState<File | null>(null);
  const [orderGkTarget, setOrderGkTarget] = React.useState<string>('');
  const [pakaiGambar, setPakaiGambar] = React.useState<boolean>(true);

  const uploadOrderGkMutation = useMutation({
    mutationFn: (payload: {
      file: File | null;
      target_selesai: string | null;
      pakai_gambar: number;
    }) =>
      projectV2Service.uploadOrderGambarKerja(
        projectId,
        payload.file,
        payload.target_selesai,
        payload.pakai_gambar
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Order Gambar Kerja uploaded');
      setIsOrderGkDialogOpen(false);
      setOrderGkFile(null);
      setOrderGkTarget('');
      setPakaiGambar(true);
    },
    onError: () => {
      toast.error('Failed to upload Order Gambar Kerja');
    },
  });

  const handleOrderGkUpload = () => {
    if (pakaiGambar && (!orderGkFile || !orderGkTarget)) return;
    uploadOrderGkMutation.mutate({
      file: pakaiGambar ? orderGkFile : null,
      target_selesai: pakaiGambar ? orderGkTarget : null,
      pakai_gambar: pakaiGambar ? 1 : 0,
    });
  };

  // Order Produksi State
  const [isOrderProduksiDialogOpen, setIsOrderProduksiDialogOpen] =
    React.useState(false);
  const [orderProduksiFile, setOrderProduksiFile] = React.useState<File | null>(
    null
  );
  const [orderProduksiTarget, setOrderProduksiTarget] =
    React.useState<string>('');

  const uploadOrderProduksiMutation = useMutation({
    mutationFn: (payload: { file: File; target_selesai: string }) =>
      projectV2Service.uploadOrderProduksi(
        projectId,
        payload.file,
        payload.target_selesai
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2', projectId] });
      toast.success('Order Produksi submitted successfully');
      setIsOrderProduksiDialogOpen(false);
      setOrderProduksiFile(null);
      setOrderProduksiTarget('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit order');
    },
  });

  const handleOrderProduksiUpload = () => {
    if (!orderProduksiFile || !orderProduksiTarget) {
      toast.error('Please select a file and target date');
      return;
    }
    uploadOrderProduksiMutation.mutate({
      file: orderProduksiFile,
      target_selesai: orderProduksiTarget,
    });
  };

  const [editingDivisiItemId, setEditingDivisiItemId] = React.useState<
    number | null
  >(null);

  const updateItemDivisiMutation = useMutation({
    mutationFn: ({ itemId, divisiId }: { itemId: number; divisiId: number }) =>
      projectV2Service.updateProjectItem(itemId, { divisi_id: divisiId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Division assigned successfully');
      setEditingDivisiItemId(null);
    },
    onError: () => {
      toast.error('Failed to assign division');
    },
  });

  const [isSphCollapsed, setIsSphCollapsed] = React.useState(true);
  const [isDivisiCollapsed, setIsDivisiCollapsed] = React.useState(true);
  const [isGkCollapsed, setIsGkCollapsed] = React.useState(true);
  const [isDokubahCollapsed, setIsDokubahCollapsed] = React.useState(true);
  const [isStokCollapsed, setIsStokCollapsed] = React.useState(true);
  const [isBjCollapsed, setIsBjCollapsed] = React.useState(true);
  const [isProduksiCollapsed, setIsProduksiCollapsed] = React.useState(true);
  const [isShipCollapsed, setIsShipCollapsed] = React.useState(true);
  const [isPengirimanDialogOpen, setIsPengirimanDialogOpen] =
    React.useState(false);
  const [isPengirimanPerSpkDialogOpen, setIsPengirimanPerSpkDialogOpen] =
    React.useState(false);
  const [editingPengirimanPerSpk, setEditingPengirimanPerSpk] =
    React.useState<Pengiriman | null>(null);

  const spkId = project?.spk?.id;

  const [suratJalanDialogOpen, setSuratJalanDialogOpen] = React.useState(false);
  const [suratJalanPengirimanId, setSuratJalanPengirimanId] = React.useState<
    number | null
  >(null);
  const [previewSjDialogOpen, setPreviewSjDialogOpen] = React.useState(false);
  const [previewSjUrl, setPreviewSjUrl] = React.useState<string | null>(null);
  const [previewSjPengirimanId, setPreviewSjPengirimanId] = React.useState<number | null>(null);
  const [suratJalanFile, setSuratJalanFile] = React.useState<File | null>(null);

  const updateSuratJalanMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      PengirimanService.updateSuratJalan(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pengiriman-per-spk', spkId],
      });
      toast.success('Surat jalan berhasil disimpan');
      setSuratJalanDialogOpen(false);
      setSuratJalanFile(null);
    },
    onError: () => toast.error('Gagal menyimpan surat jalan'),
  });

  const [setrimDialogOpen, setSetrimDialogOpen] = React.useState(false);
  const [setrimPengirimanId, setSetrimPengirimanId] = React.useState<
    number | null
  >(null);
  const [previewSetrimDialogOpen, setPreviewSetrimDialogOpen] = React.useState(false);
  const [previewSetrimUrl, setPreviewSetrimUrl] = React.useState<string | null>(null);
  const [previewSetrimPengirimanId, setPreviewSetrimPengirimanId] = React.useState<number | null>(null);
  const [setrimFile, setSetrimFile] = React.useState<File | null>(null);

  const updateSetrimMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      PengirimanService.updateSetrim(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pengiriman-per-spk', spkId],
      });
      toast.success('Setrim berhasil disimpan');
      setSetrimDialogOpen(false);
      setSetrimFile(null);
    },
    onError: () => toast.error('Gagal menyimpan setrim'),
  });

  const { data: pengirimanPerSpkData } = useQuery({
    queryKey: ['pengiriman-per-spk', spkId],
    queryFn: () =>
      PengirimanService.getPengiriman({ spk_id: spkId, per_page: 100 }),
    enabled: !!spkId,
  });
  const [isKeluarCollapsed, setIsKeluarCollapsed] = React.useState(true);
  const [isBelumSettingCollapsed, setIsBelumSettingCollapsed] =
    React.useState(true);
  const [isSettingCollapsed, setIsSettingCollapsed] = React.useState(true);

  // View Produksi State
  const [isProduksiViewOpen, setIsProduksiViewOpen] = React.useState(false);
  const [produksiViewItem, setProduksiViewItem] =
    React.useState<ProjectItemV2 | null>(null);

  // Edit Dimensi State
  const [isDimDialogOpen, setIsDimDialogOpen] = React.useState(false);
  const [dimItem, setDimItem] = React.useState<ProjectItemV2 | null>(null);
  const [dimData, setDimData] = React.useState({
    volume: 0,
    panjang: 0,
    lebar: 0,
    tinggi: 0,
    satuan: '',
    jumlah: 0,
  });

  // Auto-calculate Volume based on Satuan
  React.useEffect(() => {
    const { satuan, panjang, lebar, tinggi, jumlah } = dimData;
    let newVolume = dimData.volume;

    if (satuan === 'M1') {
      newVolume = jumlah;
    } else if (satuan === 'M2 (pxl)') {
      newVolume = panjang * lebar;
    } else if (satuan === 'M2 (pxt)') {
      newVolume = panjang * tinggi;
    } else if (satuan === 'UNIT' || satuan === 'SET') {
      newVolume = jumlah;
    }

    if (newVolume !== dimData.volume) {
      setDimData((prev) => ({ ...prev, volume: newVolume }));
    }
  }, [
    dimData.satuan,
    dimData.panjang,
    dimData.lebar,
    dimData.tinggi,
    dimData.jumlah,
  ]);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [historyItem, setHistoryItem] = React.useState<ProjectItemV2 | null>(
    null
  );
  const { data: itemHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['item-history', historyItem?.id],
    queryFn: () => projectV2Service.getItemHistory(historyItem!.id),
    enabled: !!historyItem,
  });

  const filteredHistory = React.useMemo(() => {
    return (
      itemHistory?.filter(
        (h: any) =>
          h.old_value !== null &&
          h.old_value !== undefined &&
          h.old_value !== 'null'
      ) || []
    );
  }, [itemHistory]);

  const updateDimMutation = useMutation({
    mutationFn: (payload: any) =>
      projectV2Service.updateProjectItem(dimItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-v2-items', projectId],
      });
      toast.success('Dimensions updated successfully');
      setIsDimDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update dimensions');
    },
  });

  const handleDimUpdate = () => {
    if (!dimItem) return;
    updateDimMutation.mutate(dimData);
  };

  const openDimDialog = (item: ProjectItemV2) => {
    setDimItem(item);
    setDimData({
      volume: item.volume || 0,
      panjang: item.panjang || 0,
      lebar: item.lebar || 0,
      tinggi: item.tinggi || 0,
      satuan: item.satuan || '',
      jumlah: item.jumlah,
    });
    setIsDimDialogOpen(true);
  };

  const openHistory = (item: ProjectItemV2) => {
    setHistoryItem(item);
    setIsHistoryOpen(true);
  };

  const openProduksiView = (item: ProjectItemV2) => {
    setProduksiViewItem(item);
    setIsProduksiViewOpen(true);
  };

  if (isLoadingProject) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-neutral-400' />
      </div>
    );
  }

  if (!project) {
    return (
      <div className='p-8 text-center text-muted-foreground'>
        Project not found.
      </div>
    );
  }

  // Summary Calculations
  const totalItems = items?.length || 0;
  const poDivisiCount = items?.filter((i) => i.divisi_id).length || 0;
  const gambarKerjaCount =
    items?.filter((i) => i.gambar_kerja?.file || i.mdl_item?.link_gambar_kerja)
      .length || 0;
  const dokubahCount =
    project.dokubah?.file || project.dokubah?.file_rekap_dokubah ? 1 : 0;
  const stokLengkapCount =
    items?.filter(
      (i) =>
        i.bahan_baku?.ketersediaan_stok === 'Tersedia' ||
        i.bahan_baku?.ketersediaan_stok === 'Lengkap'
    ).length || 0;
  const stokBelumLengkapCount = totalItems - stokLengkapCount;
  const stokLengkapPercentage = totalItems
    ? Math.round((stokLengkapCount / totalItems) * 100)
    : 0;
  const stokBelumLengkapPercentage = totalItems
    ? Math.round((stokBelumLengkapCount / totalItems) * 100)
    : 0;
  const isStokTerisi =
    totalItems > 0 &&
    (items?.every((i) => !!i.bahan_baku?.ketersediaan_stok) || false);
  const perintahProduksiCount =
    items?.filter(
      (i) =>
        i.divisi_id && (i.gambar_kerja?.file || i.mdl_item?.link_gambar_kerja)
    ).length || 0;

  const totalQtyOrder = items?.reduce((sum, i) => sum + i.jumlah, 0) || 0;
  const totalQtyMasuk =
    items?.reduce(
      (sum, i) =>
        sum + (i.barang_jadi_masuk?.reduce((s, bj) => s + bj.jumlah, 0) || 0),
      0
    ) || 0;
  const totalQtyPacking =
    items?.reduce(
      (sum, i) =>
        sum +
        (i.barang_jadi_terpacking?.reduce((s, p) => s + p.jumlah, 0) || 0),
      0
    ) || 0;
  const totalQtyKeluar =
    pengirimanPerSpkData?.data.reduce(
      (sum, p) =>
        sum +
        (p.details?.reduce((s, d) => s + Number(d.jumlah_keluar), 0) ?? 0),
      0
    ) ?? 0;
  const totalQtySetting =
    pengirimanPerSpkData?.data.reduce(
      (sum, p) =>
        sum +
        (p.details?.reduce((s, d) => s + Number(d.jumlah_tersetting), 0) ?? 0),
      0
    ) ?? 0;
  const totalQtyBelumSetting = totalQtyKeluar - totalQtySetting;
  const orderGk = project?.order_gambar_kerja?.[0];
  const isGkCompleted =
    (totalItems > 0 && gambarKerjaCount === totalItems) ||
    orderGk?.pakai_gambar === 0;
  const gkProgress = isGkCompleted
    ? 100
    : totalItems
    ? (gambarKerjaCount / totalItems) * 100
    : 0;

  const flowSteps = [
    {
      id: 1,
      title: 'Upload SPD',
      isCompleted: !!project.designs?.[0]?.spd_file,
      isActive: project.need_design !== 0,
      icon: FileText,
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
      color: 'text-orange-600',
    },
    {
      id: 2,
      title: 'ACC Design',
      isCompleted: project.designs?.[0]?.acc_design?.status === 'Approved',
      isActive: project.need_design !== 0 && !!project.designs?.[0]?.spd_file,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      color: 'text-emerald-600',
    },
    {
      id: 3,
      title: 'Upload SPH',
      isCompleted: !!project.sph?.file,
      isActive:
        project.need_design === 0 ||
        project.designs?.[0]?.acc_design?.status === 'Approved',
      icon: FileText,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      color: 'text-blue-600',
    },
    {
      id: 4,
      title: 'Upload SPK',
      isCompleted: !!project.spk?.file || !!project.spk?.spk_signed_file,
      isActive: !!project.sph?.file,
      icon: ClipboardCheck,
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      color: 'text-purple-600',
    },
    {
      id: 5,
      title: 'Planning',
      isCompleted: totalItems > 0 && poDivisiCount === totalItems,
      isActive: !!project.spk?.file || !!project.spk?.spk_signed_file,
      icon: ListChecks,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className='flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <div className='flex items-start gap-4 shrink-0'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.back()}
            className='rounded-full hover:bg-neutral-100 mt-0.5'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div className='space-y-1.5'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-neutral-900'>
                {project.name}
              </h1>
              <p className='text-xs text-muted-foreground italic'>
                Perencanaan Detail (PPIC View)
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
              {project.client?.name && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Building2 className='h-3 w-3 text-neutral-400' />
                  {project.client.name}
                </span>
              )}
              {project.sph?.nomor_sph && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <FileText className='h-3 w-3 text-neutral-400' />
                  SPH: {project.sph.nomor_sph}
                </span>
              )}
              {(project.spk_number || project.spk?.nomor_spk) && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <ClipboardCheck className='h-3 w-3 text-neutral-400' />
                  SPK: {project.spk_number || project.spk?.nomor_spk}
                </span>
              )}
              {project.deadline && (
                <span className='flex items-center gap-1 text-xs text-neutral-600'>
                  <Calendar className='h-3 w-3 text-neutral-400' />
                  {format(new Date(project.deadline), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className='ml-auto overflow-x-auto hide-scrollbar shrink-0'>
          <div className='flex items-center gap-1 min-w-max'>
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-1.5 transition-all duration-300 ${
                      step.isActive ? 'opacity-100' : 'opacity-40 grayscale'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center border shadow-sm transition-all duration-500 shrink-0 ${
                        step.isCompleted
                          ? step.bgColor + ' border-transparent text-white'
                          : step.isActive
                          ? step.lightBg +
                            ' ' +
                            step.borderColor +
                            ' ' +
                            step.color
                          : 'bg-neutral-100 border-neutral-200 text-neutral-400'
                      }`}
                    >
                      {step.isCompleted ? (
                        <CheckCircle2 className='h-3 w-3' />
                      ) : (
                        <Icon className='h-3 w-3' />
                      )}
                    </div>
                    <div className='flex flex-col leading-none'>
                      <span
                        className={`text-[10px] font-bold whitespace-nowrap ${
                          step.isCompleted || step.isActive
                            ? 'text-neutral-800'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className='w-6 h-[2px] rounded-full bg-neutral-200 overflow-hidden relative mx-0.5 shrink-0'>
                      <div
                        className={`absolute top-0 left-0 h-full w-full transition-transform duration-700 origin-left ${
                          step.isCompleted
                            ? step.bgColor + ' scale-x-100'
                            : 'scale-x-0'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 w-full'>
        {/* 1. SPH & SPK */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            !!project.spk?.file || !!project.spk?.spk_signed_file
              ? 'border-purple-200 bg-white ring-1 ring-purple-100'
              : 'border-neutral-200 bg-white'
          }`}
        >
          {project.sph?.file &&
            (project.spk?.file || project.spk?.spk_signed_file) && (
              <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
                <Check className='h-3 w-3 text-white' strokeWidth={3} />
              </div>
            )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button
              className='flex items-center gap-3 flex-1 text-left min-w-0'
              onClick={() => setIsSphCollapsed(!isSphCollapsed)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  !!project.spk?.file || !!project.spk?.spk_signed_file
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                1
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>
                  SPH & SPK
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>
                  Documents
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isSphCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isSphCollapsed && (
            <CardContent className='pt-0 space-y-2.5'>
              <div className='grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2.5'>
                {/* SPH Block */}
                <div className='flex items-center justify-between bg-neutral-50/50 p-1.5 rounded border border-neutral-100 min-w-0'>
                  <div className='flex flex-col gap-0.5 min-w-0 flex-1 mr-1'>
                    <span className='text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none'>
                      Nomor SPH
                    </span>
                    <span
                      className={`text-[10px] font-extrabold truncate ${
                        project.sph?.nomor_sph
                          ? 'text-emerald-600'
                          : 'text-red-500'
                      }`}
                      title={project.sph?.nomor_sph || undefined}
                    >
                      {project.sph?.nomor_sph || '-'}
                    </span>
                  </div>
                  {(() => {
                    const sphFile = project.sph?.file;
                    if (!sphFile) return null;
                    return (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 text-blue-600 hover:bg-blue-100 shrink-0'
                        asChild
                        title='Lihat SPH'
                      >
                        <a
                          href={
                            sphFile.startsWith('http')
                              ? sphFile
                              : `${(
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  'http://localhost:8000'
                                ).replace('/api', '')}/storage/${sphFile}`
                          }
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Eye className='h-3.5 w-3.5' />
                        </a>
                      </Button>
                    );
                  })()}
                </div>

                {/* SPK Block */}
                <div className='flex items-center justify-between bg-neutral-50/50 p-1.5 rounded border border-neutral-100 min-w-0'>
                  <div className='flex flex-col gap-0.5 min-w-0 flex-1 mr-1'>
                    <span className='text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none'>
                      Nomor SPK
                    </span>
                    <span
                      className={`text-[10px] font-extrabold truncate ${
                        project.spk?.nomor_spk
                          ? 'text-emerald-600'
                          : 'text-red-500'
                      }`}
                      title={project.spk?.nomor_spk || undefined}
                    >
                      {project.spk?.nomor_spk || '-'}
                    </span>
                  </div>
                  {(() => {
                    const spkFile =
                      project.spk?.spk_signed_file || project.spk?.file;
                    if (!spkFile) return null;
                    return (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 text-blue-600 hover:bg-blue-100 shrink-0'
                        asChild
                        title='Lihat SPK'
                      >
                        <a
                          href={
                            spkFile.startsWith('http')
                              ? spkFile
                              : `${(
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  'http://localhost:8000'
                                ).replace('/api', '')}/storage/${spkFile}`
                          }
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Eye className='h-3.5 w-3.5' />
                        </a>
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 2. Gudang Barang Jadi */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            totalQtyMasuk >= totalQtyOrder &&
            totalQtyOrder > 0
              ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
              : 'border-neutral-200 bg-white'
          }`}
        >
          {totalQtyMasuk >= totalQtyOrder &&
            totalQtyOrder > 0 && (
              <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
                <Check className='h-3 w-3 text-white' strokeWidth={3} />
              </div>
            )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button
              className='flex items-center gap-3 flex-1 text-left min-w-0'
              onClick={() => setIsBjCollapsed(!isBjCollapsed)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  totalQtyMasuk > 0
                    ? totalQtyMasuk >= totalQtyOrder
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                2
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>
                  Gudang Barang Jadi
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>
                  Finished Goods
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isBjCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isBjCollapsed && (
            <CardContent className='pt-0 space-y-4'>
              {/* Barang Masuk Progress */}
              <div className='space-y-1.5 border-t border-neutral-100 pt-2.5'>
                <div className='flex justify-between items-center'>
                  <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>
                    Barang Masuk
                  </p>
                  <p
                    className={`text-[10px] font-bold ${
                      totalQtyMasuk >= totalQtyOrder
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {Math.round(
                      totalQtyOrder ? (totalQtyMasuk / totalQtyOrder) * 100 : 0
                    )}
                    %
                  </p>
                </div>
                <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                  <div
                    className={`h-full transition-all duration-500 ${
                      totalQtyMasuk >= totalQtyOrder
                        ? 'bg-emerald-600'
                        : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${
                        totalQtyOrder
                          ? (totalQtyMasuk / totalQtyOrder) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className='text-[10px] font-bold text-neutral-600'>
                  {totalQtyMasuk} / {totalQtyOrder} Items
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 3. Pengiriman */}
        <Card className='border border-neutral-200/60 shadow-sm bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button
              className='flex items-center gap-3 flex-1 text-left min-w-0'
              onClick={() => setIsShipCollapsed(!isShipCollapsed)}
            >
              <div className='h-8 w-8 rounded-full flex items-center justify-center font-bold bg-neutral-100 text-neutral-500 shrink-0'>
                3
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>
                  Pengiriman
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>
                  Logistics
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isShipCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isShipCollapsed && (
            <CardContent className='pt-0'>
              <div className='border-t border-neutral-100 pt-2.5 space-y-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 w-full text-[10px] border-violet-200 text-violet-600 hover:bg-violet-50 gap-1.5 bg-violet-50/30 font-bold'
                  onClick={() => {
                    setEditingPengirimanPerSpk(null);
                    setIsPengirimanPerSpkDialogOpen(true);
                  }}
                >
                  <Plus className='h-3 w-3' />
                  Tambah Pengiriman per SPK
                </Button>

                {/* List pengiriman per SPK */}
                {pengirimanPerSpkData &&
                  pengirimanPerSpkData.data.length > 0 && (
                    <div className='space-y-1.5 pt-1 border-t border-neutral-100'>
                      {[...pengirimanPerSpkData.data]
                        .sort(
                          (a, b) =>
                            new Date(a.tanggal).getTime() -
                            new Date(b.tanggal).getTime()
                        )
                        .map((p) => {
                          const totalKeluar =
                            p.details?.reduce(
                              (s, d) => s + Number(d.jumlah_keluar),
                              0
                            ) ?? 0;
                          const totalTersetting =
                            p.details?.reduce(
                              (s, d) => s + Number(d.jumlah_tersetting),
                              0
                            ) ?? 0;
                          return (
                            <div
                              key={p.id}
                              className='p-2 rounded-md bg-violet-50/60 border border-violet-100 space-y-1'
                            >
                              <div className='flex items-center justify-between gap-1'>
                                <span className='text-[10px] font-bold text-violet-800 truncate'>
                                  {format(new Date(p.tanggal), 'dd MMM yyyy')}
                                </span>
                              </div>
                              <div className='flex items-center gap-2 text-[9px] text-neutral-600 font-medium'>
                                {p.supir && (
                                  <span className='truncate'>
                                    Supir: {p.supir}
                                  </span>
                                )}
                              </div>
                              <div className='flex items-center gap-2 flex-wrap'>
                                {totalKeluar > 0 && (
                                  <span className='text-[9px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded'>
                                    Keluar: {totalKeluar}
                                  </span>
                                )}
                                {p.surat_jalan ? (
                                  <button
                                    onClick={() => {
                                      setPreviewSjUrl(`${(
                                        process.env.NEXT_PUBLIC_API_URL ||
                                        'http://localhost:8000'
                                      ).replace('/api', '')}/storage/${p.surat_jalan}`);
                                      setPreviewSjPengirimanId(p.id);
                                      setPreviewSjDialogOpen(true);
                                    }}
                                    className='text-[9px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded hover:bg-neutral-200 flex items-center gap-0.5'
                                  >
                                    <Eye className='h-2.5 w-2.5' /> Lihat SJ
                                  </button>
                                ) : (
                                  <button
                                    className='text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors'
                                    onClick={() => {
                                      setSuratJalanPengirimanId(p.id);
                                      setSuratJalanFile(null);
                                      setSuratJalanDialogOpen(true);
                                    }}
                                  >
                                    + Surat Jalan
                                  </button>
                                )}
                                {p.setrim ? (
                                  <button
                                    onClick={() => {
                                      setPreviewSetrimUrl(`${(
                                        process.env.NEXT_PUBLIC_API_URL ||
                                        'http://localhost:8000'
                                      ).replace('/api', '')}/storage/${p.setrim}`);
                                      setPreviewSetrimPengirimanId(p.id);
                                      setPreviewSetrimDialogOpen(true);
                                    }}
                                    className='text-[9px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded hover:bg-neutral-200 flex items-center gap-0.5'
                                  >
                                    <Eye className='h-2.5 w-2.5' /> Lihat Setrim
                                  </button>
                                ) : (
                                  <button
                                    className='text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors'
                                    onClick={() => {
                                      setSetrimPengirimanId(p.id);
                                      setSetrimFile(null);
                                      setSetrimDialogOpen(true);
                                    }}
                                  >
                                    + Setrim
                                  </button>
                                )}
                                {totalTersetting > 0 && (
                                  <span className='text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded'>
                                    Setting: {totalTersetting}
                                  </span>
                                )}
                                <button
                                  className='text-[9px] font-bold text-neutral-500 bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded hover:bg-neutral-100 transition-colors flex items-center gap-0.5 ml-auto'
                                  onClick={() => {
                                    setEditingPengirimanPerSpk(p);
                                    setIsPengirimanPerSpkDialogOpen(true);
                                  }}
                                >
                                  <Pencil className='h-2.5 w-2.5' /> Edit
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* 4. Barang Terkirim */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            totalQtyKeluar >= totalQtyOrder && totalQtyOrder > 0
              ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
              : 'border-neutral-200 bg-white'
          }`}
        >
          {totalQtyKeluar >= totalQtyOrder && totalQtyOrder > 0 && (
            <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
              <Check className='h-3 w-3 text-white' strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button
              className='flex items-center gap-3 flex-1 text-left min-w-0'
              onClick={() => setIsKeluarCollapsed(!isKeluarCollapsed)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  totalQtyKeluar > 0
                    ? totalQtyKeluar >= totalQtyOrder
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                4
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>
                  Barang Terkirim
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>
                  Delivered Items
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isKeluarCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isKeluarCollapsed && (
            <CardContent className='pt-0'>
              <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                <div className='flex justify-between items-center'>
                  <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>
                    Terkirim
                  </p>
                  <p
                    className={`text-[10px] font-bold ${
                      totalQtyKeluar >= totalQtyOrder
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {Math.round(
                      totalQtyOrder ? (totalQtyKeluar / totalQtyOrder) * 100 : 0
                    )}
                    %
                  </p>
                </div>
                <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                  <div
                    className={`h-full transition-all duration-500 ${
                      totalQtyKeluar >= totalQtyOrder
                        ? 'bg-emerald-600'
                        : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${
                        totalQtyOrder
                          ? (totalQtyKeluar / totalQtyOrder) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className='text-[10px] font-bold text-neutral-600'>
                  {totalQtyKeluar} / {totalQtyOrder} Items
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 10. Barang Terkirim Belum Tersetting */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            totalQtyBelumSetting > 0
              ? 'border-amber-200 bg-white ring-1 ring-amber-100'
              : 'border-neutral-200 bg-white'
          }`}
        >
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button
              className='flex items-center gap-3 flex-1 text-left min-w-0'
              onClick={() =>
                setIsBelumSettingCollapsed(!isBelumSettingCollapsed)
              }
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  totalQtyBelumSetting > 0
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                10
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>
                  Belum Tersetting
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>
                  Pending Installation
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isBelumSettingCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isBelumSettingCollapsed && (
            <CardContent className='pt-0'>
              <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                <div className='flex justify-between items-center'>
                  <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>
                    Outstanding
                  </p>
                  <p className='text-[10px] font-bold text-amber-600'>
                    {totalQtyBelumSetting} Items
                  </p>
                </div>
                <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-amber-500 transition-all duration-500'
                    style={{
                      width: `${
                        totalQtyKeluar
                          ? (totalQtyBelumSetting / totalQtyKeluar) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 11. Barang Sudah Tersetting */}
        <Card
          className={`relative border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
            totalQtySetting >= totalQtyOrder && totalQtyOrder > 0
              ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
              : 'border-neutral-200 bg-white'
          }`}
        >
          {totalQtySetting >= totalQtyOrder && totalQtyOrder > 0 && (
            <div className='absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300'>
              <Check className='h-3 w-3 text-white' strokeWidth={3} />
            </div>
          )}
          <CardHeader className='pb-2 flex flex-row items-center justify-between gap-3 min-w-0'>
            <button
              className='flex items-center gap-3 flex-1 text-left min-w-0'
              onClick={() => setIsSettingCollapsed(!isSettingCollapsed)}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  totalQtySetting > 0
                    ? totalQtySetting >= totalQtyOrder
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                11
              </div>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-sm text-neutral-800 font-bold truncate'>
                  Barang Tersetting
                </CardTitle>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate'>
                  Installed Items
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isSettingCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </CardHeader>
          {!isSettingCollapsed && (
            <CardContent className='pt-0'>
              <div className='space-y-2 border-t border-neutral-100 pt-2.5'>
                <div className='flex justify-between items-center'>
                  <p className='text-[10px] font-bold text-neutral-500 uppercase tracking-wider'>
                    Tersetting
                  </p>
                  <p
                    className={`text-[10px] font-bold ${
                      totalQtySetting >= totalQtyOrder
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {Math.round(
                      totalQtyOrder
                        ? (totalQtySetting / totalQtyOrder) * 100
                        : 0
                    )}
                    %
                  </p>
                </div>
                <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                  <div
                    className={`h-full transition-all duration-500 ${
                      totalQtySetting >= totalQtyOrder
                        ? 'bg-emerald-600'
                        : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${
                        totalQtyOrder
                          ? (totalQtySetting / totalQtyOrder) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className='text-[10px] font-bold text-neutral-600'>
                  {totalQtySetting} / {totalQtyOrder} Items
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Items Table Section */}
      <div className='space-y-4 pt-4 border-t'>
        <div className='flex justify-between items-center gap-4'>
          <h2 className='text-lg font-bold flex items-center gap-2 text-neutral-800 shrink-0'>
            <ListChecks className='h-5 w-5 text-neutral-400' />
            Project Items List
            <Badge
              variant='outline'
              className='ml-2 bg-neutral-50 text-neutral-600 border-neutral-200'
            >
              {totalItems} Items
            </Badge>
          </h2>
          <div className='flex items-center gap-2'>
            <Button
              variant={showBelumTerkirim ? 'default' : 'outline'}
              size='sm'
              className={cn(
                'h-8 text-xs font-semibold transition-colors',
                showBelumTerkirim ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : 'text-amber-600 border-amber-200 hover:bg-amber-50'
              )}
              onClick={() => setShowBelumTerkirim(!showBelumTerkirim)}
            >
              Belum Terkirim
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                  onClick={handleExportBelumTerkirim}
                >
                  <FileDown className='h-3.5 w-3.5 mr-1.5' />
                  Export XLS
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Excel Item Belum Terkirim</p>
              </TooltipContent>
            </Tooltip>
            {selectedLabelItemIds.length > 0 && (
              <Button
                size='sm'
                variant='default'
                className='h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white border-transparent gap-2'
                onClick={openMassLabelDialog}
              >
                <Printer className='h-3.5 w-3.5' />
                Print Label Massal ({selectedLabelItemIds.length})
              </Button>
            )}
            <div className='relative w-64'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none' />
              <Input
                placeholder='Cari item, lantai, ruang...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8 h-8 text-xs'
              />
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm'>
          <Table>
            <TableHeader className='bg-neutral-50/80'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[40px] text-[10px] uppercase font-bold text-neutral-500'>
                  #
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  Floor/Room
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  Item Name
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  Vol/Dim
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  Qty
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  PO Divisi
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  Produksi
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  B. Jadi
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  B Keluar
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500'>
                  B Tersetting
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold text-neutral-500 text-center w-14'>
                  <div className='flex items-center justify-center gap-2'>
                    <Checkbox
                      checked={
                        items && items.length > 0
                          ? items.filter((item) => {
                              if (showBelumTerkirim) {
                                const totalKeluar =
                                  item.detail_pengiriman?.reduce(
                                    (sum, d) => sum + Number(d.jumlah_keluar),
                                    0
                                  ) ?? 0;
                                if (totalKeluar >= item.jumlah) return false;
                              }
                              if (!searchQuery.trim()) return true;
                              const q = searchQuery.toLowerCase();
                              return (
                                item.item?.toLowerCase().includes(q) ||
                                (item.lantai ?? '').toLowerCase().includes(q) ||
                                (item.ruang ?? '').toLowerCase().includes(q) ||
                                (item.keterangan ?? '').toLowerCase().includes(q) ||
                                (item.material_utama ?? '').toLowerCase().includes(q)
                              );
                            }).length === selectedLabelItemIds.length && selectedLabelItemIds.length > 0
                          : false
                      }
                      onCheckedChange={handleSelectAllLabelItems}
                      className='bg-white'
                    />
                    Actions
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className='h-32 text-center text-muted-foreground'
                  >
                    <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                  </TableCell>
                </TableRow>
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className='h-32 text-center text-muted-foreground'
                  >
                    No items recorded for this project.
                  </TableCell>
                </TableRow>
              ) : (
                [...(items ?? [])]
                  .filter((item) => {
                    if (showBelumTerkirim) {
                      const totalKeluar =
                        item.detail_pengiriman?.reduce(
                          (sum, d) => sum + Number(d.jumlah_keluar),
                          0
                        ) ?? 0;
                      if (totalKeluar >= item.jumlah) return false;
                    }

                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      item.item?.toLowerCase().includes(q) ||
                      (item.lantai ?? '').toLowerCase().includes(q) ||
                      (item.ruang ?? '').toLowerCase().includes(q) ||
                      (item.keterangan ?? '').toLowerCase().includes(q) ||
                      (item.material_utama ?? '').toLowerCase().includes(q)
                    );
                  })
                  .sort((a, b) => {
                    const lantaiA = a.lantai ?? '';
                    const lantaiB = b.lantai ?? '';
                    const lantaiCmp = lantaiA.localeCompare(
                      lantaiB,
                      undefined,
                      { numeric: true, sensitivity: 'base' }
                    );
                    if (lantaiCmp !== 0) return lantaiCmp;
                    const ruangA = a.ruang ?? '';
                    const ruangB = b.ruang ?? '';
                    return ruangA.localeCompare(ruangB, undefined, {
                      numeric: true,
                      sensitivity: 'base',
                    });
                  })
                  .map((item, index) => (
                    <TableRow
                      key={item.id}
                      className='hover:bg-neutral-50/50 transition-colors group'
                    >
                      <TableCell className='text-[10px] text-muted-foreground font-medium'>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-0.5'>
                          <span className='text-xs font-bold text-neutral-800'>
                            {item.lantai || '-'}
                          </span>
                          <span className='text-[9px] text-muted-foreground truncate max-w-[120px]'>
                            {item.ruang || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-0.5'>
                          <span className='text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors'>
                            {item.item}
                          </span>
                          {item.keterangan && (
                            <span className='text-[9px] text-muted-foreground truncate max-w-[150px]'>
                              {item.keterangan}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          item.history_fields?.some((f) =>
                            [
                              'volume',
                              'panjang',
                              'lebar',
                              'tinggi',
                              'satuan',
                            ].includes(f)
                          )
                            ? 'bg-amber-100/80 border-x border-amber-200/50 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.05)]'
                            : ''
                        )}
                      >
                        <div className='flex flex-col gap-0.5 group relative'>
                          <div className='flex items-center gap-1.5'>
                            <span className='font-bold text-blue-600 text-xs'>
                              {item.volume || '-'}
                            </span>
                            <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-5 w-5 text-neutral-400 hover:text-blue-600'
                                onClick={() => openDimDialog(item)}
                              >
                                <Pencil className='h-3 w-3' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-5 w-5 text-neutral-400 hover:text-amber-600'
                                onClick={() => openHistory(item)}
                              >
                                <History className='h-3 w-3' />
                              </Button>
                            </div>
                          </div>
                          <span className='text-xs text-muted-foreground'>
                            {item.panjang || '-'}x{item.lebar || '-'}x
                            {item.tinggi || '-'} {item.satuan}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          cn(
                            item.history_fields?.includes('jumlah')
                              ? 'bg-amber-100/80 border-x border-amber-200/50'
                              : ''
                          ) + ' font-bold text-sm text-neutral-800'
                        }
                      >
                        {item.jumlah}
                      </TableCell>
                      <TableCell
                        className={cn(
                          item.history_fields?.includes('divisi_id')
                            ? 'bg-amber-100/80 border-x border-amber-200/50'
                            : ''
                        )}
                      >
                        <div className='flex items-center gap-2 group/divisi relative'>
                          {item.divisi && editingDivisiItemId !== item.id ? (
                            <Badge
                              variant='outline'
                              className='bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[9px] px-1.5 h-5 cursor-pointer hover:bg-emerald-100 transition-colors'
                              onClick={() => setEditingDivisiItemId(item.id)}
                            >
                              {item.divisi.nama}
                            </Badge>
                          ) : (
                            <div className='flex items-center gap-1'>
                              <Select
                                defaultValue={item.divisi_id?.toString()}
                                onValueChange={(val) =>
                                  updateItemDivisiMutation.mutate({
                                    itemId: item.id,
                                    divisiId: parseInt(val),
                                  })
                                }
                              >
                                <SelectTrigger className='h-6 text-[9px] w-[80px] bg-white border-neutral-200'>
                                  <SelectValue placeholder='Pilih' />
                                </SelectTrigger>
                                <SelectContent>
                                  {divisions
                                    ? [...divisions]
                                        .sort((a, b) =>
                                          a.nama.localeCompare(b.nama)
                                        )
                                        .map((d) => (
                                          <SelectItem
                                            key={d.id}
                                            value={d.id.toString()}
                                            className='text-[10px]'
                                          >
                                            {d.nama}
                                          </SelectItem>
                                        ))
                                    : null}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 text-neutral-400 hover:text-amber-600 opacity-0 group-hover/divisi:opacity-100 transition-opacity'
                            onClick={() => openHistory(item)}
                          >
                            <History className='h-3 w-3' />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className='flex flex-col gap-1 w-16 cursor-pointer hover:opacity-80 transition-opacity'
                          onClick={() => openProduksiView(item)}
                        >
                          <div className='h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-blue-500 transition-all duration-500'
                              style={{
                                width: `${item.produksi?.persen || 0}%`,
                              }}
                            />
                          </div>
                          <span className='text-[10px] font-bold text-neutral-700'>
                            {item.produksi?.persen || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className='cursor-pointer p-1 rounded transition-colors flex flex-col gap-0.5'
                          onClick={() => openBjDialog(item)}
                        >
                          {item.barang_jadi_masuk &&
                          item.barang_jadi_masuk.length > 0 ? (
                            <Badge className='bg-blue-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm'>
                              {item.barang_jadi_masuk.reduce(
                                (sum, bj) => sum + Number(bj.jumlah),
                                0
                              )}{' '}
                              / {item.jumlah}
                            </Badge>
                          ) : (
                            <span className='text-[9px] text-muted-foreground italic hover:text-blue-600 transition-colors'>
                              Record
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {(() => {
                          const total =
                            item.detail_pengiriman?.reduce(
                              (sum, d) => sum + Number(d.jumlah_keluar),
                              0
                            ) ?? 0;
                          return total > 0 ? (
                            <Badge className='bg-teal-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm'>
                              {total} / {item.jumlah}
                            </Badge>
                          ) : (
                            <span className='text-[9px] text-muted-foreground italic'>
                              -
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const total =
                            item.detail_pengiriman?.reduce(
                              (sum, d) => sum + Number(d.jumlah_tersetting),
                              0
                            ) ?? 0;
                          return total > 0 ? (
                            <Badge className='bg-violet-600 text-white border-none font-bold text-[10px] h-5 px-1.5 shadow-sm'>
                              {total} / {item.jumlah}
                            </Badge>
                          ) : (
                            <span className='text-[9px] text-muted-foreground italic'>
                              -
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className='text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <Checkbox
                            checked={selectedLabelItemIds.includes(item.id)}
                            onCheckedChange={() => toggleSelectLabelItem(item.id)}
                            className='bg-white'
                          />
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-7 px-2 gap-1.5 text-[11px]'
                            onClick={() => openItemQrDialog(item)}
                          >
                            <Printer className='h-3.5 w-3.5' />
                            Label
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Per-Item QR Code Dialog - Label Format */}
      <AlertDialog
        open={isItemQrDialogOpen}
        onOpenChange={setIsItemQrDialogOpen}
      >
        <AlertDialogContent className='max-w-4xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-base'>
              <Printer className='h-4 w-4 text-blue-600' />
              Label Produksi — {qrItem?.item}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Preview label cetak. Klik <strong>Print Label</strong> untuk
              mencetak.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Label Preview */}
          <div
            id='qr-item-print-area'
            className='border border-black font-sans text-neutral-900 bg-white text-[11px] mt-2'
          >
            {/* ── Header ── */}
            <div className='flex border-b border-black'>
              {/* Logo */}
              <div className='flex items-center justify-center p-2 border-r border-black w-20 shrink-0'>
                <img
                  src='/Logo.png'
                  alt='Logo DPM'
                  className='w-14 h-14 object-contain'
                />
              </div>

              {/* Company Info */}
              <div className='flex-1 text-center py-2 px-4 border-r border-black'>
                <p className='font-extrabold text-blue-700 text-[13px] tracking-wide uppercase leading-tight'>
                  PT DHARMA PUTERA SEJAHTERA ABADI
                </p>
                <p className='italic text-[10px] text-neutral-600 mt-0.5'>
                  Interior &amp; Furniture Manufaktur
                </p>
                <p className='text-[10px] text-neutral-600 mt-0.5'>
                  Jl. Matraman No. 88, Ringinsari, Maguwoharjo, Depok, Sleman,
                  Yogyakarta
                </p>
                <p className='text-[10px] text-neutral-600'>
                  Telepon : (0274) 2800089&nbsp;&nbsp;&nbsp;Fax : (0274) 433
                  2248
                </p>
                <p className='text-[10px] text-neutral-600'>
                  E-mail : piutang.dpsa@gmail.com&nbsp;&nbsp;Website :
                  www.dpm-jogja.com
                </p>
              </div>

              {/* Doc Code Box */}
              <div className='w-24 shrink-0 flex flex-col text-[10px] text-center'>
                <div className='border-b border-black py-0.5 px-1 font-bold'>
                  PROD
                </div>
                <div className='border-b border-black py-0.5 px-1 font-bold text-[13px]'>
                  003
                </div>
                <div className='flex flex-1'>
                  <div className='flex-1 border-r border-black py-0.5 px-1'>
                    Rev:00
                  </div>
                  <div className='flex-1 py-0.5 px-1 leading-tight'>
                    Terbit:
                    <br />
                    08/25
                  </div>
                </div>
              </div>
            </div>

            {/* ── Info Fields ── */}
            <div className='flex'>
              {/* Left: info rows */}
              <div className='flex-1'>
                {[
                  {
                    label: 'NAMA ITEM',
                    value: qrItem?.item || '-',
                  },
                  {
                    label: 'UKURAN',
                    value: `${qrItem?.panjang || '-'} x ${
                      qrItem?.lebar || '-'
                    } x ${qrItem?.tinggi || '-'}`,
                  },
                  {
                    label: 'JUMLAH',
                    value: qrJumlah ? `${qrJumlah} ${qrItem?.satuan || ''}`.trim() : '-',
                  },
                  {
                    label: 'RUANG',
                    value: qrItem?.ruang || '-',
                  },
                  {
                    label: 'RUMAH SAKIT',
                    value: project?.client?.name || '-',
                  },
                  {
                    label: 'NO. SPK/TAHUN',
                    value: project?.spk?.nomor_spk || '-',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className='flex border-b border-black last:border-b-0'
                  >
                    <div className='w-36 font-bold py-3 px-2 border-r border-black shrink-0'>
                      {row.label}
                    </div>
                    <div className='w-5 text-center py-3 border-r border-black shrink-0'>
                      :
                    </div>
                    <div className='flex-1 py-3 px-2'>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AlertDialogFooter className='mt-4 flex-col sm:flex-row items-start sm:items-center gap-2'>
            <div className='flex items-center gap-2 flex-1'>
              <Label className='text-xs'>Jumlah:</Label>
              <Input
                type='number'
                min={1}
                value={qrJumlah}
                onChange={(e) => setQrJumlah(e.target.value)}
                className='h-8 w-24 text-xs'
                placeholder='Misal: 3'
              />
            </div>
            <div className='flex gap-2 ml-auto'>
              <AlertDialogCancel onClick={() => setIsItemQrDialogOpen(false)}>
                Tutup
              </AlertDialogCancel>
              <Button
                className='bg-blue-600 hover:bg-blue-700 text-white gap-2'
                onClick={handlePrintItemQR}
              >
                <Printer className='h-4 w-4' />
                Print 1 Label
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gambar Kerja Upload Dialog */}
      <AlertDialog open={isGkDialogOpen} onOpenChange={setIsGkDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ImageIcon className='h-5 w-5 text-orange-500' />
              Upload Gambar Kerja
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload technical drawing for item: <strong>{gkItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='gk-file'>File Gambar (PDF/JPG/PNG)</Label>
              <Input
                id='gk-file'
                type='file'
                onChange={(e) => setGkFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='gk-start'>Mulai</Label>
                <Input
                  id='gk-start'
                  type='date'
                  value={gkStart}
                  onChange={(e) => setGkStart(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='gk-end'>Selesai</Label>
                <Input
                  id='gk-end'
                  type='date'
                  value={gkEnd}
                  onChange={(e) => setGkEnd(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsGkDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700'
              onClick={handleGkUpload}
              disabled={uploadGkMutation.isPending}
            >
              {uploadGkMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Save Gambar Kerja
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dokubah Upload Dialog */}
      <AlertDialog
        open={isDokubahDialogOpen}
        onOpenChange={setIsDokubahDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-blue-500' />
              Upload Dokubah
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload changes document for this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='dokubah-file'>Link Dokubah</Label>
              <Input
                id='dokubah-file'
                type='text'
                placeholder='Masukkan link google drive...'
                value={typeof dokubahFile === 'string' ? dokubahFile : ''}
                onChange={(e) => setDokubahFile(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='rekap-dokubah-file'>Link Rekap Dokubah</Label>
              <Input
                id='rekap-dokubah-file'
                type='text'
                placeholder='Masukkan link rekap dokubah...'
                value={
                  typeof dokubahRekapFile === 'string' ? dokubahRekapFile : ''
                }
                onChange={(e) => setDokubahRekapFile(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='dokubah-start'>Mulai</Label>
                <Input
                  id='dokubah-start'
                  type='date'
                  value={dokubahStart}
                  onChange={(e) => setDokubahStart(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='dokubah-end'>Selesai</Label>
                <Input
                  id='dokubah-end'
                  type='date'
                  value={dokubahEnd}
                  onChange={(e) => setDokubahEnd(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDokubahDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleDokubahUpload}
              disabled={uploadDokubahMutation.isPending}
            >
              {uploadDokubahMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Save Dokubah
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stok Material Dialog */}
      <AlertDialog open={isStokDialogOpen} onOpenChange={setIsStokDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5 text-emerald-500' />
              Update Stok Material
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ketersediaan stok untuk item: <strong>{stokItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Ketersediaan Stok</Label>
              <div className='flex p-1 bg-neutral-100 rounded-lg border border-neutral-200'>
                {[
                  {
                    value: 'Belum Lengkap',
                    label: 'Belum Lengkap',
                    color: 'bg-red-500',
                  },
                  {
                    value: 'Lengkap',
                    label: 'Lengkap',
                    color: 'bg-emerald-500',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => setStokStatus(option.value)}
                    className={cn(
                      'flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all duration-200',
                      stokStatus === option.value
                        ? `${option.color} text-white shadow-sm`
                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {stokStatus === 'Belum Lengkap' && (
              <div className='space-y-2'>
                <Label htmlFor='deskripsi_belum_lengkap'>
                  Deskripsi Bahan Belum Lengkap
                </Label>
                <Textarea
                  id='deskripsi_belum_lengkap'
                  placeholder='Masukkan deskripsi jika bahan belum lengkap...'
                  value={stokDeskripsiBelumLengkap}
                  onChange={(e) => setStokDeskripsiBelumLengkap(e.target.value)}
                  className='text-xs resize-none'
                  rows={3}
                />
              </div>
            )}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Tgl Menerima Dokubah</Label>
                <Input
                  type='date'
                  value={stokMenerima}
                  onChange={(e) => setStokMenerima(e.target.value)}
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Tgl Keluar</Label>
                <Input
                  type='date'
                  value={stokKeluar}
                  onChange={(e) => setStokKeluar(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>PIC</Label>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 text-[9px] text-blue-600 gap-1 px-1.5'
                  onClick={() => {
                    setIsManualPic(!isManualPic);
                    setStokPicId('');
                  }}
                >
                  {isManualPic ? (
                    'Back to List'
                  ) : (
                    <>
                      <Plus className='h-2.5 w-2.5' />
                      Input Manual
                    </>
                  )}
                </Button>
              </div>

              {!isManualPic ? (
                <Popover open={stokPicOpen} onOpenChange={setStokPicOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      role='combobox'
                      aria-expanded={stokPicOpen}
                      className='w-full justify-between text-xs font-normal h-9'
                    >
                      {stokPicId
                        ? pics?.find((p) => p.id.toString() === stokPicId)?.nama
                        : 'Pilih PIC...'}
                      <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-full p-0' align='start'>
                    <Command className='w-full'>
                      <CommandInput placeholder='Cari PIC...' className='h-8' />
                      <CommandList>
                        <CommandEmpty>PIC tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {pics?.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.nama}
                              onSelect={() => {
                                setStokPicId(p.id.toString());
                                setStokPicOpen(false);
                              }}
                              className='text-xs'
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  stokPicId === p.id.toString()
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {p.nama} ({p.jabatan})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    placeholder='Nama PIC...'
                    value={newPicName}
                    onChange={(e) => setNewPicName(e.target.value)}
                    className='text-xs h-9'
                  />
                  <Input
                    placeholder='Jabatan...'
                    value={newPicJabatan}
                    onChange={(e) => setNewPicJabatan(e.target.value)}
                    className='text-xs h-9'
                  />
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsStokDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-emerald-600 hover:bg-emerald-700'
              onClick={handleStokUpdate}
              disabled={updateStokMutation.isPending}
            >
              {updateStokMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Update Stok
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barang Jadi Masuk Dialog */}
      <AlertDialog open={isBjDialogOpen} onOpenChange={setIsBjDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ListChecks className='h-5 w-5 text-blue-500' />
              Record Barang Masuk Lengkap
            </AlertDialogTitle>
            <AlertDialogDescription>
              Catat barang yang sudah masuk lengkap untuk item:{' '}
              <strong>{bjItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            {bjItem?.barang_jadi_masuk &&
              bjItem.barang_jadi_masuk.length > 0 && (
                <div className='bg-neutral-50 rounded-lg p-3 border border-neutral-100 mb-2'>
                  <Label className='text-[10px] uppercase text-neutral-500 font-bold mb-2 block'>
                    Riwayat Masuk Sebelumnya
                  </Label>
                  <div className='space-y-2'>
                    {bjItem.barang_jadi_masuk.map((record, i) => (
                      <div
                        key={i}
                        className='flex justify-between items-center text-xs border-b border-neutral-100 last:border-0 pb-1 last:pb-0'
                      >
                        <span className='text-neutral-600'>
                          {format(new Date(record.tanggal), 'dd MMM yyyy')}
                        </span>
                        <div className='flex items-center gap-2'>
                          {record.file_setrim && (
                            <a
                              href={`${(
                                process.env.NEXT_PUBLIC_API_URL ||
                                'http://localhost:8000'
                              ).replace('/api', '')}/storage/${
                                record.file_setrim
                              }`}
                              target='_blank'
                              rel='noreferrer'
                              className='text-[10px] text-blue-600 hover:underline flex items-center gap-0.5'
                            >
                              <Eye className='h-3 w-3' /> File Setrim
                            </a>
                          )}
                          <span className='font-bold text-blue-600'>
                            +{record.jumlah}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className='flex justify-between text-xs pt-1 font-bold border-t border-neutral-200'>
                      <span>Total Saat Ini</span>
                      <span className='text-neutral-900'>
                        {bjItem.barang_jadi_masuk.reduce(
                          (sum, r) => sum + r.jumlah,
                          0
                        )}{' '}
                        / {bjItem.jumlah}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            <div className='space-y-2'>
              <Label>Tanggal Masuk</Label>
              <Input
                type='date'
                value={bjTanggal}
                onChange={(e) => setBjTanggal(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label>Jumlah Barang Baru</Label>
              <div className='flex items-center gap-4'>
                <Input
                  type='number'
                  value={bjJumlah === 0 ? '' : bjJumlah}
                  onChange={(e) => setBjJumlah(parseInt(e.target.value) || 0)}
                  className='font-bold'
                  max={
                    bjItem
                      ? bjItem.jumlah -
                        (bjItem.barang_jadi_masuk?.reduce(
                          (sum, bj) => sum + bj.jumlah,
                          0
                        ) || 0)
                      : undefined
                  }
                />
                <span className='text-sm text-muted-foreground whitespace-nowrap'>
                  Sisa:{' '}
                  {(bjItem?.jumlah || 0) -
                    (bjItem?.barang_jadi_masuk?.reduce(
                      (sum, bj) => sum + bj.jumlah,
                      0
                    ) || 0)}
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <Label>File Setrim Barang Jadi</Label>
              <Input
                type='file'
                onChange={(e) => setBjFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBjDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleBjUpdate}
              disabled={
                updateBjMutation.isPending ||
                bjJumlah < 1 ||
                bjJumlah >
                  (bjItem?.jumlah || 0) -
                    (bjItem?.barang_jadi_masuk?.reduce(
                      (sum, bj) => sum + bj.jumlah,
                      0
                    ) || 0)
              }
            >
              {updateBjMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Record Barang
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barang Jadi Terpacking Dialog */}
      <AlertDialog
        open={isPackingDialogOpen}
        onOpenChange={setIsPackingDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5 text-orange-500' />
              Record Packing
            </AlertDialogTitle>
            <AlertDialogDescription>
              Catat jumlah barang yang sudah dipacking untuk item:{' '}
              <strong>{packingItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            {packingItem &&
              packingItem.barang_jadi_terpacking &&
              packingItem.barang_jadi_terpacking.length > 0 && (
                <div className='p-3 bg-orange-50 rounded-lg border border-orange-100'>
                  <Label className='text-[10px] uppercase text-orange-700 font-bold mb-2 block'>
                    Riwayat Packing Sebelumnya
                  </Label>
                  <div className='space-y-2'>
                    {packingItem.barang_jadi_terpacking.map((record, i) => (
                      <div
                        key={i}
                        className='flex justify-between text-xs border-b border-orange-100 last:border-0 pb-1 last:pb-0'
                      >
                        <span className='text-orange-600'>
                          {format(new Date(record.tanggal), 'dd MMM yyyy')}
                        </span>
                        <span className='font-bold text-orange-600'>
                          +{record.jumlah}
                        </span>
                      </div>
                    ))}
                    <div className='flex justify-between text-xs pt-1 font-bold border-t border-orange-200'>
                      <span>Total Saat Ini</span>
                      <span className='text-orange-900'>
                        {packingItem.barang_jadi_terpacking.reduce(
                          (sum, r) => sum + r.jumlah,
                          0
                        )}{' '}
                        / {packingItem.jumlah}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            <div className='space-y-2'>
              <Label>Tanggal Packing</Label>
              <Input
                type='date'
                value={packingTanggal}
                onChange={(e) => setPackingTanggal(e.target.value)}
                className='text-xs'
              />
            </div>
            <div className='space-y-2'>
              <Label>Jumlah Packing Baru</Label>
              <div className='flex items-center gap-4'>
                <Input
                  type='number'
                  value={packingJumlah === 0 ? '' : packingJumlah}
                  onChange={(e) =>
                    setPackingJumlah(parseInt(e.target.value) || 0)
                  }
                  className='font-bold border-orange-200 focus-visible:ring-orange-500'
                  max={
                    packingItem
                      ? packingItem.jumlah -
                        (packingItem.barang_jadi_terpacking?.reduce(
                          (sum, p) => sum + p.jumlah,
                          0
                        ) || 0)
                      : undefined
                  }
                />
                <span className='text-sm text-muted-foreground whitespace-nowrap'>
                  Sisa:{' '}
                  {(packingItem?.jumlah || 0) -
                    (packingItem?.barang_jadi_terpacking?.reduce(
                      (sum, p) => sum + p.jumlah,
                      0
                    ) || 0)}
                </span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsPackingDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700 text-white'
              onClick={handlePackingUpdate}
              disabled={
                updatePackingMutation.isPending ||
                packingJumlah < 1 ||
                packingJumlah >
                  (packingItem?.jumlah || 0) -
                    (packingItem?.barang_jadi_terpacking?.reduce(
                      (sum, p) => sum + p.jumlah,
                      0
                    ) || 0)
              }
            >
              {updatePackingMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Record Packing
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Gambar Kerja Dialog */}
      <AlertDialog
        open={isOrderGkDialogOpen}
        onOpenChange={setIsOrderGkDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ImageIcon className='h-5 w-5 text-orange-500' />
              Order Gambar Kerja
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload file brief desain dan tentukan target penyelesaian untuk
              project ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/50'>
              <div className='space-y-0.5'>
                <Label className='text-xs font-bold text-neutral-800'>
                  Metode Order
                </Label>
                <p className='text-[10px] text-muted-foreground'>
                  {pakaiGambar
                    ? 'Menggunakan file brief/desain'
                    : 'Tanpa melampirkan berkas gambar'}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <span
                  className={cn(
                    'text-[10px] font-bold transition-colors',
                    !pakaiGambar ? 'text-orange-600' : 'text-neutral-400'
                  )}
                >
                  Tanpa Gambar
                </span>
                <Switch
                  checked={pakaiGambar}
                  onCheckedChange={setPakaiGambar}
                />
                <span
                  className={cn(
                    'text-[10px] font-bold transition-colors',
                    pakaiGambar ? 'text-orange-600' : 'text-neutral-400'
                  )}
                >
                  Pakai Gambar
                </span>
              </div>
            </div>

            {pakaiGambar && (
              <>
                <div className='space-y-2 animate-in fade-in slide-in-from-top-1 duration-200'>
                  <Label>File Brief / Lampiran</Label>
                  <Input
                    type='file'
                    onChange={(e) =>
                      setOrderGkFile(e.target.files?.[0] || null)
                    }
                    className='text-xs'
                  />
                  <p className='text-[10px] text-muted-foreground'>
                    Format: PDF, JPG, PNG, DOC, XLS (Max 10MB)
                  </p>
                </div>
                <div className='space-y-2 animate-in fade-in slide-in-from-top-1 duration-200'>
                  <Label>Target Selesai</Label>
                  <Input
                    type='date'
                    value={orderGkTarget}
                    onChange={(e) => setOrderGkTarget(e.target.value)}
                    className='text-xs'
                  />
                </div>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOrderGkDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-orange-600 hover:bg-orange-700'
              onClick={handleOrderGkUpload}
              disabled={
                uploadOrderGkMutation.isPending ||
                (pakaiGambar && (!orderGkFile || !orderGkTarget))
              }
            >
              {uploadOrderGkMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Upload className='mr-2 h-4 w-4' />
              )}
              Submit Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Order Produksi Dialog */}
      <AlertDialog
        open={isOrderProduksiDialogOpen}
        onOpenChange={setIsOrderProduksiDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <ClipboardList className='h-5 w-5 text-blue-500' />
              Order Produksi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload file order produksi dan tentukan target penyelesaian untuk
              project ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>File Order / Lampiran</Label>
              <Input
                type='file'
                onChange={(e) =>
                  setOrderProduksiFile(e.target.files?.[0] || null)
                }
                className='text-xs'
              />
              <p className='text-[10px] text-muted-foreground'>
                Format: PDF, JPG, PNG, DOC, XLS (Max 10MB)
              </p>
            </div>
            <div className='space-y-2'>
              <Label>Target Selesai</Label>
              <Input
                type='date'
                value={orderProduksiTarget}
                onChange={(e) => setOrderProduksiTarget(e.target.value)}
                className='text-xs'
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsOrderProduksiDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleOrderProduksiUpload}
              disabled={
                uploadOrderProduksiMutation.isPending ||
                !orderProduksiFile ||
                !orderProduksiTarget
              }
            >
              {uploadOrderProduksiMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Upload className='mr-2 h-4 w-4' />
              )}
              Submit Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Produksi Progress Dialog (PPIC View-Only) */}
      <AlertDialog
        open={isProduksiViewOpen}
        onOpenChange={setIsProduksiViewOpen}
      >
        <AlertDialogContent className='max-w-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5 text-orange-500' />
              Detail Progress Produksi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Melihat progress produksi untuk item:{' '}
              <strong>{produksiViewItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='py-4 space-y-6'>
            {/* Summary Progress */}
            <div className='flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl border border-orange-100'>
              <span className='text-xs font-bold text-orange-800 uppercase tracking-wider'>
                Total Progress
              </span>
              <div className='flex items-baseline gap-1'>
                <span className='text-4xl font-black text-orange-600'>
                  {Math.round(produksiViewItem?.produksi?.persen || 0)}
                </span>
                <span className='text-xl font-bold text-orange-400'>%</span>
              </div>
              <Progress
                value={produksiViewItem?.produksi?.persen || 0}
                className='h-2 bg-orange-200/50 w-full max-w-md'
              />
            </div>

            <div className='grid grid-cols-2 gap-x-8 gap-y-6'>
              {/* Mesin Section */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                  <Activity className='h-3 w-3' />
                  Tahapan Mesin
                </h4>
                <div className='space-y-3'>
                  {[
                    {
                      label: 'Cold Press',
                      value: produksiViewItem?.produksi?.cold_press,
                      key: 'cold_press',
                    },
                    {
                      label: 'Running Saw',
                      value: produksiViewItem?.produksi?.running_saw,
                      key: 'running_saw',
                    },
                    {
                      label: 'Edging',
                      value: produksiViewItem?.produksi?.edging,
                      key: 'edging',
                    },
                    {
                      label: 'CNC',
                      value: produksiViewItem?.produksi?.cnc,
                      key: 'cnc',
                    },
                  ].map((field) => {
                    const isSkipped =
                      produksiViewItem?.produksi?.skipped_fields?.includes(
                        field.key
                      );
                    return (
                      <div
                        key={field.key}
                        className='flex items-center justify-between'
                      >
                        <span className='text-xs text-neutral-600'>
                          {field.label}
                        </span>
                        <div className='flex items-center gap-2'>
                          {isSkipped ? (
                            <Badge
                              variant='secondary'
                              className='text-[9px] bg-neutral-100 text-neutral-400 border-none'
                            >
                              SKIPPED
                            </Badge>
                          ) : (
                            <span className='text-sm font-bold text-neutral-900'>
                              {field.value || 0}{' '}
                              <span className='text-[10px] text-neutral-400 font-normal'>
                                / {produksiViewItem?.jumlah}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Section */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs text-neutral-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2'>
                  <User className='h-3 w-3' />
                  Tahapan Manual
                </h4>
                <div className='space-y-3'>
                  {[
                    {
                      label: 'Tukang Kayu',
                      value: produksiViewItem?.produksi?.tukang_kayu,
                      key: 'tukang_kayu',
                    },
                    {
                      label: 'Tukang Jok',
                      value: produksiViewItem?.produksi?.tukang_jok,
                      key: 'tukang_jok',
                    },
                    {
                      label: 'Rakit',
                      value: produksiViewItem?.produksi?.rakit,
                      key: 'rakit',
                    },
                    {
                      label: 'Finishing',
                      value: produksiViewItem?.produksi?.finishing,
                      key: 'finishing',
                    },
                  ].map((field) => {
                    const isSkipped =
                      produksiViewItem?.produksi?.skipped_fields?.includes(
                        field.key
                      );
                    return (
                      <div
                        key={field.key}
                        className='flex items-center justify-between'
                      >
                        <span className='text-xs text-neutral-600'>
                          {field.label}
                        </span>
                        <div className='flex items-center gap-2'>
                          {isSkipped ? (
                            <Badge
                              variant='secondary'
                              className='text-[9px] bg-neutral-100 text-neutral-400 border-none'
                            >
                              SKIPPED
                            </Badge>
                          ) : (
                            <span className='text-sm font-bold text-neutral-900'>
                              {field.value || 0}{' '}
                              <span className='text-[10px] text-neutral-400 font-normal'>
                                / {produksiViewItem?.jumlah}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className='border-t pt-4'>
            <AlertDialogCancel className='bg-neutral-100 hover:bg-neutral-200 border-none'>
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dimensi Dialog */}
      <AlertDialog open={isDimDialogOpen} onOpenChange={setIsDimDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Pencil className='h-5 w-5 text-blue-500' />
              Edit Volume & Dimensi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update dimensi untuk item: <strong>{dimItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 gap-3'>
              <div className='space-y-2'>
                <Label>Panjang</Label>
                <Input
                  type='number'
                  value={dimData.panjang}
                  onChange={(e) =>
                    setDimData({
                      ...dimData,
                      panjang: parseFloat(e.target.value) || 0,
                    })
                  }
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Lebar</Label>
                <Input
                  type='number'
                  value={dimData.lebar}
                  onChange={(e) =>
                    setDimData({
                      ...dimData,
                      lebar: parseFloat(e.target.value) || 0,
                    })
                  }
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Tinggi</Label>
                <Input
                  type='number'
                  value={dimData.tinggi}
                  onChange={(e) =>
                    setDimData({
                      ...dimData,
                      tinggi: parseFloat(e.target.value) || 0,
                    })
                  }
                  className='text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label>Satuan</Label>
                <Select
                  value={dimData.satuan}
                  onValueChange={(val) =>
                    setDimData({ ...dimData, satuan: val })
                  }
                >
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue placeholder='Pilih Satuan' />
                  </SelectTrigger>
                  <SelectContent>
                    {['M1', 'M2 (pxl)', 'M2 (pxt)', 'UNIT', 'SET'].map((u) => (
                      <SelectItem key={u} value={u} className='text-xs'>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100'>
              <div className='space-y-2'>
                <Label>Volume (m3)</Label>
                <Input
                  type='number'
                  step='0.01'
                  value={dimData.volume}
                  onChange={(e) =>
                    setDimData({
                      ...dimData,
                      volume: parseFloat(e.target.value) || 0,
                    })
                  }
                  className='text-xs bg-neutral-50 font-bold text-blue-600'
                />
              </div>
              <div className='space-y-2'>
                <Label>Jumlah (Qty)</Label>
                <Input
                  type='number'
                  value={dimData.jumlah}
                  onChange={(e) =>
                    setDimData({
                      ...dimData,
                      jumlah: parseInt(e.target.value) || 0,
                    })
                  }
                  className='text-xs font-bold'
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDimDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleDimUpdate}
              disabled={updateDimMutation.isPending}
            >
              {updateDimMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Check className='mr-2 h-4 w-4' />
              )}
              Simpan Perubahan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tambah Pengiriman Dialog */}
      <PengirimanFormDialog
        open={isPengirimanDialogOpen}
        onOpenChange={setIsPengirimanDialogOpen}
        pengiriman={null}
      />

      {/* Tambah / Edit Pengiriman per SPK Dialog */}
      <PengirimanPerSpkFormDialog
        open={isPengirimanPerSpkDialogOpen}
        onOpenChange={setIsPengirimanPerSpkDialogOpen}
        pengiriman={editingPengirimanPerSpk}
        projectId={projectId}
        clientId={project?.client_id}
        clientName={project?.client?.name}
        spkId={project?.spk?.id}
        onSaved={() =>
          queryClient.invalidateQueries({
            queryKey: ['project-v2-items', projectId],
          })
        }
      />

      {/* Preview Surat Jalan Dialog */}
      <AlertDialog
        open={previewSjDialogOpen}
        onOpenChange={setPreviewSjDialogOpen}
      >
        <AlertDialogContent className='max-w-4xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center justify-between gap-2 w-full pr-4'>
              <div className='flex items-center gap-2'>
                <FileText className='h-5 w-5 text-amber-500' />
                Preview Surat Jalan
              </div>
              <Button
                variant='outline'
                size='sm'
                className='gap-2 h-8'
                onClick={() => {
                  setPreviewSjDialogOpen(false);
                  setSuratJalanPengirimanId(previewSjPengirimanId);
                  setSuratJalanFile(null);
                  setSuratJalanDialogOpen(true);
                }}
              >
                <Pencil className='h-3.5 w-3.5' /> Edit Dokumen
              </Button>
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className='py-4 min-h-[60vh]'>
            {previewSjUrl && (
              <iframe
                src={previewSjUrl}
                className='w-full h-[60vh] border rounded-md'
                title='Preview Surat Jalan'
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPreviewSjDialogOpen(false);
                setPreviewSjUrl(null);
                setPreviewSjPengirimanId(null);
              }}
            >
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Surat Jalan Dialog */}
      <AlertDialog
        open={suratJalanDialogOpen}
        onOpenChange={setSuratJalanDialogOpen}
      >
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-amber-500' />
              Upload Surat Jalan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Masukkan nomor surat jalan untuk pengiriman ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <div className='space-y-2'>
              <Label htmlFor='surat-jalan-input'>File Surat Jalan</Label>
              <Input
                id='surat-jalan-input'
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                onChange={(e) => setSuratJalanFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
              <p className='text-[10px] text-muted-foreground'>
                Format: PDF, JPG, PNG, DOC (Max 10MB)
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSuratJalanDialogOpen(false);
                setSuratJalanFile(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <Button
              className='bg-amber-500 hover:bg-amber-600 text-white'
              disabled={!suratJalanFile || updateSuratJalanMutation.isPending}
              onClick={() => {
                if (suratJalanPengirimanId && suratJalanFile) {
                  updateSuratJalanMutation.mutate({
                    id: suratJalanPengirimanId,
                    file: suratJalanFile,
                  });
                }
              }}
            >
              {updateSuratJalanMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Simpan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Setrim Dialog */}
      <AlertDialog
        open={previewSetrimDialogOpen}
        onOpenChange={setPreviewSetrimDialogOpen}
      >
        <AlertDialogContent className='max-w-4xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center justify-between gap-2 w-full pr-4'>
              <div className='flex items-center gap-2'>
                <FileText className='h-5 w-5 text-blue-500' />
                Preview Setrim
              </div>
              <Button
                variant='outline'
                size='sm'
                className='gap-2 h-8'
                onClick={() => {
                  setPreviewSetrimDialogOpen(false);
                  setSetrimPengirimanId(previewSetrimPengirimanId);
                  setSetrimFile(null);
                  setSetrimDialogOpen(true);
                }}
              >
                <Pencil className='h-3.5 w-3.5' /> Edit Dokumen
              </Button>
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className='py-4 min-h-[60vh]'>
            {previewSetrimUrl && (
              <iframe
                src={previewSetrimUrl}
                className='w-full h-[60vh] border rounded-md'
                title='Preview Setrim'
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPreviewSetrimDialogOpen(false);
                setPreviewSetrimUrl(null);
                setPreviewSetrimPengirimanId(null);
              }}
            >
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Setrim Dialog */}
      <AlertDialog open={setrimDialogOpen} onOpenChange={setSetrimDialogOpen}>
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-blue-500' />
              Upload Setrim
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload file setrim untuk pengiriman ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <div className='space-y-2'>
              <Label htmlFor='setrim-input'>File Setrim</Label>
              <Input
                id='setrim-input'
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                onChange={(e) => setSetrimFile(e.target.files?.[0] || null)}
                className='text-xs'
              />
              <p className='text-[10px] text-muted-foreground'>
                Format: PDF, JPG, PNG, DOC (Max 10MB)
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSetrimDialogOpen(false);
                setSetrimFile(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <Button
              className='bg-blue-500 hover:bg-blue-600 text-white'
              disabled={!setrimFile || updateSetrimMutation.isPending}
              onClick={() => {
                if (setrimPengirimanId && setrimFile) {
                  updateSetrimMutation.mutate({
                    id: setrimPengirimanId,
                    file: setrimFile,
                  });
                }
              }}
            >
              {updateSetrimMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle2 className='mr-2 h-4 w-4' />
              )}
              Simpan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <AlertDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <AlertDialogContent className='max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <History className='h-5 w-5 text-amber-500' />
              History Perubahan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat perubahan volume & dimensi untuk:{' '}
              <strong>{historyItem?.item}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4 max-h-[400px] overflow-y-auto custom-scrollbar'>
            {isLoadingHistory ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-neutral-300' />
              </div>
            ) : filteredHistory.length === 0 ? (
              <p className='text-center py-8 text-xs text-muted-foreground italic'>
                Belum ada riwayat perubahan.
              </p>
            ) : (
              <div className='space-y-4'>
                {filteredHistory.map((h: any) => (
                  <div
                    key={h.id}
                    className='flex gap-4 items-start p-3 rounded-lg bg-neutral-50 border border-neutral-100'
                  >
                    <div className='h-8 w-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0'>
                      <User className='h-4 w-4 text-neutral-400' />
                    </div>
                    <div className='flex-1 space-y-1'>
                      <div className='flex justify-between items-start'>
                        <span className='text-xs font-bold text-neutral-900'>
                          {h.user?.name}
                        </span>
                        <span className='text-[10px] text-muted-foreground'>
                          {format(new Date(h.created_at), 'dd MMM yyyy HH:mm')}
                        </span>
                      </div>
                      <p className='text-[11px] text-neutral-600'>
                        Mengubah{' '}
                        <span className='font-bold uppercase'>
                          {h.field === 'divisi_id'
                            ? 'Divisi'
                            : h.field === 'jumlah'
                            ? 'Jumlah (Qty)'
                            : h.field}
                        </span>{' '}
                        dari{' '}
                        <span className='line-through text-red-500'>
                          {h.field === 'divisi_id'
                            ? divisions?.find(
                                (d: any) =>
                                  d.id.toString() === h.old_value?.toString()
                              )?.nama ||
                              h.old_value ||
                              '-'
                            : h.old_value || '-'}
                        </span>{' '}
                        menjadi{' '}
                        <span className='font-bold text-emerald-600'>
                          {h.field === 'divisi_id'
                            ? divisions?.find(
                                (d: any) =>
                                  d.id.toString() === h.new_value?.toString()
                              )?.nama || h.new_value
                            : h.new_value}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsHistoryOpen(false)}>
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mass Label Print Configuration Dialog */}
      <AlertDialog
        open={isMassLabelDialogOpen}
        onOpenChange={setIsMassLabelDialogOpen}
      >
        <AlertDialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-base'>
              <Printer className='h-4 w-4 text-blue-600' />
              Konfigurasi Print Label Massal
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Sesuaikan nilai <strong>Jumlah</strong> untuk setiap item. Secara default terisi sesuai Qty pesanan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='mt-4 space-y-4'>
            {items
              ?.filter((i) => selectedLabelItemIds.includes(i.id))
              .map((item) => (
                <div key={item.id} className='flex items-center justify-between border-b pb-2 last:border-b-0'>
                  <div className='flex flex-col gap-1 pr-4 max-w-[70%]'>
                    <span className='font-bold text-sm'>{item.item}</span>
                    <span className='text-xs text-muted-foreground'>
                      Lantai/Ruang: {item.lantai || '-'} / {item.ruang || '-'}
                    </span>
                    <span className='text-[10px] text-muted-foreground uppercase'>
                      Qty Asli: {item.jumlah} {item.satuan}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <Label className='text-xs'>Jumlah:</Label>
                    <Input
                      type='text'
                      className='w-24 text-center'
                      value={massLabelConfig[item.id] ?? ''}
                      onChange={(e) => setMassLabelConfig((prev) => ({
                        ...prev,
                        [item.id]: e.target.value
                      }))}
                    />
                  </div>
                </div>
              ))}
          </div>

          <AlertDialogFooter className='mt-6 flex-col sm:flex-row gap-2'>
            <AlertDialogCancel onClick={() => setIsMassLabelDialogOpen(false)} className='sm:mt-0'>
              Batal
            </AlertDialogCancel>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={() => {
                setIsMassLabelDialogOpen(false);
                handlePrintMassLabel();
              }}
            >
              <Printer className='mr-2 h-4 w-4' />
              Print Label ({selectedLabelItemIds.length})
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
