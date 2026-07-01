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
import { Download, File, Loader2, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axios";

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
