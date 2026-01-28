"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MDLItem } from "../types"
import { MapPin, Box, Ruler, DollarSign, Image as ImageIcon } from "lucide-react"

interface MDLDetailModalProps {
    item: MDLItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MDLDetailModal({ item, open, onOpenChange }: MDLDetailModalProps) {
    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-7xl !max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded text-slate-600">{item.kode_barang || 'NO-CODE'}</span>
                        <span className="truncate">{item.nama_barang}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Left Column: Identity & Specs */}
                    <div className="space-y-6">
                        {/* Image Preview Logic
                        {item.foto ? (
                            <div className="aspect-video bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200 overflow-hidden relative">
                                <img
                                    src={item.foto.startsWith('http') ? item.foto : `${process.env.NEXT_PUBLIC_API_URL}/${item.foto}`}
                                    alt={item.nama_barang}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        ) : item.link_gambar_kerja ? (
                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg text-center flex flex-col items-center justify-center aspect-video">
                                <Box className="w-10 h-10 text-blue-300 mb-2" />
                                <p className="text-sm text-blue-700 font-medium mb-3">No Image Available</p>
                                <a
                                    href={item.link_gambar_kerja}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    View Working Drawing
                                </a>
                            </div>
                        ) : (
                            <div className="aspect-video bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                                <div className="flex flex-col items-center text-slate-400">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs">No Image & No Link</span>
                                </div>
                            </div>
                        )} */}

                        <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2 text-blue-600">
                                <Box className="w-4 h-4" /> Identity
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-muted-foreground text-xs">Category</label>
                                    <div className="font-medium">{item.kategori_mdl}</div>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs">Sub Category</label>
                                    <div className="font-medium">{item.sub_kategori || '-'}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-muted-foreground text-xs">Location / Room</label>
                                    <div className="font-medium flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {item.lokasi_ruangan || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2 text-purple-600">
                                <Ruler className="w-4 h-4" /> Specs & Dimensions
                            </h4>
                            <div className="bg-slate-50 p-3 rounded-md text-sm space-y-3">
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-white p-2 rounded border">
                                        <div className="text-[10px] text-muted-foreground uppercase">Length</div>
                                        <div className="font-mono font-bold">{item.dimensi_panjang || 0}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border">
                                        <div className="text-[10px] text-muted-foreground uppercase">Width</div>
                                        <div className="font-mono font-bold">{item.dimensi_lebar || 0}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border">
                                        <div className="text-[10px] text-muted-foreground uppercase">Height</div>
                                        <div className="font-mono font-bold">{item.dimensi_tinggi || 0}</div>
                                    </div>
                                    <div className="bg-purple-50 p-2 rounded border border-purple-100">
                                        <div className="text-[10px] text-purple-600 uppercase font-bold">Vol (m³)</div>
                                        <div className="font-mono font-bold text-purple-700">{item.volume || 0}</div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-muted-foreground text-xs block mb-1">Specifications</label>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {item.spesifikasi_dan_material || "No detailed specifications."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing & Others */}
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2 text-emerald-600">
                                <DollarSign className="w-4 h-4" /> Pricing Information
                            </h4>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-emerald-50 p-3 border-b flex justify-between items-center">
                                    <span className="text-emerald-800 font-medium text-sm">Main Price (Java)</span>
                                    <span className="text-lg font-bold text-emerald-700 font-mono">
                                        Rp {item.harga_pulau_jawa?.toLocaleString('id-ID') || 0}
                                    </span>
                                </div>
                                <div className="p-3 bg-white space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Jabodetabek</span>
                                        <span className="font-mono">Rp {item.harga_jabodetabek?.toLocaleString('id-ID') || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Outer Java</span>
                                        <span className="font-mono">Rp {item.harga_luar_jawa?.toLocaleString('id-ID') || 0}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Purchasing Unit</span>
                                        <Badge variant="outline">{item.nama_satuan_beli || 'UNIT'}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Additional Info</h4>
                            <div className="text-sm space-y-3">
                                <div className="flex justify-between py-2 border-b border-dashed">
                                    <span className="text-muted-foreground">Warranty Priority</span>
                                    <span className="font-medium text-right max-w-[200px]">{item.prioritas_garansi || '-'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-dashed">
                                    <span className="text-muted-foreground">Created At</span>
                                    <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="py-2">
                                    <span className="text-muted-foreground block mb-1">Working Drawing Link</span>
                                    {item.link_gambar_kerja ? (
                                        <a
                                            href={item.link_gambar_kerja}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline break-all block truncate"
                                        >
                                            {item.link_gambar_kerja}
                                        </a>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
