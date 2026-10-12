"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, File, Loader2, FileText, Search, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axios";
import * as XLSX from "xlsx-js-style";
import { toast } from "sonner";

type BarangJadiMasuk = {
  id: number;
  tanggal: string;
  jumlah: number;
  file_setrim: string | null;
  project_item: {
    item: string;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    volume: number | null;
    satuan: string | null;
    jumlah: number;
    project: {
      name: string;
      client?: {
        name: string;
        company_name?: string | null;
      };
      spk?: {
        nomor_spk: string;
      };
    };
  };
};

export default function SetrimBarangJadiClient() {
  const [data, setData] = useState<BarangJadiMasuk[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      
      const res = await axiosInstance.get(`/barang-jadi-masuk?${params.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch barang jadi masuk", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";
    return `${baseUrl}/storage/${path}`;
  };

  const handleExportPdf = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    // Auth token might be needed if the route is protected by Sanctum
    const authData = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
    let token = "";
    if (authData) {
      const { state } = JSON.parse(authData);
      token = state?.token || "";
    }
    
    // Create an invisible form to trigger download with Bearer token if we can't just open a new tab
    // Alternatively, just open window if token is in cookie. But sanctum uses Bearer token.
    // The easiest way for file download with Bearer token is to fetch as blob and create object URL.
    
    fetch(`${baseUrl}/barang-jadi-masuk/export-pdf?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(async (response) => {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText.substring(0, 100)}`);
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Setrim_Barang_Jadi_${new Date().getTime()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    })
    .catch(error => {
        console.error("Error downloading PDF:", error);
        alert("Gagal mengunduh PDF. Silakan coba beberapa saat lagi.");
    });
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    try {
      const titleStyle = {
        font: { bold: true, sz: 14, color: { rgb: "1A4F8B" } },
        alignment: { horizontal: "left", vertical: "center" },
      };

      const subtitleStyle = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "left", vertical: "center" },
      };

      const metaLabelStyle = {
        font: { bold: true, sz: 10 },
        alignment: { horizontal: "left", vertical: "center" },
      };

      const metaValueStyle = {
        font: { sz: 10 },
        alignment: { horizontal: "left", vertical: "center" },
      };

      const tableHeaderStyle = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { fgColor: { rgb: "1A4F8B" } },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
      };

      const cellStyleLeft = {
        font: { sz: 10 },
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };

      const cellStyleCenter = {
        font: { sz: 10 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };

      const cellStyleRight = {
        font: { sz: 10 },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };

      const totalStyle = {
        font: { bold: true, sz: 10 },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "F3F4F6" } },
        border: {
          top: { style: "thin", color: { rgb: "9CA3AF" } },
          bottom: { style: "double", color: { rgb: "374151" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
      };

      const totalNumberStyle = {
        font: { bold: true, sz: 10 },
        alignment: { horizontal: "right", vertical: "center" },
        fill: { fgColor: { rgb: "F3F4F6" } },
        border: {
          top: { style: "thin", color: { rgb: "9CA3AF" } },
          bottom: { style: "double", color: { rgb: "374151" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
      };

      const periodeStr =
        startDate && endDate
          ? `${startDate} s/d ${endDate}`
          : startDate
          ? `Mulai ${startDate}`
          : endDate
          ? `Sampai ${endDate}`
          : "Semua Tanggal";

      const wsData: any[][] = [
        [{ v: "PT DHARMA PUTRA SEJAHTERA ABADI", t: "s", s: titleStyle }],
        [{ v: "SERAH TERIMA BARANG JADI (Dari Produksi ke Petugas Gudang)", t: "s", s: subtitleStyle }],
        [
          { v: "Periode Serah Terima:", t: "s", s: metaLabelStyle },
          { v: periodeStr, t: "s", s: metaValueStyle },
        ],
        [
          { v: "Tanggal Export:", t: "s", s: metaLabelStyle },
          { v: format(new Date(), "dd MMMM yyyy HH:mm"), t: "s", s: metaValueStyle },
        ],
        [],
        [
          { v: "No", t: "s", s: tableHeaderStyle },
          { v: "Client", t: "s", s: tableHeaderStyle },
          { v: "No. SPK", t: "s", s: tableHeaderStyle },
          { v: "Item Name", t: "s", s: tableHeaderStyle },
          { v: "P (m)", t: "s", s: tableHeaderStyle },
          { v: "L (m)", t: "s", s: tableHeaderStyle },
          { v: "T (m)", t: "s", s: tableHeaderStyle },
          { v: "Vol", t: "s", s: tableHeaderStyle },
          { v: "Sat", t: "s", s: tableHeaderStyle },
          { v: "Jml Order", t: "s", s: tableHeaderStyle },
          { v: "Tanggal", t: "s", s: tableHeaderStyle },
          { v: "Jml Masuk", t: "s", s: tableHeaderStyle },
          { v: "File Setrim", t: "s", s: tableHeaderStyle },
        ],
      ];

      let totalJmlOrder = 0;
      let totalJmlMasuk = 0;

      data.forEach((row, index) => {
        const clientName =
          row.project_item?.project?.client?.name ||
          row.project_item?.project?.client?.company_name ||
          "-";
        const nomorSpk = row.project_item?.project?.spk?.nomor_spk || "-";
        const itemName = row.project_item?.item || "-";
        const p = row.project_item?.panjang != null ? Number(row.project_item.panjang) : "-";
        const l = row.project_item?.lebar != null ? Number(row.project_item.lebar) : "-";
        const t = row.project_item?.tinggi != null ? Number(row.project_item.tinggi) : "-";
        const vol = row.project_item?.volume != null ? Number(row.project_item.volume) : "-";
        const satuan = row.project_item?.satuan || "-";
        const jmlOrder = Number(row.project_item?.jumlah) || 0;
        const tanggalStr = row.tanggal
          ? format(new Date(row.tanggal), "dd MMM yyyy")
          : "-";
        const jmlMasuk = Number(row.jumlah) || 0;
        const fileUrl = row.file_setrim ? getFileUrl(row.file_setrim) : "-";

        totalJmlOrder += jmlOrder;
        totalJmlMasuk += jmlMasuk;

        wsData.push([
          { v: index + 1, t: "n", s: cellStyleCenter },
          { v: clientName, t: "s", s: cellStyleLeft },
          { v: nomorSpk, t: "s", s: cellStyleCenter },
          { v: itemName, t: "s", s: cellStyleLeft },
          { v: p, t: typeof p === "number" ? "n" : "s", s: cellStyleCenter },
          { v: l, t: typeof l === "number" ? "n" : "s", s: cellStyleCenter },
          { v: t, t: typeof t === "number" ? "n" : "s", s: cellStyleCenter },
          { v: vol, t: typeof vol === "number" ? "n" : "s", s: cellStyleCenter },
          { v: satuan, t: "s", s: cellStyleCenter },
          { v: jmlOrder, t: "n", s: cellStyleRight },
          { v: tanggalStr, t: "s", s: cellStyleCenter },
          { v: jmlMasuk, t: "n", s: cellStyleRight },
          { v: fileUrl, t: "s", s: cellStyleLeft },
        ]);
      });

      // Total row
      const totalRowIndex = wsData.length;
      wsData.push([
        { v: "TOTAL", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: "", t: "s", s: totalStyle },
        { v: totalJmlOrder, t: "n", s: totalNumberStyle },
        { v: "", t: "s", s: totalStyle },
        { v: totalJmlMasuk, t: "n", s: totalNumberStyle },
        { v: "", t: "s", s: totalStyle },
      ]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 6 },  // No
        { wch: 25 }, // Client
        { wch: 20 }, // No SPK
        { wch: 32 }, // Item Name
        { wch: 10 }, // P
        { wch: 10 }, // L
        { wch: 10 }, // T
        { wch: 10 }, // Vol
        { wch: 10 }, // Sat
        { wch: 12 }, // Jml Order
        { wch: 16 }, // Tanggal
        { wch: 12 }, // Jml Masuk
        { wch: 35 }, // File Setrim
      ];

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: 5 } },
        { s: { r: 3, c: 1 }, e: { r: 3, c: 5 } },
        { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 8 } },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Setrim Barang Jadi");

      const dateStr = format(new Date(), "yyyyMMdd_HHmmss");
      let fileName = `Setrim_Barang_Jadi_${dateStr}.xlsx`;
      if (startDate && endDate) {
        fileName = `Setrim_Barang_Jadi_${startDate}_sd_${endDate}.xlsx`;
      }

      XLSX.writeFile(wb, fileName);
      toast.success("Excel berhasil diexport");
    } catch (error) {
      console.error("Error exporting excel:", error);
      toast.error("Gagal melakukan export Excel");
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Riwayat Barang Jadi Masuk</CardTitle>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-auto h-9 text-xs"
            />
            <span className="text-sm text-muted-foreground">-</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-auto h-9 text-xs"
            />
          </div>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button onClick={handleExportPdf} variant="default" size="sm" className="h-9">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>No. SPK</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>P / L / T</TableHead>
                  <TableHead>Vol</TableHead>
                  <TableHead>Sat</TableHead>
                  <TableHead className="text-right">Jml Order</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Jml Masuk</TableHead>
                  <TableHead className="text-center">File Setrim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      Tidak ada data barang jadi masuk.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.project_item?.project?.client?.name || row.project_item?.project?.client?.company_name || "-"}</TableCell>
                      <TableCell>{row.project_item?.project?.spk?.nomor_spk || "-"}</TableCell>
                      <TableCell>{row.project_item?.item || "-"}</TableCell>
                      <TableCell className="text-nowrap text-xs text-muted-foreground whitespace-nowrap">
                        {row.project_item?.panjang || 0} / {row.project_item?.lebar || 0} / {row.project_item?.tinggi || 0}
                      </TableCell>
                      <TableCell>{row.project_item?.volume || 0}</TableCell>
                      <TableCell>{row.project_item?.satuan || "-"}</TableCell>
                      <TableCell className="text-right">{row.project_item?.jumlah || 0}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.tanggal
                          ? format(new Date(row.tanggal), "dd MMM yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {row.jumlah}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.file_setrim ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            asChild
                          >
                            <a
                              href={getFileUrl(row.file_setrim)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <File className="w-3 h-3 mr-2" />
                              Lihat File
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="font-normal text-muted-foreground">
                            Tidak ada
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
