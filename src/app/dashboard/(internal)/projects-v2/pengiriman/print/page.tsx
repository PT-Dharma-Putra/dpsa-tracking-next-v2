"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { PengirimanService } from "@/features/pengiriman/services/pengiriman-service"

export default function PrintSuratJalanPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [activeTab, setActiveTab] = React.useState("surat-jalan")

  // Fetch Pengiriman Detail
  const { data: pengiriman, isLoading } = useQuery({
    queryKey: ["pengiriman-print", id],
    queryFn: () => PengirimanService.getPengirimanById(parseInt(id || "0")),
    enabled: !!id,
  })

  // Trigger browser print dialog when data is loaded
  React.useEffect(() => {
    if (pengiriman) {
      const timer = setTimeout(() => {
        window.print()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [pengiriman])

  const downloadDocx = () => {
    if (!pengiriman) return

    const content = document.getElementById("print-area")?.innerHTML || ""
    
    // Wrap content in Microsoft Word HTML format with CSS layout helpers
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
          .w-full { width: 100%; }
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
    `

    const blob = new Blob(['\ufeff' + html], {
      type: 'application/msword'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeTab === 'surat-jalan' ? 'Surat_Jalan' : 'Setrim'}_${pengiriman.surat_jalan?.replace(/[\\/*?:|"<>\s]/g, "_") || pengiriman.id}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-neutral-500">Mempersiapkan dokumen Surat Jalan...</p>
        </div>
      </div>
    )
  }

  if (!pengiriman) {
    return (
      <div className="p-8 text-center text-red-600 bg-white h-screen">
        Data pengiriman tidak ditemukan. Pastikan ID pengiriman benar.
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen p-4 text-black font-sans">
      {/* CSS overrides to hide everything else on print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
            background-color: transparent !important;
            color: black !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }
      ` }} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="no-print mb-4">
          <TabsList>
            <TabsTrigger value="surat-jalan">Surat Jalan</TabsTrigger>
            <TabsTrigger value="setrim">Setrim</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Action bar for screen view */}
      <div className="no-print mb-6 p-4 bg-neutral-100 rounded-lg border border-neutral-200 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-neutral-800 text-sm">
            {activeTab === 'surat-jalan' ? 'Pratinjau Surat Jalan' : 'Pratinjau Setrim'}
          </h2>
          <p className="text-xs text-neutral-500">Halaman ini diformat untuk cetak A4. Klik tombol di kanan jika dialog print tidak muncul otomatis.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadDocx}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Download Docx
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-neutral-800 text-white rounded text-sm font-medium hover:bg-neutral-900 transition-colors"
          >
            Cetak Manual
          </button>
        </div>
      </div>

      {/* Print Content Area */}
      {activeTab === 'surat-jalan' ? (
      <div id="print-area" className="max-w-[800px] mx-auto p-4 border border-neutral-300 md:border-0 rounded-lg md:rounded-none bg-white pt-24">
        
        {/* Header (SURAT JALAN Title & No only) */}
        <div className="flex justify-center mb-6 pt-24">
          <div className="text-center">
            <h2 className="text-lg font-bold pb-1 mb-1 uppercase">
              SURAT JALAN
            </h2>
          </div>
        </div>

        {/* Metadata Section (Right-aligned info only) */}
        <div className="flex justify-end mb-6 text-sm">
          {/* Pengiriman Info */}
          <div className="space-y-1 text-xs w-72">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-neutral-500">Tujuan</span>
              <span className="col-span-2 font-semibold">: {pengiriman.client?.name || "-"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-neutral-500">No. Kendaraan</span>
              <span className="col-span-2">: {pengiriman.no_kendaraan || "-"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-neutral-500">Nama Sopir</span>
              <span className="col-span-2">: {pengiriman.supir || "-"}</span>
            </div>
          </div>
        </div>

        {/* Table of Items */}
        <table className="w-full text-[11px] text-left border border-black mb-8 border-collapse">
          <thead>
            <tr className="bg-neutral-100 border-b border-black">
              <th className="p-2 border-r border-black font-semibold text-center w-10" rowSpan={2}>NO</th>
              <th className="p-2 border-r border-black font-semibold w-16 text-center" rowSpan={2}>LANTAI</th>
              <th className="p-2 border-r border-black font-semibold w-24" rowSpan={2}>RUANG</th>
              <th className="p-2 border-r border-black font-semibold w-28" rowSpan={2}>NO. SPK</th>
              <th className="p-2 border-r border-black font-semibold" rowSpan={2}>ITEM/PERABOT</th>
              <th className="p-2 border-r border-black font-semibold w-24 text-center" colSpan={3}>DIMENSI (METER)</th>
              <th className="p-2 border-r border-black font-semibold w-16 text-center" rowSpan={2}>VOL</th>
              <th className="p-2 border-r border-black font-semibold w-16 text-center" rowSpan={2}>SAT</th>
              <th className="p-2 border-r border-black font-semibold text-center w-20" rowSpan={2}>JML</th>
              <th className="p-2 font-semibold text-center w-24" rowSpan={2}>KET</th>
            </tr>
            <tr className="bg-neutral-100 border-b border-black">
              <th className="p-2 border-r border-black font-semibold w-24 text-center">P</th>
              <th className="p-2 border-r border-black font-semibold w-16 text-center">L</th>
              <th className="p-2 border-r border-black font-semibold text-center w-20">T</th>
            </tr>
          </thead>
          <tbody>
            {pengiriman.details && pengiriman.details.map((detail, index) => {
              const panjang = detail.project_item?.panjang;
              const lebar = detail.project_item?.lebar;
              const tinggi = detail.project_item?.tinggi;
              const dimensi = (panjang !== null && panjang !== undefined) || 
                              (lebar !== null && lebar !== undefined) || 
                              (tinggi !== null && tinggi !== undefined)
                ? `${panjang || "-"} x ${lebar || "-"} x ${tinggi || "-"}`
                : "-";

              return (
                <tr key={detail.id || index} className="border-b border-black last:border-b-0">
                  <td className="p-2 border-r border-black text-center">{index + 1}</td>
                  <td className="p-2 border-r border-black text-center">{detail.project_item?.lantai || "-"}</td>
                  <td className="p-2 border-r border-black">{detail.project_item?.ruang || "-"}</td>
                  <td className="p-2 border-r border-black font-medium">{detail.project_item?.project?.spk_number || "-"}</td>
                  <td className="p-2 border-r border-black">{detail.project_item?.item || "-"}</td>
                  <td className="p-2 border-r border-black">{detail.project_item?.panjang || "-"}</td>
                  <td className="p-2 border-r border-black">{detail.project_item?.lebar || "-"}</td>
                  <td className="p-2 border-r border-black">{detail.project_item?.tinggi || "-"}</td>
                  <td className="p-2 border-r border-black text-center">{detail.project_item?.volume ?? "-"}</td>
                  <td className="p-2 border-r border-black text-center">{detail.project_item?.satuan || "-"}</td>
                  <td className="p-2 border-r border-black text-center font-bold text-xs">{detail.jumlah_keluar}</td>
                  <td className="p-2 text-center text-xs">{detail.keterangan || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Notes (Catatan Pemasangan / Setting) */}
        {(pengiriman.tanggal_mulai_setting || pengiriman.tanggal_selesai_setting) && (
          <div className="border border-black p-3 rounded mb-8 text-xs">
            <span className="font-semibold block mb-1">Catatan Pemasangan / Setting:</span>
            <p>
              Instalasi dijadwalkan mulai tanggal{" "}
              <span className="font-semibold">
                {pengiriman.tanggal_mulai_setting ? format(new Date(pengiriman.tanggal_mulai_setting), "dd MMMM yyyy") : "-"}
              </span>{" "}
              s/d{" "}
              <span className="font-semibold">
                {pengiriman.tanggal_selesai_setting ? format(new Date(pengiriman.tanggal_selesai_setting), "dd MMMM yyyy") : "-"}
              </span>.
            </p>
          </div>
        )}

        {/* Date and Signature Blocks */}
        <div className="mt-8">
          <div className="text-xs font-semibold mb-4 text-left">
            Yogyakarta, {format(new Date(), "dd MMMM yyyy", { locale: idLocale })}
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs text-center">
            <div className="flex flex-col justify-between h-24">
              <span>Diserahkan Oleh:<br /><span className="font-semibold">Petugas Gudang</span></span>
              <span className="pt-1 w-3/4 mx-auto">( ............................ )</span>
            </div>
            <div className="flex flex-col justify-between h-24">
              <span>Diterima Oleh:<br /><span className="font-semibold">Petugas Pengiriman</span></span>
              <span className="pt-1 w-3/4 mx-auto">( ............................ )</span>
            </div>
            <div className="flex flex-col justify-between h-24">
              <span>Mengetahui:<br /><span className="font-semibold">Security DPSA</span></span>
              <span className="pt-1 w-3/4 mx-auto">( ............................ )</span>
            </div>
            <div className="flex flex-col justify-between h-24">
              <span>Diterima Oleh:<br /><span className="font-semibold">Konsumen</span></span>
              <span className="pt-1 w-3/4 mx-auto">( ............................ )</span>
            </div>
          </div>
        </div>

      </div>
      ) : (
        <div id="print-area" className="max-w-[800px] mx-auto p-4 border border-neutral-300 md:border-0 rounded-lg md:rounded-none bg-white pt-12 relative font-sans text-black">
          {/* SETRIM Header */}
          <div className="flex justify-between items-start mb-6 pt-12 relative">
            <div className="flex-1 text-center pr-16">
              <h2 className="text-sm font-bold inline-block border-b border-black pb-0.5 mt-8">
                SURAT SERAH TERIMA BARANG
              </h2>
            </div>
            <div className="w-40 border border-black text-[10px] grid grid-cols-2 text-center bg-white absolute right-4 top-4">
              <div className="border-r border-b border-black py-0.5 font-semibold">PPIC</div>
              <div className="border-b border-black py-0.5">Rev : 00</div>
              <div className="border-r border-black py-0.5 font-semibold">005</div>
              <div className="py-0.5">Terbit : 8/25</div>
            </div>
          </div>

          {/* SETRIM Metadata */}
          <div className="space-y-3 text-[11px] mb-6 px-4">
            <div className="flex items-center">
              <span className="w-48 font-semibold">Nomor Surat</span>
              <span className="mr-2">:</span>
              <div className="border border-black px-2 py-0.5 w-64 min-h-[22px] flex items-center">
                {pengiriman.surat_jalan?.replace('/SJ/', '/SERTRIM/') || pengiriman.surat_jalan || "-"}
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="w-48 font-semibold">Tujuan Pengiriman/Penerima</span>
              <span className="mr-2">:</span>
              <div className="border border-black px-2 py-0.5 w-64 min-h-[22px] font-bold uppercase flex items-center">
                {pengiriman.client?.name || "-"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-48 font-semibold">Tanggal Terima Barang*)</span>
                <span className="mr-2">:</span>
                <div className="border border-black px-2 py-0.5 w-64 min-h-[22px]"></div>
              </div>
              <div className="flex items-center">
                <span className="font-semibold mr-4 text-[10px]">No. SPK/SPH</span>
                <div className="border border-black px-2 py-0.5 w-64 min-h-[22px] flex items-center font-bold">
                  {pengiriman.details?.[0]?.project_item?.project?.spk_number || "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-2 text-[11px] font-semibold px-4">
            Telah diterima barang - barang pesanan dari PT DHARMA PUTRA SEJAHTERA ABADI, berupa:
          </div>

          {/* SETRIM Table */}
          <div className="px-4">
            <table className="w-full text-[11px] text-left border border-black mb-8 border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="p-1.5 border-r border-black font-semibold text-center w-8" rowSpan={2}>NO.</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center w-40" rowSpan={2}>RUANG</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center" rowSpan={2}>ITEM/PERABOT**)</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center w-28" colSpan={3}>DIMENSI (METER)</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center w-12" rowSpan={2}>VOL</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center w-12" rowSpan={2}>SAT</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center w-12" rowSpan={2}>JML</th>
                  <th className="p-1.5 font-semibold text-center w-16" rowSpan={2}>KET</th>
                </tr>
                <tr className="border-b border-black">
                  <th className="p-1.5 border-r border-black font-semibold text-center w-9">P</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center w-9">L</th>
                  <th className="p-1.5 border-r border-black font-semibold text-center w-9">T</th>
                </tr>
              </thead>
              <tbody>
                {pengiriman.details && pengiriman.details.map((detail, index) => (
                  <tr key={detail.id || index} className="border-b border-black h-6">
                    <td className="p-1.5 border-r border-black text-center">{index + 1}</td>
                    <td className="p-1.5 border-r border-black text-center">{detail.project_item?.ruang || "-"}</td>
                    <td className="p-1.5 border-r border-black uppercase font-medium pl-2">{detail.project_item?.item || "-"}</td>
                    <td className="p-1.5 border-r border-black text-center">{detail.project_item?.panjang || "-"}</td>
                    <td className="p-1.5 border-r border-black text-center">{detail.project_item?.lebar || "-"}</td>
                    <td className="p-1.5 border-r border-black text-center">{detail.project_item?.tinggi || "-"}</td>
                    <td className="p-1.5 border-r border-black text-center">{detail.project_item?.volume ?? "-"}</td>
                    <td className="p-1.5 border-r border-black text-center uppercase">{detail.project_item?.satuan || "-"}</td>
                    <td className="p-1.5 border-r border-black text-center">{detail.jumlah_keluar}</td>
                    <td className="p-1.5 text-center">{detail.keterangan || ""}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 15 - (pengiriman.details?.length || 0)) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="border-b border-black h-6">
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SETRIM Footer */}
          <div className="grid grid-cols-3 gap-4 text-[11px] text-center mt-12 mb-8 px-12">
            <div className="flex flex-col items-center">
              <span className="font-semibold mb-16">Disiapkan oleh,</span>
              <div className="w-32 border-b border-black mb-1 relative"></div>
              <div className="flex w-32 text-left mt-1">
                <span className="font-semibold mr-1 text-[10px]">Tgl.</span>
                <span className="flex-1 border-b border-black border-dashed"></span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold mb-16">Diserahkan oleh,</span>
              <div className="w-32 border-b border-black mb-1 relative"></div>
              <div className="flex w-32 text-left mt-1">
                <span className="font-semibold mr-1 text-[10px]">Tgl.</span>
                <span className="flex-1 border-b border-black border-dashed"></span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold mb-16">Diterima oleh,</span>
              <div className="w-32 border-b border-black mb-1 relative"></div>
              <div className="flex w-32 text-left mt-1">
                <span className="font-semibold mr-1 text-[10px]">Tgl.</span>
                <span className="flex-1 border-b border-black border-dashed"></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
