"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { mdlService } from "@/features/mdl/api/mdl-service"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, X, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as XLSX from "xlsx"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function MDLImportPage() {
    // State
    const [isLoading, setIsLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [progress, setProgress] = useState(0)
    const [parsedData, setParsedData] = useState<any[]>([])
    const [uploadStat, setUploadStat] = useState<{ total: number, success: number } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    const resetState = () => {
        setFile(null)
        setProgress(0)
        setParsedData([])
        setUploadStat(null)
        setError(null)
        setCurrentPage(1)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
            toast.error("Please upload a valid Excel file (.xlsx or .xls)")
            return
        }

        setFile(selectedFile)
        setError(null)
        setIsLoading(true)

        try {
            const data = await parseExcel(selectedFile)
            setParsedData(data)
            setCurrentPage(1)
            toast.success(`Successfully parsed ${data.length} items`)
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to parse Excel file")
            setFile(null)
        } finally {
            setIsLoading(false)
        }
    }

    const parseExcel = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: 'binary' })

                    let allData: any[] = []

                    // Iterate through ALL sheets
                    workbook.SheetNames.forEach(sheetName => {
                        const sheet = workbook.Sheets[sheetName]
                        // Skip 3 rows header logic applies to all sheets based on template
                        const sheetData = XLSX.utils.sheet_to_json(sheet, { range: 3 })
                        allData = [...allData, ...sheetData]
                    })

                    resolve(allData)
                } catch (err) {
                    reject(err)
                }
            }
            reader.onerror = (err) => reject(err)
            reader.readAsBinaryString(file)
        })
    }

    // Helper for fuzzy matching Excel keys
    const findValue = (row: any, possibleKeys: string[]) => {
        if (!row) return undefined
        const rowKeys = Object.keys(row)

        // Helper to normalize strings: remove non-alphanumeric, lowercase
        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')

        for (const key of possibleKeys) {
            // 1. Exact match (Priority)
            if (row[key] !== undefined && row[key] !== null) return row[key]

            // 2. Normalized match (Robust)
            const normalizedKey = normalize(key)
            const foundKey = rowKeys.find(k => normalize(k) === normalizedKey)

            if (foundKey && row[foundKey] !== undefined) {
                return row[foundKey]
            }
        }
        return undefined
    }

    // Consolidated Field Mappings
    const FIELD_MAPPINGS = {
        kategori_mdl: ['Kategori MDL', 'kategori_mdl', 'Kategori', 'Category', 'Kategori Barang'],
        sub_kategori: ['Sub Kategori', 'sub_kategori', 'Sub Category', 'Sub'],
        nama_barang: ['Nama Barang', 'nama_barang', 'Item Name', 'Nama Item', 'Deskripsi'],
        kode_barang: ['Kode Barang', 'kode_barang', 'Kode', 'Code', 'Item Code'],
        lokasi_ruangan: ['Lokasi Ruangan', 'lokasi_ruangan', 'Location', 'Lokasi'],
        spesifikasi_dan_material: ['Spesifikasi & Material', 'spesifikasi_dan_material', 'Spesifikasi', 'Specs', 'Spec', 'Material'],
        dimensi_panjang: ['Panjang', 'dimensi_panjang', 'Length', 'P (cm)', 'P'],
        dimensi_lebar: ['Lebar', 'dimensi_lebar', 'Width', 'L (cm)', 'L'],
        dimensi_tinggi: ['Tinggi', 'dimensi_tinggi', 'Height', 'T (cm)', 'T'],
        volume: ['Volume (m^3)', 'volume', 'Volume', 'Vol (m3)', 'Vol (m^3)', 'Vol'],
        kode_satuan_beli: ['Kode Satuan Beli', 'kode_satuan_beli', 'Satuan', 'Unit', 'UoM'],
        harga_pulau_jawa: ['Harga Jawa', 'Harga Pulau Jawa', 'harga_pulau_jawa', 'Price Java'],
        harga_jabodetabek: ['Harga Jabodetabek', 'harga_jabodetabek', 'Price Jabodetabek'],
        harga_luar_jawa: ['Harga Luar Jawa', 'harga_luar_jawa', 'Price Outer Java'],
        prioritas_garansi: ['Prioritas Garansi', 'prioritas_garansi', 'Garansi', 'Warranty'],
        link_gambar_kerja: ['Link Gambar Kerja', 'link_gambar_kerja', 'Link Gambar', 'Image Link', 'Link']
    }

    const handleUpload = async () => {
        if (!parsedData.length) return

        setIsLoading(true)
        setProgress(10)

        const itemsToUpload = parsedData.map(row => ({
            kategori_mdl: findValue(row, FIELD_MAPPINGS.kategori_mdl),
            sub_kategori: findValue(row, FIELD_MAPPINGS.sub_kategori),
            nama_barang: findValue(row, FIELD_MAPPINGS.nama_barang),
            kode_barang: findValue(row, FIELD_MAPPINGS.kode_barang),
            spesifikasi_dan_material: findValue(row, FIELD_MAPPINGS.spesifikasi_dan_material),
            dimensi_panjang: findValue(row, FIELD_MAPPINGS.dimensi_panjang),
            dimensi_lebar: findValue(row, FIELD_MAPPINGS.dimensi_lebar),
            dimensi_tinggi: findValue(row, FIELD_MAPPINGS.dimensi_tinggi),
            volume: findValue(row, FIELD_MAPPINGS.volume),
            kode_satuan_beli: findValue(row, FIELD_MAPPINGS.kode_satuan_beli),
            harga_pulau_jawa: findValue(row, FIELD_MAPPINGS.harga_pulau_jawa),
            harga_jabodetabek: findValue(row, FIELD_MAPPINGS.harga_jabodetabek),
            harga_luar_jawa: findValue(row, FIELD_MAPPINGS.harga_luar_jawa),
            prioritas_garansi: findValue(row, FIELD_MAPPINGS.prioritas_garansi),
            link_gambar_kerja: findValue(row, FIELD_MAPPINGS.link_gambar_kerja),
            lokasi_ruangan: findValue(row, FIELD_MAPPINGS.lokasi_ruangan),
        })).filter(item => item.nama_barang && item.kategori_mdl)

        if (itemsToUpload.length === 0) {
            setError("No valid items found. Ensure columns 'nama_barang' and 'kategori_mdl' exist.")
            setIsLoading(false)
            return
        }

        try {
            setProgress(50)
            await mdlService.bulkStore(itemsToUpload)
            setProgress(100)
            setUploadStat({
                total: itemsToUpload.length,
                success: itemsToUpload.length,
            })
            toast.success("Import successful")
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.message || "Failed to upload items")
            toast.error("Import failed")
        } finally {
            setIsLoading(false)
        }
    }

    const downloadTemplate = async () => {
        try {
            const blob = await mdlService.downloadTemplate()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'mdl-template.xlsx'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error(error)
            toast.error("Failed to download template")
        }
    }

    // Pagination Calculation
    const totalPages = Math.ceil(parsedData.length / itemsPerPage)
    const paginatedData = parsedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/mdl">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Import MDL Items</h1>
                        <p className="text-muted-foreground">Bulk upload items from Excel file.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Instructions & Upload */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Download Template</CardTitle>
                            <CardDescription>Use the standard template to avoid errors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" onClick={downloadTemplate} className="w-full border-dashed">
                                <Download className="mr-2 h-4 w-4" /> Download Excel Template
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Upload File</CardTitle>
                            <CardDescription>Supported formats: .xlsx, .xls</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer relative ${file ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50 border-slate-200'}`}
                                onClick={() => !isLoading && !uploadStat && fileInputRef.current?.click()}
                            >
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isLoading || !!uploadStat}
                                />
                                {file ? (
                                    <div className="flex flex-col items-center text-green-700">
                                        <FileSpreadsheet className="h-10 w-10 mb-2" />
                                        <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs opacity-70">{(file.size / 1024).toFixed(1)} KB</p>
                                        {!uploadStat && !isLoading && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    resetState()
                                                }}
                                            >
                                                <X className="w-3 h-3 mr-1" /> Remove
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <Upload className="h-10 w-10 mb-2 text-slate-300" />
                                        <p className="font-medium text-sm">Click to upload</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        {parsedData.length > 0 && !uploadStat && (
                            <CardFooter>
                                <Button onClick={handleUpload} disabled={isLoading} className="w-full">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Process Import ({parsedData.length} Items)
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    {uploadStat && (
                        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle>Import Successful</AlertTitle>
                            <AlertDescription>
                                Successfully imported {uploadStat.success} items.
                                <div className="mt-2">
                                    <Link href="/dashboard/mdl">
                                        <Button variant="outline" size="sm" className="bg-white text-black border-green-300 hover:bg-green-100">
                                            Back to List
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" className="ml-2" onClick={resetState}>
                                        Import More
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {isLoading && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Processing...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}
                </div>

                {/* Right Column: Preview Table */}
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Data Preview</CardTitle>
                            <CardDescription>
                                {parsedData.length > 0
                                    ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, parsedData.length)} of ${parsedData.length} items found.`
                                    : "Upload a file to preview data."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto min-h-[300px]">
                            {parsedData.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[150px]">Kategori</TableHead>
                                                <TableHead className="min-w-[150px]">Sub Kategori</TableHead>
                                                <TableHead className="min-w-[200px]">Nama Barang</TableHead>
                                                <TableHead className="min-w-[100px]">Kode</TableHead>
                                                <TableHead className="min-w-[150px]">Lokasi</TableHead>
                                                <TableHead className="min-w-[200px]">Spesifikasi</TableHead>
                                                <TableHead className="text-right min-w-[100px]">P (cm)</TableHead>
                                                <TableHead className="text-right min-w-[100px]">L (cm)</TableHead>
                                                <TableHead className="text-right min-w-[100px]">T (cm)</TableHead>
                                                <TableHead className="text-right min-w-[100px]">Vol (m³)</TableHead>
                                                <TableHead className="min-w-[100px]">Satuan</TableHead>
                                                <TableHead className="text-right min-w-[120px]">Harga Jawa</TableHead>
                                                <TableHead className="text-right min-w-[120px]">Harga Jabodetabek</TableHead>
                                                <TableHead className="text-right min-w-[120px]">Harga Luar Jawa</TableHead>
                                                <TableHead className="min-w-[150px]">Link Gambar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{findValue(row, FIELD_MAPPINGS.kategori_mdl) || '-'}</TableCell>
                                                    <TableCell>{findValue(row, FIELD_MAPPINGS.sub_kategori) || '-'}</TableCell>
                                                    <TableCell className="font-medium">{findValue(row, FIELD_MAPPINGS.nama_barang) || '-'}</TableCell>
                                                    <TableCell>{findValue(row, FIELD_MAPPINGS.kode_barang) || '-'}</TableCell>
                                                    <TableCell>{findValue(row, FIELD_MAPPINGS.lokasi_ruangan) || '-'}</TableCell>
                                                    <TableCell className="max-w-[300px] truncate">
                                                        {findValue(row, FIELD_MAPPINGS.spesifikasi_dan_material) || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">{findValue(row, FIELD_MAPPINGS.dimensi_panjang) || '-'}</TableCell>
                                                    <TableCell className="text-right">{findValue(row, FIELD_MAPPINGS.dimensi_lebar) || '-'}</TableCell>
                                                    <TableCell className="text-right">{findValue(row, FIELD_MAPPINGS.dimensi_tinggi) || '-'}</TableCell>
                                                    <TableCell className="text-right">{findValue(row, FIELD_MAPPINGS.volume) || '-'}</TableCell>
                                                    <TableCell>{findValue(row, FIELD_MAPPINGS.kode_satuan_beli) || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        {(findValue(row, FIELD_MAPPINGS.harga_pulau_jawa))?.toLocaleString() || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {(findValue(row, FIELD_MAPPINGS.harga_jabodetabek))?.toLocaleString() || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {(findValue(row, FIELD_MAPPINGS.harga_luar_jawa))?.toLocaleString() || '-'}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate">
                                                        {findValue(row, FIELD_MAPPINGS.link_gambar_kerja) || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                    <FileSpreadsheet className="w-12 h-12 mb-4 text-slate-200" />
                                    <p>No data to display</p>
                                </div>
                            )}
                        </CardContent>

                        {parsedData.length > 0 && (
                            <CardFooter className="flex items-center justify-between border-t p-4">
                                <div className="text-xs text-muted-foreground">
                                    Page {currentPage} of {Math.max(1, totalPages)} (Total {parsedData.length} items)
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
