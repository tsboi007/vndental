// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
type Lich = {
    id: number;
    ghe_id: number;
    gio_bat_dau: string;
    trang_thai: string;
    bac_si_id: number;
    bac_si: string;
    benh_nhan: string;
    viec: string | null;
    noi_dung: string | null;
};
export declare function lichHen(sp: SP): Promise<{
    ngay: string;
    loc: number;
    lich: Lich[];
    ca: import("@/lib/data").CaTruc[];
    ghe: {
        id: number;
        ten: string;
    }[];
    huy: {
        n: number;
    }[];
}>;
export {};
