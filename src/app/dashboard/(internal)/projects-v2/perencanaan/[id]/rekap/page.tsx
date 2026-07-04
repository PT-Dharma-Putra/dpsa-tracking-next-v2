'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Package, ListChecks, CheckCircle2, Box, Layers, Building2, Calendar, ClipboardCheck, FileText, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  projectV2Service,
  ProjectItemV2,
} from '@/features/projects/services/project-v2-service';
import { PengirimanService } from '@/features/pengiriman/services/pengiriman-service';

// --- Custom Chart Components ---

const RingChart = ({ percentage, color, label, subLabel }: { percentage: number, color: string, label: string, subLabel: string }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-20 h-20">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: isNaN(strokeDashoffset) ? circumference : strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />
        </svg>
      </div>
      <div className="mt-2 text-center">
        <div className="text-xl font-bold text-neutral-800">{isNaN(percentage) ? '0.0' : percentage.toFixed(1)}%</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-[10px] font-medium text-neutral-500 mt-1">{subLabel}</div>
      </div>
    </div>
  );
};

const HorizontalProgressBar = ({ label, percentage, color, bgLight }: { label: string, percentage: number, color: string, bgLight: string }) => {
  const safePercentage = isNaN(percentage) ? 0 : percentage;
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-24 text-xs font-medium text-neutral-600">{label}</span>
      <div className="flex-1">
        <div className={`h-2 w-full ${bgLight} rounded-full overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ${color}`}
            style={{ width: `${safePercentage}%` }}
          />
        </div>
      </div>
      <span className="w-12 text-right text-xs font-bold text-neutral-800">{safePercentage.toFixed(1)}%</span>
    </div>
  );
};

