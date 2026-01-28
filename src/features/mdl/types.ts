export interface MDLItem {
    id: number;
    kategori_mdl: string;
    sub_kategori?: string;
    lokasi_ruangan?: string;
    kode_barang?: string;
    nama_barang: string;
    spesifikasi_dan_material?: string;

    // Dimensions
    dimensi_panjang?: number;
    dimensi_lebar?: number;
    dimensi_tinggi?: number;
    volume?: number;

    // Unit
    kode_satuan_beli?: string;
    nama_satuan_beli?: string;

    // Pricing
    harga_jabodetabek?: number;
    harga_pulau_jawa?: number;
    harga_luar_jawa?: number;

    // Other
    prioritas_garansi?: string;
    link_gambar_kerja?: string;
    foto?: string;

    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
}

export interface MDLStats {
    totalItems: number;
    totalCategories: number;
    categoryCounts: Record<string, number>;
}

export interface MDLQueryParams {
    page?: number;
    per_page?: number;
    search?: string;
    kategori?: string;
    sub_kategori?: string;
    min_price?: number;
    max_price?: number;
}
