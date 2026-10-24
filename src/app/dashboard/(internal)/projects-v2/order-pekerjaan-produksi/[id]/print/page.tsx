'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  orderPekerjaanProduksiService,
  OrderPekerjaanProduksiData,
} from '@/features/projects/services/order-pekerjaan-produksi-service';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function PrintOrderPekerjaanProduksiPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [data, setData] = useState<OrderPekerjaanProduksiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await orderPekerjaanProduksiService.getDetail(id);
      setData(res);
    } catch (err) {
      console.error('Error loading order data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white text-slate-800'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        <span className='ml-2 text-sm text-slate-600'>Memuat dokumen order pekerjaan produksi...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-4 text-center bg-white'>
        <p className='text-lg font-semibold text-red-600'>Dokumen tidak ditemukan</p>
        <Button variant='outline' onClick={() => router.back()} className='mt-4'>
          Kembali
        </Button>
      </div>
    );
  }

  const tanggalOrderFormatted = data.tanggal_order
    ? format(new Date(data.tanggal_order), 'dd/MM/yyyy')
    : '-';

  const targetSelesaiFormatted = data.target_penyelesaian
    ? format(new Date(data.target_penyelesaian), 'dd/MM/yyyy')
    : '-';

  const tanggalDiserahkanFormatted = data.tanggal_diserahkan
    ? format(new Date(data.tanggal_diserahkan), 'dd / MM / yyyy')
    : '   /    /    ';

  const tanggalDiterimaFormatted = data.tanggal_diterima
    ? format(new Date(data.tanggal_diterima), 'dd / MM / yyyy')
    : '   /    /    ';

  // Minimal rows for clean print
  const items = data.items || [];
  const emptyRowsCount = Math.max(0, 3 - items.length);

  return (
    <div className='min-h-screen bg-slate-100 py-6 print:py-0 print:bg-white text-black font-sans'>
      {/* Top action toolbar (hidden on print) */}
      <div className='max-w-4xl mx-auto mb-4 flex items-center justify-between px-4 print:hidden'>
        <Button variant='outline' size='sm' onClick={() => router.back()} className='gap-1.5 bg-white text-xs'>
          <ArrowLeft className='h-4 w-4' /> Kembali
        </Button>
        <div className='flex items-center gap-2'>
          <Button size='sm' onClick={handlePrint} className='gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs'>
            <Printer className='h-4 w-4' /> Cetak Dokumen (A4)
          </Button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 Dimensions) */}
      <div className='max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-md print:shadow-none print:p-0 print:max-w-none text-black text-[12px] leading-relaxed'>
        
        {/* ========================================================================= */}
        {/* HEADER BLOCK (LOGO, TITLE, ISO BOX)                                       */}
        {/* ========================================================================= */}
        <div className='flex items-stretch justify-between gap-4 mb-6'>
          {/* Logo */}
          <div className='w-28 flex items-center justify-start'>
            <img
              src='/Logo.png'
              alt='Logo DPSA'
              className='h-14 w-auto object-contain'
              onError={(e) => {
                // fallback to text if logo image is missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Title Box */}
          <div className='flex-1 border-2 border-black flex items-center justify-center py-2 px-4 text-center'>
            <h1 className='text-xl md:text-2xl font-black tracking-wider uppercase text-black font-serif'>
              ORDER PEKERJAAN PRODUKSI
            </h1>
          </div>

          {/* ISO Box */}
          <div className='w-36 border-2 border-black text-[11px] font-sans'>
            <div className='grid grid-cols-2 border-b-2 border-black divide-x-2 divide-black'>
              <div className='p-1 text-center font-bold'>PPIC</div>
              <div className='p-1 text-center font-bold'>Rev : 00</div>
            </div>
            <div className='grid grid-cols-2 divide-x-2 divide-black'>
              <div className='p-1 text-center font-bold'>019</div>
              <div className='p-1 text-center'>
                <div className='text-[9px] leading-tight'>Terbit :</div>
                <div className='font-bold leading-tight'>02/26</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* METADATA BLOCK                                                            */}
        {/* ========================================================================= */}
        <div className='space-y-1.5 mb-5 text-[12px]'>
          <div className='flex justify-between items-baseline gap-4'>
            <div>
              <span className='font-bold text-black'>No. SPK : </span>
              <span className='font-semibold'>{data.project?.spk?.nomor_spk || '-'}</span>
            </div>
            <div className='text-right'>
              <span className='font-bold text-black'>Tanggal Order Diberikan : </span>
              <span className='font-semibold'>{tanggalOrderFormatted}</span>
            </div>
          </div>

          <div className='flex justify-between items-baseline gap-4'>
            <div>
              <span className='font-bold text-black'>Nama Proyek : </span>
              <span className='font-semibold'>{data.project?.name || '-'}</span>
            </div>
            <div className='text-right text-[11px] text-slate-700 font-mono'>
              <span>No. Order : </span>
              <strong className='text-black'>{data.nomor_order}</strong>
            </div>
          </div>

          <div className='pt-1'>
            <div className='font-bold text-black mb-1'>Jenis Order (centang salah satu)</div>
            <div className='flex items-center gap-6 pl-2'>
              <label className='inline-flex items-center gap-2'>
                <span className={`inline-block w-4 h-4 border-2 border-black text-center leading-3 font-bold text-xs ${data.jenis_order === 'normal' ? 'bg-black text-white' : ''}`}>
                  {data.jenis_order === 'normal' ? '✓' : ''}
                </span>
                <span className='font-medium'>Normal</span>
              </label>

              <label className='inline-flex items-center gap-2'>
                <span className={`inline-block w-4 h-4 border-2 border-black text-center leading-3 font-bold text-xs ${data.jenis_order === 'mendesak' ? 'bg-black text-white' : ''}`}>
                  {data.jenis_order === 'mendesak' ? '✓' : ''}
                </span>
                <span className='font-medium'>Mendesak (Urgent)</span>
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DETAIL PEKERJAAN TABLE                                                    */}
        {/* ========================================================================= */}
        <div className='mb-4'>
          <div className='font-bold text-black text-[12px] mb-1.5'>Detail Pekerjaan</div>
          <table className='w-full border-collapse border border-black text-[11px]'>
            <thead>
              <tr className='border-b border-black bg-slate-100/50'>
                <th className='border border-black p-1.5 w-10 text-center font-bold'>No</th>
                <th className='border border-black p-1.5 w-36 text-center font-bold'>Ruang</th>
                <th className='border border-black p-1.5 text-center font-bold'>Item</th>
                <th className='border border-black p-1.5 w-16 text-center font-bold'>Jumlah</th>
                <th className='border border-black p-1.5 w-16 text-center font-bold'>Stock</th>
                <th className='border border-black p-1.5 w-16 text-center font-bold'>Produksi</th>
                <th className='border border-black p-1.5 w-44 text-center font-bold'>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className='border-b border-black'>
                  <td className='border border-black p-1.5 text-center font-medium'>{idx + 1}</td>
                  <td className='border border-black p-1.5 font-medium'>{it.ruang || ''}</td>
                  <td className='border border-black p-1.5 font-bold uppercase'>{it.project_item?.item || '-'}</td>
                  <td className='border border-black p-1.5 text-center font-bold'>{it.jumlah}</td>
                  <td className='border border-black p-1.5 text-center font-medium'>{it.stock > 0 ? it.stock : ''}</td>
                  <td className='border border-black p-1.5 text-center font-bold'>{it.produksi}</td>
                  <td className='border border-black p-1.5'>{it.keterangan || ''}</td>
                </tr>
              ))}

              {/* Extra empty rows if needed to maintain form height */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className='border-b border-black h-7'>
                  <td className='border border-black p-1.5 text-center'>{items.length + i + 1}</td>
                  <td className='border border-black p-1.5'></td>
                  <td className='border border-black p-1.5'></td>
                  <td className='border border-black p-1.5 text-center'></td>
                  <td className='border border-black p-1.5 text-center'></td>
                  <td className='border border-black p-1.5 text-center'></td>
                  <td className='border border-black p-1.5'></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* DATA YANG HARUS DILAMPIRKAN (CHECKLIST)                                   */}
        {/* ========================================================================= */}
        <div className='text-[11px] space-y-1 mb-5'>
          <div className='italic font-semibold'>*Data yang harus dilampirkan :</div>
          <div className='pl-3 flex items-center gap-3 flex-wrap'>
            <span className='font-medium'>17. Data Fisik (</span>
            <span className='inline-flex items-center gap-1.5'>
              <span className={`inline-block w-3.5 h-3.5 border border-black text-center leading-3 font-bold text-[10px] ${data.lampiran_dokubah ? 'bg-black text-white' : ''}`}>
                {data.lampiran_dokubah ? '✓' : ''}
              </span>
              Dokubah,
            </span>

            <span className='inline-flex items-center gap-1.5'>
              <span className={`inline-block w-3.5 h-3.5 border border-black text-center leading-3 font-bold text-[10px] ${data.lampiran_gambar_kerja ? 'bg-black text-white' : ''}`}>
                {data.lampiran_gambar_kerja ? '✓' : ''}
              </span>
              Gambar Kerja,
            </span>

            <span className='inline-flex items-center gap-1.5'>
              <span className={`inline-block w-3.5 h-3.5 border border-black text-center leading-3 font-bold text-[10px] ${data.lampiran_data_stock ? 'bg-black text-white' : ''}`}>
                {data.lampiran_data_stock ? '✓' : ''}
              </span>
              Data Stock,
            </span>

            <span className='inline-flex items-center gap-1.5'>
              <span className={`inline-block w-3.5 h-3.5 border border-black text-center leading-3 font-bold text-[10px] ${data.lampiran_jadwal_produksi ? 'bg-black text-white' : ''}`}>
                {data.lampiran_jadwal_produksi ? '✓' : ''}
              </span>
              Jadwal Produksi
            </span>
            <span>)</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TARGET PENYELESAIAN & CATATAN                                             */}
        {/* ========================================================================= */}
        <div className='space-y-3 mb-6 text-[12px]'>
          <div>
            <span className='font-bold text-black'>Target Penyelesaian : </span>
            <span className='font-bold underline decoration-black decoration-1 underline-offset-2'>
              {targetSelesaiFormatted}
            </span>
          </div>

          <div>
            <div className='font-bold text-black mb-1'>Catatan dari PPIC :</div>
            {data.catatan ? (
              <div className='p-2 border border-black border-dashed min-h-[40px] text-xs whitespace-pre-wrap font-medium'>
                {data.catatan}
              </div>
            ) : (
              <div className='border-b border-black border-dotted pt-4'></div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PERSETUJUAN DAN TANDA TANGAN (DUAL COLUMN BOX)                             */}
        {/* ========================================================================= */}
        <div className='border border-black overflow-hidden'>
          <div className='border-b border-black text-center font-bold text-[12px] py-1 bg-slate-50'>
            Persetujuan dan Tanda Tangan
          </div>
          <div className='grid grid-cols-2 divide-x divide-black text-[11px]'>
            {/* Diberikan Oleh (PPIC) */}
            <div className='p-3 text-left space-y-2'>
              <div className='font-bold text-center mb-1'>Diberikan Oleh : (PPIC)</div>
              <div>
                <span className='font-medium'>Nama : </span>
                <span className='font-bold'>{data.pembuat?.name || ''}</span>
              </div>
              <div>
                <span className='font-medium'>Tanggal : </span>
                <span>{tanggalDiserahkanFormatted}</span>
              </div>
              <div className='pt-1'>
                <span className='font-medium block mb-1'>Tanda Tangan :</span>
                <div className='h-20 flex items-center justify-center border border-dashed border-slate-300 rounded'>
                  {data.pembuat?.tanda_tangan?.file_url ? (
                    <img
                      src={data.pembuat.tanda_tangan.file_url}
                      alt='TTD PPIC'
                      className='h-16 max-w-full object-contain'
                    />
                  ) : (
                    <span className='text-[10px] text-slate-400 italic'>-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Diterima Oleh (Produksi) */}
            <div className='p-3 text-left space-y-2'>
              <div className='font-bold text-center mb-1'>Diterima Oleh : (Produksi)</div>
              <div>
                <span className='font-medium'>Nama : </span>
                <span className='font-bold'>
                  {data.status === 'diterima' && data.penerima?.name ? data.penerima.name : ''}
                </span>
              </div>
              <div>
                <span className='font-medium'>Tanggal : </span>
                <span>{tanggalDiterimaFormatted}</span>
              </div>
              <div className='pt-1'>
                <span className='font-medium block mb-1'>Tanda Tangan :</span>
                <div className='h-20 flex items-center justify-center border border-dashed border-slate-300 rounded'>
                  {data.status === 'diterima' && data.penerima?.tanda_tangan?.file_url ? (
                    <img
                      src={data.penerima.tanda_tangan.file_url}
                      alt='TTD Produksi'
                      className='h-16 max-w-full object-contain'
                    />
                  ) : (
                    <span className='text-[10px] text-slate-400 italic'>-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
