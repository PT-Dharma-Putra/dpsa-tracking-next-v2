'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { suratSerahTerimaService, SuratSerahTerimaItem } from '@/features/projects/services/surat-serah-terima-service';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function PrintSuratSerahTerimaGambarPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [data, setData] = useState<SuratSerahTerimaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await suratSerahTerimaService.getDetail(id);
      setData(res);
    } catch (err) {
      console.error('Error loading surat serah terima:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2 text-sm text-muted-foreground'>Memuat dokumen serah terima gambar...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-4 text-center'>
        <p className='text-lg font-semibold text-destructive'>Dokumen tidak ditemukan</p>
        <Button variant='outline' onClick={() => router.back()} className='mt-4'>
          Kembali
        </Button>
      </div>
    );
  }

  // Format tanggal surat
  const tanggalDate = data.tanggal ? new Date(data.tanggal) : new Date();
  const tglSingkat = format(tanggalDate, 'dd-MMM', { locale: idLocale });
  const tglLengkapKirim = data.tanggal_kirim ? format(new Date(data.tanggal_kirim), 'dd-MM-yyyy') : format(tanggalDate, 'dd-MM-yyyy');
  const tglLengkapTerima = data.tanggal_terima ? format(new Date(data.tanggal_terima), 'dd-MM-yyyy') : '-';

  // Group items by Client & SPK for rowspan merging
  type GroupedItem = {
    clientName: string;
    nomorSpk: string;
    items: Array<{
      item: string;
      satuan: string;
      jumlah: number;
    }>;
  };

  const grouped: GroupedItem[] = [];
  data.items.forEach((itemRecord) => {
    const pi = itemRecord.project_item;
    const clientName = pi?.project?.client?.name || '-';
    const nomorSpk = pi?.project?.spk?.nomor_spk || '-';
    const itemName = pi?.item || '-';
    const satuan = pi?.satuan || 'UNIT';
    const jumlah = Number(pi?.jumlah || 1);

    let group = grouped.find((g) => g.clientName === clientName && g.nomorSpk === nomorSpk);
    if (!group) {
      group = {
        clientName,
        nomorSpk,
        items: [],
      };
      grouped.push(group);
    }

    // Merge same item within same client & SPK
    const existingSubItem = group.items.find(
      (it) =>
        it.item.trim().toLowerCase() === itemName.trim().toLowerCase() &&
        it.satuan.trim().toLowerCase() === satuan.trim().toLowerCase()
    );

    if (existingSubItem) {
      existingSubItem.jumlah += jumlah;
    } else {
      group.items.push({
        item: itemName,
        satuan,
        jumlah,
      });
    }
  });

  // Calculate filler rows if total rows is less than 16
  const totalItemRows = grouped.reduce((acc, g) => acc + g.items.length, 0);
  const targetRows = Math.max(16, totalItemRows);
  const fillerCount = targetRows - totalItemRows;

  // Header info from kop_surat
  const kop = data.kop_surat;
  const docCode = kop?.nama_identitas_iso && kop?.nomor_identitas_iso 
    ? `${kop.nama_identitas_iso} - ${kop.nomor_identitas_iso}` 
    : (kop?.nomor_identitas_iso ? `STU - ${kop.nomor_identitas_iso}` : 'STU - 004');
  const revCode = kop?.revisi_ke || '01';
  const terbitCode = kop?.terbit || '08/25';
  const logoUrl = kop?.logo || '/Logo.png';

  return (
    <div className='min-h-screen bg-slate-100 p-4 print:bg-white print:p-0'>
      {/* Floating Action Bar (Hidden on Print) */}
      <div className='mx-auto mb-4 flex max-w-[820px] items-center justify-between rounded-lg border bg-white p-3 shadow-sm print:hidden'>
        <Button variant='outline' size='sm' onClick={() => router.back()} className='gap-1.5'>
          <ArrowLeft className='h-4 w-4' />
          Kembali
        </Button>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            Nomor: <strong>{data.nomor_surat}</strong>
          </span>
          <Button size='sm' onClick={handlePrint} className='gap-1.5 bg-blue-600 hover:bg-blue-700'>
            <Printer className='h-4 w-4' />
            Cetak / Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4) */}
      <div className='mx-auto max-w-[820px] border border-black bg-white p-6 shadow-md print:max-w-none print:border-none print:p-4 print:shadow-none font-sans text-black'>
        
        {/* Header Section */}
        <div className='border-2 border-black'>
          <div className='grid grid-cols-12 items-stretch'>
            
            {/* Logo Column */}
            <div className='col-span-2 flex items-center justify-center border-r-2 border-black p-2'>
              <img
                src={logoUrl}
                alt='Logo'
                className='max-h-16 w-auto object-contain'
                onError={(e) => {
                  // Fallback logo svg if image not found
                  (e.target as HTMLImageElement).src = '/logo-dpsa.png';
                }}
              />
            </div>

            {/* Title Column */}
            <div className='col-span-7 flex flex-col items-center justify-center border-r-2 border-black p-2 text-center'>
              <h1 className='text-xl font-bold tracking-wider'>SURAT SERAH TERIMA GAMBAR</h1>
              <span className='text-xs font-semibold text-gray-700 tracking-normal'>
                No: {data.nomor_surat}
              </span>
            </div>

            {/* Document Info Column */}
            <div className='col-span-3 grid grid-cols-2 text-xs'>
              <div className='col-span-2 border-b-2 border-black p-1.5 text-center font-bold text-sm'>
                {docCode}
              </div>
              <div className='border-r-2 border-b-2 border-black p-1 text-center font-semibold'>
                Rev : {revCode}
              </div>
              <div className='border-b-2 border-black p-1 text-center font-semibold'>
                Terbit : {terbitCode}
              </div>
            </div>

          </div>

          {/* Table Header */}
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse text-[11px] font-medium'>
              <thead>
                <tr className='border-t-2 border-b border-black text-center font-bold'>
                  <th className='border-r border-black p-1 w-8'>NO</th>
                  <th className='border-r border-black p-1 w-44'>NAMA KONSUMEN</th>
                  <th className='border-r border-black p-1 w-16'>SPK</th>
                  <th className='border-r border-black p-1 w-16'>TGL</th>
                  <th colSpan={3} className='border-black p-0'>
                    <div className='border-b border-black p-0.5 text-center font-bold'>GAMBAR</div>
                    <div className='grid grid-cols-12 text-center'>
                      <span className='col-span-8 border-r border-black p-1'>ITEM</span>
                      <span className='col-span-2 border-r border-black p-1'>SAT</span>
                      <span className='col-span-2 p-1'>JML</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((group, groupIdx) => {
                  return group.items.map((it, itemIdx) => {
                    const isFirstInGroup = itemIdx === 0;
                    return (
                      <tr
                        key={`grp-${groupIdx}-it-${itemIdx}`}
                        className='border-b border-black'
                      >
                        {isFirstInGroup && (
                          <td
                            rowSpan={group.items.length}
                            className='border-r border-black p-1 text-center align-top font-semibold'
                          >
                            {groupIdx + 1}
                          </td>
                        )}
                        {isFirstInGroup && (
                          <td
                            rowSpan={group.items.length}
                            className='border-r border-black p-1 font-bold uppercase align-top'
                          >
                            {group.clientName}
                          </td>
                        )}
                        {isFirstInGroup && (
                          <td
                            rowSpan={group.items.length}
                            className='border-r border-black p-1 text-center align-top'
                          >
                            {group.nomorSpk !== '-' ? group.nomorSpk : ''}
                          </td>
                        )}
                        {isFirstInGroup && (
                          <td
                            rowSpan={group.items.length}
                            className='border-r border-black p-1 text-center align-top'
                          >
                            {tglSingkat}
                          </td>
                        )}

                        {/* Item Details */}
                        <td className='border-r border-black p-1 pl-2 font-medium uppercase'>
                          {it.item}
                        </td>
                        <td className='border-r border-black p-1 text-center font-semibold w-12'>
                          {it.satuan}
                        </td>
                        <td className='p-1 text-center font-semibold w-12'>
                          {it.jumlah}
                        </td>
                      </tr>
                    );
                  });
                })}

                {/* Blank Filler Rows to maintain standard physical form layout */}
                {Array.from({ length: fillerCount }).map((_, idx) => (
                  <tr key={`filler-${idx}`} className='border-b border-black h-6'>
                    <td className='border-r border-black'>&nbsp;</td>
                    <td className='border-r border-black'>&nbsp;</td>
                    <td className='border-r border-black'>&nbsp;</td>
                    <td className='border-r border-black'>&nbsp;</td>
                    <td className='border-r border-black'>&nbsp;</td>
                    <td className='border-r border-black'>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note Row */}
          <div className='border-t border-black p-1 text-center text-[10px] font-bold tracking-wide'>
            *UKURAN FURNITURE MENYESUAIKAN UKURAN LAPANGAN
          </div>
        </div>

        {/* Signatures Section */}
        <div className='mt-4 grid grid-cols-2 text-xs'>
          
          {/* Diserahkan oleh (Engineer / Studio) */}
          <div className='flex flex-col items-center justify-between text-center pr-4'>
            <span className='font-semibold'>Diserahkan oleh,</span>
            <div className='my-2 flex h-24 items-center justify-center'>
              {data.pengirim?.tanda_tangan?.file_url ? (
                <img
                  src={data.pengirim.tanda_tangan.file_url}
                  alt='TTD Pengirim'
                  className='max-h-20 w-auto object-contain'
                />
              ) : (
                <div className='h-16 w-32' />
              )}
            </div>
            <div className='w-48'>
              <span className='block font-bold underline uppercase text-sm'>
                {data.pengirim?.name || '........................'}
              </span>
              <span className='mt-1 block text-[11px]'>
                Tgl : {tglLengkapKirim}
              </span>
            </div>
          </div>

          {/* Diterima oleh (PPIC) */}
          <div className='flex flex-col items-center justify-between text-center pl-4'>
            <span className='font-semibold'>Diterima oleh,</span>
            <div className='my-2 flex h-24 items-center justify-center'>
              {data.status === 'diterima' && data.penerima?.tanda_tangan?.file_url ? (
                <img
                  src={data.penerima.tanda_tangan.file_url}
                  alt='TTD Penerima'
                  className='max-h-20 w-auto object-contain'
                />
              ) : (
                <div className='flex h-16 w-32 items-center justify-center text-[10px] text-gray-400 italic'>
                  {data.status === 'menunggu_approval' ? '(Belum diapprove)' : ''}
                </div>
              )}
            </div>
            <div className='w-48'>
              <span className='block font-bold underline uppercase text-sm'>
                {data.penerima?.name || '........................'}
              </span>
              <span className='mt-1 block text-[11px]'>
                Tgl : {tglLengkapTerima}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Global CSS for Print View */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          header, nav, aside, footer, .sidebar, .navbar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
