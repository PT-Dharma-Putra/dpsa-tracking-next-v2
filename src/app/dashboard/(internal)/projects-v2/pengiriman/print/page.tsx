'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Loader2, Pencil } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as XLSX from 'xlsx-js-style';

import { PengirimanService, DetailPengiriman } from '@/features/pengiriman/services/pengiriman-service';

export default function PrintSuratJalanPage() {
  const searchParams = useSearchParams();
  const rawIds = searchParams.get('ids') || searchParams.get('id') || '';
  const idList = React.useMemo(() => {
    return rawIds
      .split(',')
      .map((x) => parseInt(x.trim()))
      .filter((x) => !isNaN(x) && x > 0);
  }, [rawIds]);

  const [activeTab, setActiveTab] = React.useState('surat-jalan');
  const [editedSetrimNo, setEditedSetrimNo] = React.useState<string | null>(
    null
  );
  const [preparedByName, setPreparedByName] = React.useState<string>('');
  const [preparedByDate, setPreparedByDate] = React.useState<string>('');
  const [itemsPerPageSetting, setItemsPerPageSetting] = React.useState<number | 'auto'>('auto');

  // Fetch all requested shipments in parallel
  const { data: shipmentsList = [], isLoading } = useQuery({
    queryKey: ['pengiriman-print-batch', idList],
    queryFn: async () => {
      const results = await Promise.all(
        idList.map((shipmentId) => PengirimanService.getPengirimanById(shipmentId))
      );
      return results.filter(Boolean);
    },
    enabled: idList.length > 0,
  });

  // Combine details from all selected shipments into one list
  const combinedDetails = React.useMemo(() => {
    const list: DetailPengiriman[] = [];
    shipmentsList.forEach((s) => {
      if (s.details && s.details.length > 0) {
        list.push(...s.details);
      }
    });
    return list;
  }, [shipmentsList]);

  // Combine metadata into single unified header strings
  const combinedMeta = React.useMemo(() => {
    const clientName =
      Array.from(new Set(shipmentsList.map((s) => s.client?.name).filter(Boolean))).join(', ') || '-';
    const noKendaraan =
      Array.from(new Set(shipmentsList.map((s) => s.no_kendaraan).filter(Boolean))).join(', ') || '-';
    const supir =
      Array.from(new Set(shipmentsList.map((s) => s.supir).filter(Boolean))).join(', ') || '-';
    const noHp =
      Array.from(new Set(shipmentsList.map((s) => s.no_hp).filter(Boolean))).join(', ') || '-';
    const suratJalanNo =
      Array.from(new Set(shipmentsList.map((s) => s.surat_jalan).filter(Boolean))).join(', ') || '-';

    const spkNumberStr =
      Array.from(
        new Set(
          combinedDetails
            .map((d) => d.project_item?.project?.spk_number)
            .filter(Boolean)
        )
      ).join(', ') || '-';

    const setrimNo =
      suratJalanNo !== '-'
        ? suratJalanNo.replace(/\/SJ\//g, '/SERTRIM/')
        : '-';

    return {
      clientName,
      noKendaraan,
      supir,
      noHp,
      suratJalanNo,
      spkNumberStr,
      setrimNo,
    };
  }, [shipmentsList, combinedDetails]);

  // Split details into pages (auto-balanced, max 14 items per page by default)
  const pagedDetails = React.useMemo(() => {
    if (combinedDetails.length === 0) return [[]];
    const maxPerPage = itemsPerPageSetting === 'auto' ? 14 : itemsPerPageSetting;
    if (combinedDetails.length <= maxPerPage) {
      return [combinedDetails];
    }
    const totalItems = combinedDetails.length;
    const numPages = Math.ceil(totalItems / maxPerPage);
    const itemsPerPage = Math.ceil(totalItems / numPages);

    const pages: DetailPengiriman[][] = [];
    for (let i = 0; i < totalItems; i += itemsPerPage) {
      pages.push(combinedDetails.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [combinedDetails, itemsPerPageSetting]);

  // Trigger browser print dialog when data is loaded
  React.useEffect(() => {
    if (shipmentsList.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shipmentsList]);

  const downloadExcel = () => {
    if (shipmentsList.length === 0) return;

    try {
      const wb = XLSX.utils.book_new();
      const titleStyle = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
      const boldStyle = { font: { bold: true, sz: 10 } };
      const normalStyle = { font: { sz: 10 } };
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

      const isSuratJalan = activeTab === 'surat-jalan';
      const borderThin = { style: 'thin' } as const;

      let wsData: any[][] = [];
      let merges: any[] = [];

      if (isSuratJalan) {
        // SURAT JALAN Layout
        wsData.push([]); // 1
        wsData.push([]); // 2
        wsData.push([
          { v: 'SURAT JALAN', t: 's', s: titleStyle },
          '', '', '', '', '', '', '', '', '', '',
        ]); // 3
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 10 } });

        wsData.push([]); // 4
        wsData.push([]); // 5

        wsData.push([
          { v: 'PPIC', t: 's', s: { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          { v: 'Rev : 00', t: 's', s: { font: { sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          '', '', '', '',
          { v: 'Tujuan', t: 's', s: normalStyle },
          '',
          { v: `: ${combinedMeta.clientName}`, t: 's', s: boldStyle },
        ]);
        let rTujuan = wsData.length - 1;
        merges.push({ s: { r: rTujuan, c: 6 }, e: { r: rTujuan, c: 7 } });

        wsData.push([
          { v: '004', t: 's', s: { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          { v: 'Terbit : 8/25', t: 's', s: { font: { sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          '', '', '', '',
          { v: 'No. Kendaraan', t: 's', s: normalStyle },
          '',
          { v: `: ${combinedMeta.noKendaraan}`, t: 's', s: normalStyle },
        ]);
        let rKendaraan = wsData.length - 1;
        merges.push({ s: { r: rKendaraan, c: 6 }, e: { r: rKendaraan, c: 7 } });

        wsData.push([
          '', '', '', '', '', '',
          { v: 'Nama Sopir', t: 's', s: normalStyle },
          '',
          { v: `: ${combinedMeta.supir}`, t: 's', s: normalStyle },
        ]);
        let rSupir = wsData.length - 1;
        merges.push({ s: { r: rSupir, c: 6 }, e: { r: rSupir, c: 7 } });

        wsData.push([
          '', '', '', '', '', '',
          { v: 'No. Telepon', t: 's', s: normalStyle },
          '',
          { v: `: ${combinedMeta.noHp}`, t: 's', s: normalStyle },
        ]);
        let rNoHp = wsData.length - 1;
        merges.push({ s: { r: rNoHp, c: 6 }, e: { r: rNoHp, c: 7 } });

        wsData.push([]);

        const rHeader1 = wsData.length;
        wsData.push([
          { v: 'NO', t: 's', s: headerStyle },
          { v: 'NO. SPK', t: 's', s: headerStyle },
          { v: 'RUANG', t: 's', s: headerStyle },
          { v: 'ITEM/PERABOT', t: 's', s: headerStyle },
          { v: 'DIMENSI (METER)', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: 'VOL', t: 's', s: headerStyle },
          { v: 'SAT', t: 's', s: headerStyle },
          { v: 'JML', t: 's', s: headerStyle },
          { v: 'KET', t: 's', s: headerStyle },
        ]);

        const rHeader2 = wsData.length;
        wsData.push([
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: 'P', t: 's', s: headerStyle },
          { v: 'L', t: 's', s: headerStyle },
          { v: 'T', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
        ]);

        merges.push({ s: { r: rHeader1, c: 0 }, e: { r: rHeader2, c: 0 } });
        merges.push({ s: { r: rHeader1, c: 1 }, e: { r: rHeader2, c: 1 } });
        merges.push({ s: { r: rHeader1, c: 2 }, e: { r: rHeader2, c: 2 } });
        merges.push({ s: { r: rHeader1, c: 3 }, e: { r: rHeader2, c: 3 } });
        merges.push({ s: { r: rHeader1, c: 4 }, e: { r: rHeader1, c: 6 } });
        merges.push({ s: { r: rHeader1, c: 7 }, e: { r: rHeader2, c: 7 } });
        merges.push({ s: { r: rHeader1, c: 8 }, e: { r: rHeader2, c: 8 } });
        merges.push({ s: { r: rHeader1, c: 9 }, e: { r: rHeader2, c: 9 } });
        merges.push({ s: { r: rHeader1, c: 10 }, e: { r: rHeader2, c: 10 } });

        combinedDetails.forEach((detail, index) => {
          wsData.push([
            { v: index + 1, t: 'n', s: dataStyleCenter },
            { v: detail.project_item?.project?.spk_number || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.ruang || '-', t: 's', s: dataStyleLeft },
            { v: detail.project_item?.item || '-', t: 's', s: dataStyleLeft },
            { v: detail.project_item?.panjang || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.lebar || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.tinggi || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.volume ?? '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.satuan || '-', t: 's', s: dataStyleCenter },
            { v: detail.jumlah_keluar || 0, t: 'n', s: dataStyleCenter },
            { v: detail.keterangan || '-', t: 's', s: dataStyleLeft },
          ]);
        });

        wsData.push([]);
        wsData.push([
          { v: `Yogyakarta, ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}`, t: 's', s: boldStyle },
          '', '', '', '', '', '', '', '', '', '',
        ]);
        let rYogyakarta = wsData.length - 1;
        merges.push({ s: { r: rYogyakarta, c: 0 }, e: { r: rYogyakarta, c: 3 } });
        wsData.push([]);

        const centerStyle = { font: { sz: 10 }, alignment: { horizontal: 'center' } };
        const centerBoldStyle = { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } };

        wsData.push([
          { v: 'Diserahkan Oleh:', t: 's', s: centerStyle }, '', '',
          { v: 'Diterima Oleh:', t: 's', s: centerStyle }, '',
          { v: 'Mengetahui:', t: 's', s: centerStyle }, '', '',
          { v: 'Diterima Oleh:', t: 's', s: centerStyle }, '', '',
        ]);
        const sigRow1 = wsData.length - 1;
        merges.push({ s: { r: sigRow1, c: 0 }, e: { r: sigRow1, c: 2 } });
        merges.push({ s: { r: sigRow1, c: 3 }, e: { r: sigRow1, c: 4 } });
        merges.push({ s: { r: sigRow1, c: 5 }, e: { r: sigRow1, c: 7 } });
        merges.push({ s: { r: sigRow1, c: 8 }, e: { r: sigRow1, c: 10 } });

        wsData.push([
          { v: 'Petugas Gudang', t: 's', s: centerBoldStyle }, '', '',
          { v: 'Petugas Pengiriman', t: 's', s: centerBoldStyle }, '',
          { v: 'Security DPSA', t: 's', s: centerBoldStyle }, '', '',
          { v: 'Konsumen', t: 's', s: centerBoldStyle }, '', '',
        ]);
        const sigRow2 = wsData.length - 1;
        merges.push({ s: { r: sigRow2, c: 0 }, e: { r: sigRow2, c: 2 } });
        merges.push({ s: { r: sigRow2, c: 3 }, e: { r: sigRow2, c: 4 } });
        merges.push({ s: { r: sigRow2, c: 5 }, e: { r: sigRow2, c: 7 } });
        merges.push({ s: { r: sigRow2, c: 8 }, e: { r: sigRow2, c: 10 } });

        wsData.push([], [], []);

        wsData.push([
          { v: '( ............................ )', t: 's', s: centerStyle }, '', '',
          { v: '( ............................ )', t: 's', s: centerStyle }, '',
          { v: '( ............................ )', t: 's', s: centerStyle }, '', '',
          { v: '( ............................ )', t: 's', s: centerStyle }, '', '',
        ]);
        const sigRow3 = wsData.length - 1;
        merges.push({ s: { r: sigRow3, c: 0 }, e: { r: sigRow3, c: 2 } });
        merges.push({ s: { r: sigRow3, c: 3 }, e: { r: sigRow3, c: 4 } });
        merges.push({ s: { r: sigRow3, c: 5 }, e: { r: sigRow3, c: 7 } });
        merges.push({ s: { r: sigRow3, c: 8 }, e: { r: sigRow3, c: 10 } });
      } else {
        // SETRIM Layout
        wsData.push([]);
        wsData.push([
          { v: 'SURAT SERAH TERIMA BARANG', t: 's', s: { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center', vertical: 'center' } } },
          '', '', '', '', '', '', '', '', '',
        ]);
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });

        wsData.push([]);

        const noSrt = editedSetrimNo !== null ? editedSetrimNo : combinedMeta.setrimNo;
        wsData.push([
          { v: 'Nomor Surat', t: 's', s: boldStyle }, '',
          { v: noSrt, t: 's', s: { ...normalStyle, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          '', '', '', '', '',
          { v: 'PPIC', t: 's', s: { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          { v: 'Rev : 00', t: 's', s: { font: { sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
        ]);
        let rNomor = wsData.length - 1;
        merges.push({ s: { r: rNomor, c: 0 }, e: { r: rNomor, c: 1 } });

        wsData.push([
          '', '', '', '', '', '', '', '',
          { v: '005', t: 's', s: { font: { bold: true, sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          { v: 'Terbit : 8/25', t: 's', s: { font: { sz: 8 }, alignment: { horizontal: 'center' }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
        ]);

        wsData.push([
          { v: 'Tujuan Pengiriman/Penerima', t: 's', s: boldStyle }, '',
          { v: combinedMeta.clientName, t: 's', s: { font: { bold: true, sz: 10 }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          '', '', '', '', '', '',
        ]);
        let rTujuan = wsData.length - 1;
        merges.push({ s: { r: rTujuan, c: 0 }, e: { r: rTujuan, c: 1 } });

        wsData.push([]);

        wsData.push([
          { v: 'Tanggal Terima Barang*)', t: 's', s: boldStyle }, '',
          { v: '', t: 's', s: { border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          '',
          { v: 'No. SPK/SPH', t: 's', s: boldStyle },
          { v: ':', t: 's', s: normalStyle },
          { v: combinedMeta.spkNumberStr, t: 's', s: { font: { bold: true, sz: 10 }, border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin } } },
          '', '', '', '',
        ]);
        let rTanggal = wsData.length - 1;
        merges.push({ s: { r: rTanggal, c: 0 }, e: { r: rTanggal, c: 1 } });
        merges.push({ s: { r: rTanggal, c: 4 }, e: { r: rTanggal, c: 5 } });
        merges.push({ s: { r: rTanggal, c: 6 }, e: { r: rTanggal, c: 9 } });

        wsData.push([]);

        wsData.push([
          { v: 'Telah diterima barang - barang pesanan dari PT DHARMA PUTRA SEJAHTERA ABADI, berupa:', t: 's', s: boldStyle },
          '', '', '', '', '', '', '', '', '',
        ]);
        let rTelah = wsData.length - 1;
        merges.push({ s: { r: rTelah, c: 0 }, e: { r: rTelah, c: 9 } });

        wsData.push([]);

        wsData.push([
          { v: 'NO.', t: 's', s: headerStyle },
          { v: 'RUANG', t: 's', s: headerStyle },
          { v: 'ITEM/PERABOT**)', t: 's', s: headerStyle },
          { v: 'DIMENSI (METER)', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: 'VOL', t: 's', s: headerStyle },
          { v: 'SAT', t: 's', s: headerStyle },
          { v: 'JML', t: 's', s: headerStyle },
          { v: 'KET', t: 's', s: headerStyle },
        ]);
        let rHeader1 = wsData.length - 1;

        wsData.push([
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: 'P', t: 's', s: headerStyle },
          { v: 'L', t: 's', s: headerStyle },
          { v: 'T', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
          { v: '', t: 's', s: headerStyle },
        ]);
        let rHeader2 = wsData.length - 1;

        merges.push({ s: { r: rHeader1, c: 0 }, e: { r: rHeader2, c: 0 } });
        merges.push({ s: { r: rHeader1, c: 1 }, e: { r: rHeader2, c: 1 } });
        merges.push({ s: { r: rHeader1, c: 2 }, e: { r: rHeader2, c: 2 } });
        merges.push({ s: { r: rHeader1, c: 3 }, e: { r: rHeader1, c: 5 } });
        merges.push({ s: { r: rHeader1, c: 6 }, e: { r: rHeader2, c: 6 } });
        merges.push({ s: { r: rHeader1, c: 7 }, e: { r: rHeader2, c: 7 } });
        merges.push({ s: { r: rHeader1, c: 8 }, e: { r: rHeader2, c: 8 } });
        merges.push({ s: { r: rHeader1, c: 9 }, e: { r: rHeader2, c: 9 } });

        combinedDetails.forEach((detail, index) => {
          wsData.push([
            { v: index + 1, t: 'n', s: dataStyleCenter },
            { v: detail.project_item?.ruang || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.item || '-', t: 's', s: dataStyleLeft },
            { v: detail.project_item?.panjang || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.lebar || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.tinggi || '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.volume ?? '-', t: 's', s: dataStyleCenter },
            { v: detail.project_item?.satuan || '-', t: 's', s: dataStyleCenter },
            { v: detail.jumlah_keluar || 0, t: 'n', s: dataStyleCenter },
            { v: detail.keterangan || '-', t: 's', s: dataStyleLeft },
          ]);
        });

        wsData.push([]);

        wsData.push([
          { v: 'Note:', t: 's', s: { font: { italic: true, sz: 10 } } },
          { v: '**) Item / perabot yang ditulis harus sama dengan yang tertulis di SPK/SPH jika barang yang dikirim tidak dalam', t: 's', s: { font: { italic: true, sz: 10 } } },
          '', '', '', '', '', '', '', '',
        ]);
        merges.push({ s: { r: wsData.length - 1, c: 1 }, e: { r: wsData.length - 1, c: 9 } });

        wsData.push([
          '', { v: 'satu SPK/SP/RAB, harus dibuatkan di lembar yang berbeda (sesuai SPK/SPH)', t: 's', s: { font: { italic: true, sz: 10 } } },
          '', '', '', '', '', '', '', '',
        ]);
        merges.push({ s: { r: wsData.length - 1, c: 1 }, e: { r: wsData.length - 1, c: 9 } });

        wsData.push([
          '', { v: 'Rangkap 2 : (Asli untuk konsumen)(lembar ke 2 setelah di ttd konsumen kemudian diserahkan ke Keuangan)', t: 's', s: { font: { italic: true, sz: 10 } } },
          '', '', '', '', '', '', '', '',
        ]);
        merges.push({ s: { r: wsData.length - 1, c: 1 }, e: { r: wsData.length - 1, c: 9 } });

        wsData.push([
          '', { v: 'Untuk setiap barang yang sudah dikirim harus diserahterimakan dan ditandatangani oleh pihak jangum', t: 's', s: { font: { italic: true, sz: 10 } } },
          '', '', '', '', '', '', '', '',
        ]);
        merges.push({ s: { r: wsData.length - 1, c: 1 }, e: { r: wsData.length - 1, c: 9 } });

        wsData.push([
          '', { v: 'Apabila surat sudah ditandatangani mohon difoto sebagai bukti dan dikirim ke nomor (wa)085712330344', t: 's', s: { font: { italic: true, sz: 10 } } },
          '', '', '', '', '', '', '', '',
        ]);
        merges.push({ s: { r: wsData.length - 1, c: 1 }, e: { r: wsData.length - 1, c: 9 } });

        wsData.push([], []);

        const centerStyle = { font: { sz: 10 }, alignment: { horizontal: 'center' } };
        const centerBoldStyle = { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' } };

        wsData.push([
          { v: 'Disiapkan oleh,', t: 's', s: centerBoldStyle }, '', '',
          { v: 'Diserahkan oleh,', t: 's', s: centerBoldStyle }, '', '',
          { v: 'Diterima oleh,', t: 's', s: centerBoldStyle }, '', '', '',
        ]);
        const sigRow1 = wsData.length - 1;
        merges.push({ s: { r: sigRow1, c: 0 }, e: { r: sigRow1, c: 2 } });
        merges.push({ s: { r: sigRow1, c: 3 }, e: { r: sigRow1, c: 5 } });
        merges.push({ s: { r: sigRow1, c: 6 }, e: { r: sigRow1, c: 9 } });

        wsData.push([], [], []);

        wsData.push([
          { v: preparedByName ? preparedByName : '( ............................ )', t: 's', s: centerStyle }, '', '',
          { v: '( ............................ )', t: 's', s: centerStyle }, '', '',
          { v: '( ............................ )', t: 's', s: centerStyle }, '', '', '',
        ]);
        const sigRowName = wsData.length - 1;
        merges.push({ s: { r: sigRowName, c: 0 }, e: { r: sigRowName, c: 2 } });
        merges.push({ s: { r: sigRowName, c: 3 }, e: { r: sigRowName, c: 5 } });
        merges.push({ s: { r: sigRowName, c: 6 }, e: { r: sigRowName, c: 9 } });

        wsData.push([
          { v: preparedByDate ? `Tgl. ${preparedByDate}` : 'Tgl. _________________', t: 's', s: centerStyle }, '', '',
          { v: 'Tgl. _________________', t: 's', s: centerStyle }, '', '',
          { v: 'Tgl. _________________', t: 's', s: centerStyle }, '', '', '',
        ]);
        const sigRow2 = wsData.length - 1;
        merges.push({ s: { r: sigRow2, c: 0 }, e: { r: sigRow2, c: 2 } });
        merges.push({ s: { r: sigRow2, c: 3 }, e: { r: sigRow2, c: 5 } });
        merges.push({ s: { r: sigRow2, c: 6 }, e: { r: sigRow2, c: 9 } });
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!merges'] = merges;
      ws['!cols'] = isSuratJalan
        ? [{ wch: 4 }, { wch: 11 }, { wch: 15 }, { wch: 24 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 6 }, { wch: 5 }, { wch: 5 }, { wch: 5 }]
        : [{ wch: 4 }, { wch: 18 }, { wch: 26 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 8 }];

      ws['!margins'] = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
      ws['!pageSetup'] = { orientation: 'portrait', paperSize: 9, fitToWidth: 1, fitToHeight: 0 };

      const sheetName = isSuratJalan ? 'Surat Jalan' : 'Setrim';
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const fileName = `${isSuratJalan ? 'Surat_Jalan' : 'Setrim'}_Gabungan_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting excel', error);
      alert('Gagal export excel');
    }
  };

  const downloadDocx = () => {
    if (shipmentsList.length === 0) return;

    const content = document.getElementById('print-area')?.innerHTML || '';

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Surat Jalan</title>
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; border: 1px solid #000000; }
          th { background-color: #f5f5f5; font-weight: bold; border: 1px solid #000000; padding: 6px; }
          td { border: 1px solid #000000; padding: 6px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: bold; }
          .hidden { display: none; }
          .print\:hidden { display: none !important; }
          .print\:inline-block { display: inline-block !important; }
          .w-full { width: 100%; }
          .w-64 { width: 256px; }
          .w-48 { width: 192px; }
          .w-32 { width: 128px; }
          .mb-8 { margin-bottom: 30px; }
          .mb-6 { margin-bottom: 20px; }
          .mt-8 { margin-top: 30px; }
          .mt-6 { margin-top: 20px; }
          .grid { display: table; width: 100%; }
          .grid-cols-2 { display: table; width: 100%; }
          .grid-cols-2 > div { display: table-cell; width: 50%; vertical-align: top; }
          .grid-cols-4 { display: table; width: 100%; }
          .grid-cols-4 > div { display: table-cell; width: 25%; text-align: center; vertical-align: top; }
          .border-b-2 { border-bottom: 2px solid #000000; }
          .border-b { border-bottom: 1px solid #000000; }
          .pb-4 { padding-bottom: 15px; }
          .pb-1 { padding-bottom: 5px; }
          .mb-1 { margin-bottom: 5px; }
          .text-xl { font-size: 18px; font-weight: bold; }
          .text-lg { font-size: 14px; font-weight: bold; }
          .text-base { font-size: 12px; font-weight: bold; }
          .text-xs { font-size: 10px; }
          .uppercase { text-transform: uppercase; }
          .space-y-1 > div { margin-bottom: 3px; }
          .font-mono { font-family: Courier, monospace; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + html], {
      type: 'application/msword',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab === 'surat-jalan' ? 'Surat_Jalan' : 'Setrim'}_Gabungan_${new Date().getTime()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center bg-white'>
        <div className='flex flex-col items-center space-y-3'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm text-neutral-500'>
            Mempersiapkan dokumen Surat Jalan...
          </p>
        </div>
      </div>
    );
  }

  if (!shipmentsList || shipmentsList.length === 0) {
    return (
      <div className='p-8 text-center text-red-600 bg-white h-screen'>
        Data pengiriman tidak ditemukan. Pastikan ID pengiriman benar.
      </div>
    );
  }

  return (
    <div className='bg-white min-h-screen print:min-h-0 print:h-auto p-4 print:p-0 print:m-0 text-black font-sans'>
      {/* CSS overrides to hide everything else on print */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          /* 1. Hide non-printable elements completely from document flow */
          header,
          aside,
          nav,
          [data-slot="sidebar"],
          [data-slot="sidebar-gap"],
          [data-slot="sidebar-container"],
          [data-sidebar="sidebar"],
          [data-slot="sidebar-wrapper"] > aside,
          .no-print,
          [data-sonner-toaster] {
            display: none !important;
          }

          /* 2. Reset html, body and layout ancestors */
          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }

          [data-slot="sidebar-wrapper"],
          [data-slot="sidebar-inset"],
          main,
          body > div {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: transparent !important;
            width: 100% !important;
          }

          /* 3. Print area container */
          #print-area {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* 4. Page break handling */
          .print-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            break-before: auto !important;
            page-break-before: auto !important;
          }

          .print-page:first-child,
          .print-page:first-of-type {
            break-before: avoid !important;
            page-break-before: avoid !important;
          }

          .print-page.last-page,
          .print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          table {
            page-break-inside: avoid;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }
        }
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
      `,
        }}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full no-print'>
        <div className='no-print mb-4'>
          <TabsList>
            <TabsTrigger value='surat-jalan'>Surat Jalan</TabsTrigger>
            <TabsTrigger value='setrim'>Setrim</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Action bar for screen view */}
      <div className='no-print mb-6 p-4 bg-neutral-100 rounded-lg border border-neutral-200 flex justify-between items-center'>
        <div>
          <h2 className='font-semibold text-neutral-800 text-sm'>
            {activeTab === 'surat-jalan'
              ? `Pratinjau Surat Jalan (${shipmentsList.length} Pengiriman Gabungan — ${combinedDetails.length} Item — ${pagedDetails.length} Halaman)`
              : `Pratinjau Setrim (${shipmentsList.length} Pengiriman Gabungan — ${combinedDetails.length} Item — ${pagedDetails.length} Halaman)`}
          </h2>
          <p className='text-xs text-neutral-500'>
            Halaman ini diformat untuk cetak A4. Tanda tangan otomatis disertakan di setiap halaman cetak.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1.5 text-xs text-neutral-700 bg-white px-2.5 py-1.5 rounded border border-neutral-300'>
            <span className='font-medium text-neutral-600'>Baris/Hal:</span>
            <select
              value={itemsPerPageSetting}
              onChange={(e) =>
                setItemsPerPageSetting(
                  e.target.value === 'auto' ? 'auto' : parseInt(e.target.value)
                )
              }
              className='bg-transparent text-xs font-semibold outline-none cursor-pointer'
            >
              <option value='auto'>Otomatis ({pagedDetails[0]?.length || 14})</option>
              <option value='10'>10 Baris</option>
              <option value='12'>12 Baris</option>
              <option value='14'>14 Baris</option>
              <option value='16'>16 Baris</option>
            </select>
          </div>
          <button
            onClick={downloadExcel}
            className='px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors shadow-xs'
          >
            Download Excel
          </button>
          <button
            onClick={() => window.print()}
            className='px-4 py-2 bg-neutral-800 text-white rounded text-sm font-medium hover:bg-neutral-900 transition-colors shadow-xs'
          >
            Cetak Manual
          </button>
        </div>
      </div>

      {/* Print Content Area */}
      <div id='print-area' className='max-w-[800px] mx-auto text-black font-sans print:max-w-none print:m-0 print:p-0'>
        {activeTab === 'surat-jalan' ? (
          pagedDetails.map((pageItems, pageIdx) => {
            const pageStartIndex = pagedDetails
              .slice(0, pageIdx)
              .reduce((acc, p) => acc + p.length, 0);

            return (
              <div
                key={`sj-page-${pageIdx}`}
                className={`print-page bg-white shadow-md border border-neutral-300 rounded-sm mb-8 p-6 print:p-0 print:border-none print:shadow-none print:rounded-none print:mb-0 ${
                  pageIdx === pagedDetails.length - 1 ? 'last-page' : ''
                }`}
              >
                {/* Header (SURAT JALAN Title & No only) */}
                <div className='flex justify-between items-center mb-4 print:mb-2 pt-2 print:pt-0'>
                  <div className='w-24 no-print'></div>
                  <div className='flex-1 text-center'>
                    <h2 className='text-lg font-bold pb-0.5 mb-0.5 uppercase print:mt-0 print:pt-0'>
                      SURAT JALAN
                    </h2>
                  </div>
                  <div className='w-24 text-right text-[11px] font-semibold text-neutral-600'>
                    {pagedDetails.length > 1 && `Hal. ${pageIdx + 1} / ${pagedDetails.length}`}
                  </div>
                </div>

                {/* Metadata Section */}
                <div className='flex justify-between items-start mb-5 print:mb-3 text-sm'>
                  <div className='w-40 border border-black text-[10px] grid grid-cols-2 text-center bg-white'>
                    <div className='border-r border-b border-black py-0.5 font-semibold'>
                      PPIC
                    </div>
                    <div className='border-b border-black py-0.5'>Rev : 00</div>
                    <div className='border-r border-black py-0.5 font-semibold'>
                      004
                    </div>
                    <div className='py-0.5'>Terbit : 8/25</div>
                  </div>

                  {/* Pengiriman Info */}
                  <div className='space-y-1 text-xs w-72'>
                    <div className='grid grid-cols-3 gap-2'>
                      <span className='text-neutral-500'>Tujuan</span>
                      <span className='col-span-2 font-semibold'>
                        : {combinedMeta.clientName}
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-2'>
                      <span className='text-neutral-500'>No. Kendaraan</span>
                      <span className='col-span-2'>
                        : {combinedMeta.noKendaraan}
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-2'>
                      <span className='text-neutral-500'>Nama Sopir</span>
                      <span className='col-span-2'>: {combinedMeta.supir}</span>
                    </div>
                    <div className='grid grid-cols-3 gap-2'>
                      <span className='text-neutral-500'>No. Telepon</span>
                      <span className='col-span-2'>: {combinedMeta.noHp}</span>
                    </div>
                  </div>
                </div>

                {/* Table of Items */}
                <table className='w-full text-[11px] text-left border border-black mb-6 print:mb-3 border-collapse'>
                  <thead>
                    <tr className='bg-neutral-100 border-b border-black'>
                      <th className='p-1.5 border-r border-black font-semibold text-center w-10' rowSpan={2}>
                        NO
                      </th>
                      <th className='p-1.5 border-r border-black font-semibold w-20' rowSpan={2}>
                        NO. SPK
                      </th>
                      <th className='p-1.5 border-r border-black font-semibold w-24' rowSpan={2}>
                        RUANG
                      </th>
                      <th className='p-1.5 border-r border-black font-semibold' rowSpan={2}>
                        ITEM/PERABOT
                      </th>
                      <th className='p-1.5 border-r border-black font-semibold w-24 text-center' colSpan={3}>
                        DIMENSI (METER)
                      </th>
                      <th className='p-1.5 border-r border-black font-semibold w-16 text-center' rowSpan={2}>
                        VOL
                      </th>
                      <th className='p-1.5 border-r border-black font-semibold w-16 text-center' rowSpan={2}>
                        SAT
                      </th>
                      <th className='p-1.5 border-r border-black font-semibold text-center w-20' rowSpan={2}>
                        JML
                      </th>
                      <th className='p-1.5 font-semibold text-center w-24' rowSpan={2}>
                        KET
                      </th>
                    </tr>
                    <tr className='bg-neutral-100 border-b border-black'>
                      <th className='p-1 border-r border-black font-semibold w-8 text-center'>
                        P
                      </th>
                      <th className='p-1 border-r border-black font-semibold w-8 text-center'>
                        L
                      </th>
                      <th className='p-1 border-r border-black font-semibold text-center w-8'>
                        T
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((detail, index) => {
                      const globalIdx = pageStartIndex + index + 1;
                      return (
                        <tr key={detail.id || globalIdx} className='border-b border-black last:border-b-0'>
                          <td className='p-1.5 border-r border-black text-center'>
                            {globalIdx}
                          </td>
                          <td className='p-1.5 border-r border-black font-medium'>
                            {detail.project_item?.project?.spk_number || '-'}
                          </td>
                          <td className='p-1.5 border-r border-black'>
                            {detail.project_item?.ruang || '-'}
                          </td>
                          <td className='p-1.5 border-r border-black font-medium'>
                            {detail.project_item?.item || '-'}
                          </td>
                          <td className='p-1.5 border-r border-black text-center'>
                            {detail.project_item?.panjang || '-'}
                          </td>
                          <td className='p-1.5 border-r border-black text-center'>
                            {detail.project_item?.lebar || '-'}
                          </td>
                          <td className='p-1.5 border-r border-black text-center'>
                            {detail.project_item?.tinggi || '-'}
                          </td>
                          <td className='p-1.5 border-r border-black text-center'>
                            {detail.project_item?.volume ?? '-'}
                          </td>
                          <td className='p-1.5 border-r border-black text-center'>
                            {detail.project_item?.satuan || '-'}
                          </td>
                          <td className='p-1.5 border-r border-black text-center font-bold text-xs'>
                            {detail.jumlah_keluar}
                          </td>
                          <td className='p-1.5 text-center text-xs'>
                            {detail.keterangan || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Date and Signature Blocks */}
                <div className='mt-6 print:mt-3 print:break-inside-avoid'>
                  <div className='text-xs font-semibold mb-3 print:mb-2 text-left'>
                    Yogyakarta,{' '}
                    {format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}
                  </div>

                  <div className='grid grid-cols-4 gap-4 text-xs text-center'>
                    <div className='flex flex-col justify-between h-20'>
                      <span>
                        Diserahkan Oleh:<br />
                        <span className='font-semibold'>Petugas Gudang</span>
                      </span>
                      <span className='pt-1 w-3/4 mx-auto'>
                        ( ............................ )
                      </span>
                    </div>
                    <div className='flex flex-col justify-between h-20'>
                      <span>
                        Diterima Oleh:<br />
                        <span className='font-semibold'>Petugas Pengiriman</span>
                      </span>
                      <span className='pt-1 w-3/4 mx-auto'>
                        ( ............................ )
                      </span>
                    </div>
                    <div className='flex flex-col justify-between h-20'>
                      <span>
                        Mengetahui:<br />
                        <span className='font-semibold'>Security DPSA</span>
                      </span>
                      <span className='pt-1 w-3/4 mx-auto'>
                        ( ............................ )
                      </span>
                    </div>
                    <div className='flex flex-col justify-between h-20'>
                      <span>
                        Diterima Oleh:<br />
                        <span className='font-semibold'>Konsumen</span>
                      </span>
                      <span className='pt-1 w-3/4 mx-auto'>
                        ( ............................ )
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          pagedDetails.map((pageItems, pageIdx) => {
            const pageStartIndex = pagedDetails
              .slice(0, pageIdx)
              .reduce((acc, p) => acc + p.length, 0);

            return (
              <div
                key={`setrim-page-${pageIdx}`}
                className={`print-page bg-white shadow-md border border-neutral-300 rounded-sm mb-8 p-6 print:p-0 print:border-none print:shadow-none print:rounded-none print:mb-0 relative font-sans text-black ${
                  pageIdx === pagedDetails.length - 1 ? 'last-page' : ''
                }`}
              >
                {/* SETRIM Header */}
                <div className='flex justify-between items-center mb-4 print:mb-2 pt-2 relative print:pt-0'>
                  <div className='w-24 no-print'></div>
                  <div className='flex-1 text-center'>
                    <h2 className='text-sm font-bold inline-block border-b border-black pb-0.5 print:mt-0 print:pt-0'>
                      SURAT SERAH TERIMA BARANG
                    </h2>
                  </div>
                  <div className='w-24 text-right text-[11px] font-semibold text-neutral-600'>
                    {pagedDetails.length > 1 && `Hal. ${pageIdx + 1} / ${pagedDetails.length}`}
                  </div>
                </div>

                {/* SETRIM Metadata */}
                <div className='space-y-2.5 text-[11px] mb-4 print:mb-2 px-2 print:px-0'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center'>
                      <span className='w-36 font-semibold'>Nomor Surat</span>
                      <span className='mr-2'>:</span>
                      <div className='border border-black px-2 py-0.5 w-48 min-h-[22px] flex items-center group relative focus-within:ring-1 focus-within:ring-black'>
                        <input
                          type='text'
                          value={editedSetrimNo !== null ? editedSetrimNo : combinedMeta.setrimNo}
                          onChange={(e) => setEditedSetrimNo(e.target.value)}
                          className='bg-transparent border-none outline-none w-full p-0 m-0 text-[11px] font-sans text-black'
                          title='Klik untuk mengedit nomor surat'
                        />
                        <Pencil className='w-3 h-3 absolute right-2 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity no-print pointer-events-none' />
                      </div>
                    </div>

                    <div className='w-40 border border-black text-[10px] grid grid-cols-2 text-center bg-white -mt-2'>
                      <div className='border-r border-b border-black py-0.5 font-semibold'>
                        PPIC
                      </div>
                      <div className='border-b border-black py-0.5'>Rev : 00</div>
                      <div className='border-r border-black py-0.5 font-semibold'>
                        005
                      </div>
                      <div className='py-0.5'>Terbit : 8/25</div>
                    </div>
                  </div>

                  <div className='flex items-center'>
                    <span className='w-36 font-semibold shrink-0'>
                      Tujuan Pengiriman/Penerima
                    </span>
                    <span className='mr-2 shrink-0'>:</span>
                    <div className='border border-black px-2 py-0.5 min-w-[192px] max-w-md w-auto min-h-[22px] font-bold uppercase flex items-center text-[11px] leading-tight break-words'>
                      {combinedMeta.clientName}
                    </div>
                  </div>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center shrink-0'>
                      <span className='w-36 font-semibold shrink-0'>
                        Tanggal Terima Barang*)
                      </span>
                      <span className='mr-2 shrink-0'>:</span>
                      <div className='border border-black px-2 py-0.5 w-48 min-h-[22px] shrink-0'></div>
                    </div>
                    <div className='flex items-center flex-1 justify-end min-w-0'>
                      <span className='font-semibold mr-2 text-[10px] whitespace-nowrap shrink-0'>
                        No. SPK/SPH
                      </span>
                      <span className='mr-2 font-semibold text-[10px] shrink-0'>:</span>
                      <div className='border border-black px-2 py-0.5 flex-1 min-h-[22px] flex items-center font-bold text-[10px] leading-tight break-all'>
                        {combinedMeta.spkNumberStr}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='mb-2 text-[11px] font-semibold px-2 print:px-0'>
                  Telah diterima barang - barang pesanan dari PT DHARMA PUTRA
                  SEJAHTERA ABADI, berupa:
                </div>

                {/* SETRIM Table */}
                <div className='px-2 print:px-0'>
                  <table className='w-full text-[11px] text-left border border-black mb-5 print:mb-3 border-collapse'>
                    <thead>
                      <tr className='border-b border-black'>
                        <th className='p-1.5 border-r border-black font-semibold text-center w-8' rowSpan={2}>
                          NO.
                        </th>
                        <th className='p-1.5 border-r border-black font-semibold text-center w-28' rowSpan={2}>
                          RUANG
                        </th>
                        <th className='p-1.5 border-r border-black font-semibold text-center' rowSpan={2}>
                          ITEM/PERABOT**)
                        </th>
                        <th className='p-1.5 border-r border-black font-semibold text-center w-24' colSpan={3}>
                          DIMENSI (METER)
                        </th>
                        <th className='p-1.5 border-r border-black font-semibold text-center w-12' rowSpan={2}>
                          VOL
                        </th>
                        <th className='p-1.5 border-r border-black font-semibold text-center w-12' rowSpan={2}>
                          SAT
                        </th>
                        <th className='p-1.5 border-r border-black font-semibold text-center w-12' rowSpan={2}>
                          JML
                        </th>
                        <th className='p-1.5 font-semibold text-center w-16' rowSpan={2}>
                          KET
                        </th>
                      </tr>
                      <tr className='border-b border-black'>
                        <th className='p-1 border-r border-black font-semibold text-center w-8'>
                          P
                        </th>
                        <th className='p-1 border-r border-black font-semibold text-center w-8'>
                          L
                        </th>
                        <th className='p-1 border-r border-black font-semibold text-center w-8'>
                          T
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((detail, index) => {
                        const globalIdx = pageStartIndex + index + 1;
                        return (
                          <tr key={detail.id || globalIdx} className='border-b border-black h-6'>
                            <td className='p-1.5 border-r border-black text-center'>
                              {globalIdx}
                            </td>
                            <td className='p-1.5 border-r border-black text-center'>
                              {detail.project_item?.ruang || '-'}
                            </td>
                            <td className='p-1.5 border-r border-black uppercase font-medium pl-2'>
                              {detail.project_item?.item || '-'}
                            </td>
                            <td className='p-1.5 border-r border-black text-center'>
                              {detail.project_item?.panjang || '-'}
                            </td>
                            <td className='p-1.5 border-r border-black text-center'>
                              {detail.project_item?.lebar || '-'}
                            </td>
                            <td className='p-1.5 border-r border-black text-center'>
                              {detail.project_item?.tinggi || '-'}
                            </td>
                            <td className='p-1.5 border-r border-black text-center'>
                              {detail.project_item?.volume ?? '-'}
                            </td>
                            <td className='p-1.5 border-r border-black text-center uppercase'>
                              {detail.project_item?.satuan || '-'}
                            </td>
                            <td className='p-1.5 border-r border-black text-center'>
                              {detail.jumlah_keluar}
                            </td>
                            <td className='p-1.5 text-center'>
                              {detail.keterangan || ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* SETRIM Note */}
                <div className='flex flex-row gap-1 text-[10px] text-left mb-5 print:mb-2 px-2 print:px-0 print:break-inside-avoid'>
                  <div>
                    <p>
                      <i>Note: </i>
                    </p>
                  </div>
                  <div className='flex-1'>
                    <p className='leading-tight'>
                      <i>
                        **) Item / perabot yang ditulis harus sama dengan yang
                        tertulis di SPK/SPH jika barang yang dikirim tidak dalam
                        satu SPK/SP/RAB, harus dibuatkan di lembar yang berbeda
                        (sesuai SPK/SPH) Rangkap 2 : (Asli untuk konsumen)(lembar ke
                        2 setelah di ttd konsumen kemudian diserahkan ke Keuangan)
                        Untuk setiap barang yang sudah dikirim harus
                        diserahterimakan dan ditandatangani oleh pihak jangum
                        Apabila surat sudah ditandatangani mohon difoto sebagai
                        bukti dan dikirim ke nomor (wa)085712330344
                      </i>
                    </p>
                  </div>
                </div>

                {/* SETRIM Footer */}
                <div className='grid grid-cols-3 gap-4 text-[11px] text-center mt-6 mb-4 px-12 print:mt-3 print:mb-0 print:px-4 print:break-inside-avoid'>
                  <div className='flex flex-col items-center'>
                    <span className='font-semibold mb-12 print:mb-8'>Disiapkan oleh,</span>
                    <div className='w-32 border-b border-black mb-1 relative group focus-within:ring-1 focus-within:ring-black'>
                      <input
                        type='text'
                        value={preparedByName}
                        onChange={(e) => setPreparedByName(e.target.value)}
                        className='bg-transparent border-none outline-none w-full p-0 m-0 text-[11px] font-sans text-black text-center'
                        placeholder='Nama'
                      />
                      <Pencil className='w-3 h-3 absolute -right-5 bottom-0.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity no-print pointer-events-none' />
                    </div>
                    <div className='flex w-32 text-left mt-1 items-end'>
                      <span className='font-semibold mr-1 text-[10px] mb-0.5'>
                        Tgl.
                      </span>
                      <div className='flex-1 border-b border-black border-dashed relative group focus-within:ring-1 focus-within:ring-black'>
                        <input
                          type='text'
                          value={preparedByDate}
                          onChange={(e) => setPreparedByDate(e.target.value)}
                          className='bg-transparent border-none outline-none w-full p-0 m-0 text-[10px] font-sans text-black text-center'
                          placeholder='DD/MM/YY'
                        />
                        <Pencil className='w-3 h-3 absolute -right-5 bottom-0.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity no-print pointer-events-none' />
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col items-center'>
                    <span className='font-semibold mb-16 print:mb-8'>Diserahkan oleh,</span>
                    <div className='w-32 border-b border-black mb-1 relative'></div>
                    <div className='flex w-32 text-left mt-1'>
                      <span className='font-semibold mr-1 text-[10px]'>Tgl.</span>
                      <span className='flex-1 border-b border-black border-dashed'></span>
                    </div>
                  </div>
                  <div className='flex flex-col items-center'>
                    <span className='font-semibold mb-16 print:mb-8'>Diterima oleh,</span>
                    <div className='w-32 border-b border-black mb-1 relative'></div>
                    <div className='flex w-32 text-left mt-1'>
                      <span className='font-semibold mr-1 text-[10px]'>Tgl.</span>
                      <span className='flex-1 border-b border-black border-dashed'></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
