"use client";

import { ListSpkMasukTable } from "./_components/list-spk-masuk-table";

export default function ListSpkMasukPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight pt-4">Master Data List SPK Masuk</h1>
                <p className="text-sm text-muted-foreground">
                    Pencatatan dan pengelolaan daftar SPK yang telah diterima dari klien.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <ListSpkMasukTable />
            </div>
        </div>
    );
}