const DonutChart = ({ total, data }: { total: number, data: { value: number, color: string, label: string }[] }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {data.map((item, index) => {
          if (item.value === 0) return null;
          const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += (item.value / total) * circumference;

          return (
            <circle
              key={index}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="20"
              style={{
                strokeDasharray,
                strokeDashoffset,
                transition: 'all 1s ease-in-out',
              }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-neutral-800">{total}</span>
        <span className="text-[10px] text-muted-foreground font-medium">Total Item</span>
      </div>
    </div>
  );
};

export default function PerencanaanRekapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  // --- Data Fetching ---
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['projects-v2', projectId],
    queryFn: () => projectV2Service.getProject(projectId),
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['project-v2-items', projectId],
    queryFn: () => projectV2Service.getProjectItems(projectId),
  });

  const spkId = project?.spk?.id;

  const { data: pengirimanPerSpkData, isLoading: isLoadingPengiriman } = useQuery({
    queryKey: ['pengiriman-per-spk', spkId],
    queryFn: () => PengirimanService.getPengiriman({ spk_id: spkId, per_page: 100 }),
    enabled: !!spkId,
  });

  const isLoading = isLoadingProject || isLoadingItems || isLoadingPengiriman;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!project || !items) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Project not found or failed to load data.
      </div>
    );
  }

  // --- Calculations ---
  const totalItemsCount = items.length;
  const totalQtyOrder = items.reduce((sum, i) => sum + i.jumlah, 0);

  // Status counters
  let itemsSelesai = 0;
  let itemsSebagian = 0;
  let itemsBelum = 0;
  let itemsBelumAdaData = 0;

  let qtySelesai = 0;
  let qtySebagian = 0;
  let qtyBelum = 0;

  // Averages calculations
  let totalProduksiProgress = 0;
  let totalPackingProgress = 0;
  let totalTerkirimProgress = 0;
  let totalTersettingProgress = 0;

  let itemsProduksiCount = 0;
  let itemsPackingCount = 0;
  let itemsTerkirimCount = 0;
  let itemsBelumTersettingCount = 0;
  let itemsTersettingCount = 0;

  const tableData = items.map((item, index) => {
    const qty = item.jumlah;

    // Produksi
    const progressProduksi = Number(item.produksi?.persen) || 0;
    if (progressProduksi > 0) itemsProduksiCount++;
    totalProduksiProgress += progressProduksi;

    // Barang Jadi (previously Packing)
    const qtyBarangJadi = item.barang_jadi_masuk?.reduce((sum, bj) => sum + Number(bj.jumlah), 0) || 0;
    const progressBarangJadi = qty > 0 ? Math.min(100, (qtyBarangJadi / qty) * 100) : 0;
    if (qtyBarangJadi > 0) itemsPackingCount++;
    totalPackingProgress += progressBarangJadi;

    // Terkirim & Tersetting from Pengiriman
    const qtyTerkirim = item.detail_pengiriman?.reduce(
      (sum, dp) => sum + Number(dp.jumlah_keluar || 0),
      0
    ) || 0;
    const progressTerkirim = qty > 0 ? Math.min(100, (qtyTerkirim / qty) * 100) : 0;
    if (qtyTerkirim > 0) itemsTerkirimCount++;
    totalTerkirimProgress += progressTerkirim;

    const qtyTersetting = item.detail_pengiriman?.reduce(
      (sum, dp) => sum + Number(dp.jumlah_tersetting || 0),
      0
    ) || 0;
    const progressTersetting = qty > 0 ? Math.min(100, (qtyTersetting / qty) * 100) : 0;
    totalTersettingProgress += progressTersetting;
    if (qtyTersetting > 0) itemsTersettingCount++;

    const qtyBelumTersetting = qtyTerkirim - qtyTersetting;
    if (qtyBelumTersetting > 0) itemsBelumTersettingCount++;

    // Status Akhir
    let statusAkhir = 'Belum Ada Data';
    if (qtyTersetting >= qty && qty > 0) {
      statusAkhir = 'Selesai';
      itemsSelesai++;
      qtySelesai += qty;
    } else if (progressProduksi > 0 || qtyBarangJadi > 0 || qtyTerkirim > 0 || qtyTersetting > 0) {
      statusAkhir = 'Sebagian';
      itemsSebagian++;
      qtySebagian += qty;
    } else if (qty > 0) {
      statusAkhir = 'Belum';
      itemsBelum++;
      qtyBelum += qty;
    } else {
      itemsBelumAdaData++;
    }

    return {
      no: index + 1,
      name: item.item || '-',
      volDim: {
        volume: item.volume,
        dim: `${item.panjang || '-'}x${item.lebar || '-'}x${item.tinggi || '-'}`,
        satuan: item.satuan,
      },
      qty,
      poDivisi: item.divisi?.nama || '-',
      produksi: { progress: progressProduksi, text: progressProduksi > 0 ? `${progressProduksi}%` : '' },
      packing: { progress: progressBarangJadi, text: qtyBarangJadi > 0 ? `${qtyBarangJadi}/${qty}` : 'Record' },
      terkirim: { progress: progressTerkirim, text: qtyTerkirim > 0 ? `${qtyTerkirim}/${qty}` : '-' },
      tersetting: { progress: progressTersetting, text: qtyTersetting > 0 ? `${qtyTersetting}/${qty}` : '-' },
      statusAkhir,
    };
  });

  const avgProduksi = totalItemsCount > 0 ? totalProduksiProgress / totalItemsCount : 0;
  const avgPacking = totalItemsCount > 0 ? totalPackingProgress / totalItemsCount : 0;
  const avgTerkirim = totalItemsCount > 0 ? totalTerkirimProgress / totalItemsCount : 0;
  const avgTersetting = totalItemsCount > 0 ? totalTersettingProgress / totalItemsCount : 0;

  const donutData = [
    { value: itemsSelesai, color: '#3b82f6', label: 'Selesai' }, // blue-500
    { value: itemsSebagian, color: '#22c55e', label: 'Sebagian' }, // green-500
    { value: itemsBelum, color: '#eab308', label: 'Belum' }, // yellow-500
    { value: itemsBelumAdaData, color: '#d1d5db', label: 'Belum Ada Data' }, // gray-300
  ];

  const handleExportExcel = () => {
    try {
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
          { v: 'ITEM NAME', t: 's', s: headerStyle },
          { v: 'VOL/DIM', t: 's', s: headerStyle },
          { v: 'QTY', t: 's', s: headerStyle },
          { v: 'PO DIVISI', t: 's', s: headerStyle },
          { v: 'PRODUKSI', t: 's', s: headerStyle },
          { v: 'BARANG JADI', t: 's', s: headerStyle },
          { v: 'TERKIRIM', t: 's', s: headerStyle },
          { v: 'TERSETTING', t: 's', s: headerStyle },
          { v: 'STATUS AKHIR', t: 's', s: headerStyle },
        ]
      ];

      tableData.forEach((row) => {
        wsData.push([
          { v: row.no, t: 'n', s: dataStyleCenter },
          { v: row.name || '-', t: 's', s: dataStyleLeft },
          { v: `${row.volDim.volume} (${row.volDim.dim} ${row.volDim.satuan})`, t: 's', s: dataStyleCenter },
          { v: row.qty, t: 'n', s: dataStyleCenter },
          { v: row.poDivisi, t: 's', s: dataStyleCenter },
          { v: row.produksi.text || '0%', t: 's', s: dataStyleCenter },
          { v: row.packing.text === 'Record' ? '-' : row.packing.text, t: 's', s: dataStyleCenter },
          { v: row.terkirim.text, t: 's', s: dataStyleCenter },
          { v: row.tersetting.text, t: 's', s: dataStyleCenter },
          { v: row.statusAkhir, t: 's', s: dataStyleCenter },
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 5 }, // NO
        { wch: 35 }, // ITEM NAME
        { wch: 20 }, // VOL/DIM
        { wch: 10 }, // QTY
        { wch: 20 }, // PO DIVISI
        { wch: 15 }, // PRODUKSI
        { wch: 15 }, // BARANG JADI
        { wch: 15 }, // TERKIRIM
        { wch: 15 }, // TERSETTING
        { wch: 15 }, // STATUS AKHIR
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Perencanaan');
      const safeProjectName = project?.name?.replace(/[^a-zA-Z0-9 _-]/g, '') || 'Project';
      const fileName = `Rekap_Perencanaan_${safeProjectName}`.trim() + '.xlsx';
      XLSX.writeFile(wb, fileName);
      
      toast.success('Berhasil export data ke Excel!');
    } catch (error) {
      console.error('Error exporting excel', error);
      toast.error('Gagal export excel');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-neutral-100 mt-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1.5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {project.name}
              </h1>
              <p className="text-xs text-muted-foreground italic">
                Perencanaan Rekap (Summary View)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {project.client?.name && (
                <span className="flex items-center gap-1 text-xs text-neutral-600">
                  <Building2 className="h-3 w-3 text-neutral-400" />
                  {project.client.name}
                </span>
              )}
              {project.sph?.nomor_sph && (
                <span className="flex items-center gap-1 text-xs text-neutral-600">
                  <FileText className="h-3 w-3 text-neutral-400" />
                  SPH: {project.sph.nomor_sph}
                </span>
              )}
              {(project.spk_number || project.spk?.nomor_spk) && (
                <span className="flex items-center gap-1 text-xs text-neutral-600">
                  <ClipboardCheck className="h-3 w-3 text-neutral-400" />
                  SPK: {project.spk_number || project.spk?.nomor_spk}
                </span>
              )}
              {project.deadline && (
                <span className="flex items-center gap-1 text-xs text-neutral-600">
                  <Calendar className="h-3 w-3 text-neutral-400" />
                  {format(new Date(project.deadline), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Cards Row */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <Card className="shadow-sm border-neutral-100">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-xs font-bold text-neutral-800">Total Item</div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-neutral-900">{totalItemsCount}</span>
                  <span className="text-xs text-muted-foreground font-medium">Item</span>
                </div>
                <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Layers className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-neutral-100">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-xs font-bold text-neutral-800">Total QTY</div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-neutral-900">{totalQtyOrder}</span>
                  <span className="text-xs text-muted-foreground font-medium">UNIT</span>
                </div>
                <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
                  <ListChecks className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-neutral-100">
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="text-xs font-bold text-blue-600 self-start">Produksi</div>
              <RingChart
                percentage={avgProduksi}
                color="#3b82f6" // blue-500
                label="Rata-rata"
                subLabel={`${itemsProduksiCount} / ${totalItemsCount} item`}
              />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-neutral-100">
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="text-xs font-bold text-emerald-600 self-start">Barang Jadi</div>
              <RingChart
                percentage={avgPacking}
                color="#10b981" // emerald-500
                label="Rata-rata"
                subLabel={`${itemsPackingCount} / ${totalItemsCount} item`}
              />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-neutral-100">
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="text-xs font-bold text-emerald-600 self-start">Terkirim</div>
              <RingChart
                percentage={avgTerkirim}
                color="#10b981" // emerald-500
                label="Rata-rata"
                subLabel={`${itemsTerkirimCount} / ${totalItemsCount} item`}
              />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-neutral-100">
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="text-xs font-bold text-orange-600 self-start">Belum Tersetting</div>
              <RingChart
                percentage={totalItemsCount > 0 ? (itemsBelumTersettingCount / totalItemsCount) * 100 : 0}
                color="#f97316" // orange-500
                label="Rata-rata"
                subLabel={`${itemsBelumTersettingCount} / ${totalItemsCount} item`}
              />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-neutral-100">
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="text-xs font-bold text-emerald-600 self-start">Tersetting</div>
              <RingChart
                percentage={avgTersetting}
                color="#10b981" // emerald-500
                label="Rata-rata"
                subLabel={`${itemsTersettingCount} / ${totalItemsCount} item`}
              />
            </CardContent>
          </Card>
        </div> */}

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progres per Tahap */}
        <Card className="shadow-sm border-neutral-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-neutral-800">Progres per Tahap</CardTitle>
              <span className="text-[10px] text-muted-foreground font-medium">Rata-rata</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <HorizontalProgressBar label="Produksi" percentage={avgProduksi} color="bg-blue-500" bgLight="bg-blue-50" />
            <HorizontalProgressBar label="Barang Jadi" percentage={avgPacking} color="bg-blue-500" bgLight="bg-blue-50" />
            <HorizontalProgressBar label="Terkirim" percentage={avgTerkirim} color="bg-emerald-500" bgLight="bg-emerald-50" />
            <HorizontalProgressBar label="Tersetting" percentage={avgTersetting} color="bg-orange-500" bgLight="bg-orange-50" />
            
            {/* Legend for Donut */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] text-neutral-600">Selesai</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-neutral-600">Sebagian</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-[10px] text-neutral-600">Belum</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300"></div><span className="text-[10px] text-neutral-600">Belum Ada Data</span></div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Item */}
        <Card className="shadow-sm border-neutral-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-neutral-800">Status Item</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between px-8">
            <DonutChart total={totalItemsCount} data={donutData} />
            <div className="flex flex-col gap-3">
              {donutData.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-xs font-medium text-neutral-700">{d.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{d.value} item ({totalItemsCount > 0 ? ((d.value / totalItemsCount) * 100).toFixed(1) : 0}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ringkasan Quantity */}
        <Card className="shadow-sm border-neutral-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-neutral-800">Ringkasan Quantity (QTY)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-neutral-700 h-9">Kategori</TableHead>
                  <TableHead className="text-xs font-bold text-neutral-700 h-9 text-center">Total QTY</TableHead>
                  <TableHead className="text-xs font-bold text-neutral-700 h-9 text-right pr-4">Persentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs text-neutral-600 py-2">Selesai</TableCell>
                  <TableCell className="text-xs text-center py-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{qtySelesai}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right pr-4 py-2">{totalQtyOrder > 0 ? ((qtySelesai / totalQtyOrder) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-neutral-600 py-2">Sebagian</TableCell>
                  <TableCell className="text-xs text-center py-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{qtySebagian}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right pr-4 py-2">{totalQtyOrder > 0 ? ((qtySebagian / totalQtyOrder) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-neutral-600 py-2">Belum</TableCell>
                  <TableCell className="text-xs text-center py-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{qtyBelum}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right pr-4 py-2">{totalQtyOrder > 0 ? ((qtyBelum / totalQtyOrder) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
                <TableRow className="bg-neutral-50/50 font-bold">
                  <TableCell className="text-xs text-neutral-900 py-3 border-t">Total</TableCell>
                  <TableCell className="text-xs text-center text-neutral-900 py-3 border-t">{totalQtyOrder}</TableCell>
                  <TableCell className="text-xs text-right pr-4 text-neutral-900 py-3 border-t">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="shadow-sm border-neutral-100 overflow-hidden">
        <CardHeader className="pb-4 pt-4 px-4 bg-white flex flex-row items-center justify-between border-b border-neutral-100/60">
          <CardTitle className="text-sm font-bold text-neutral-800">Ringkasan Item per Tahap</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={handleExportExcel}
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            Export XLS
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center text-[10px] font-bold text-neutral-500 tracking-wider">#</TableHead>
                <TableHead className="text-[10px] font-bold text-neutral-500 tracking-wider min-w-[200px]">ITEM NAME</TableHead>
                <TableHead className="text-[10px] font-bold text-neutral-500 tracking-wider min-w-[120px]">VOL/DIM</TableHead>
                <TableHead className="w-16 text-center text-[10px] font-bold text-neutral-500 tracking-wider">QTY</TableHead>
                <TableHead className="text-[10px] font-bold text-neutral-500 tracking-wider">PO DIVISI</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-neutral-500 tracking-wider">PRODUKSI</span>
                    <span className="text-[9px] text-muted-foreground font-normal mt-0.5">Progress</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-neutral-500 tracking-wider">BARANG JADI</span>
                    <span className="text-[9px] text-muted-foreground font-normal mt-0.5">Progress</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-neutral-500 tracking-wider">TERKIRIM</span>
                    <span className="text-[9px] text-muted-foreground font-normal mt-0.5">Progress</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-neutral-500 tracking-wider">TERSETTING</span>
                    <span className="text-[9px] text-muted-foreground font-normal mt-0.5">Progress</span>
                  </div>
                </TableHead>
                <TableHead className="text-center text-[10px] font-bold text-neutral-500 tracking-wider min-w-[100px]">STATUS AKHIR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-muted-foreground h-24">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row, i) => (
                  <TableRow key={i} className="hover:bg-neutral-50/50">
                    <TableCell className="text-center text-xs text-neutral-500">{row.no}</TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-neutral-800">{row.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-blue-600">{row.volDim.volume}</span>
                        <span className="text-[10px] text-muted-foreground">{row.volDim.dim} {row.volDim.satuan}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-bold text-neutral-900">{row.qty}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-emerald-600 uppercase">{row.poDivisi}</span>
                    </TableCell>
                    {/* Produksi Progress */}
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <span className="text-xs font-bold text-neutral-700 w-8 text-right">{Math.round(row.produksi.progress)}%</span>
                        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${row.produksi.progress}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    {/* Packing Progress */}
                    <TableCell className="text-center">
                      {row.packing.text === 'Record' && row.packing.progress === 0 ? (
                        <span className="text-[10px] text-neutral-400">Record</span>
                      ) : row.packing.text ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0 h-5 text-[10px]">{row.packing.text}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* Terkirim Progress */}
                    <TableCell className="text-center">
                      {row.terkirim.text && row.terkirim.text !== '-' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0 h-5 text-[10px]">{row.terkirim.text}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* Tersetting Progress */}
                    <TableCell className="text-center">
                      {row.tersetting.text && row.tersetting.text !== '-' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0 h-5 text-[10px]">{row.tersetting.text}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "px-2 py-0.5 h-6 text-[10px] font-bold w-16 justify-center",
                          row.statusAkhir === 'Selesai' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          row.statusAkhir === 'Sebagian' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          row.statusAkhir === 'Belum' ? "bg-orange-50 text-orange-700 border-orange-200" :
                          "bg-neutral-100 text-neutral-500 border-neutral-200"
                        )}
                      >
                        {row.statusAkhir}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
