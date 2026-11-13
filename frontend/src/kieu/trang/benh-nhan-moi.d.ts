// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function benhNhanMoi(sp: SP): Promise<{
    sdt: string;
    daCo: import("@/lib/data").BenhNhan[];
}>;
