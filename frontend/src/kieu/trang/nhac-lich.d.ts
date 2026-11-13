// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
type Row = {
    id: number;
    gio_bat_dau: string;
    trang_thai: string;
    ho_ten: string;
    sdt: string;
    bac_si: string;
    ghe: string;
    viec: string | null;
    so_goi: number;
    nghe: boolean;
    khong_nghe: boolean;
    da_gui_tin: boolean;
};
export declare function nhacLich(sp: SP): Promise<{
    ngay: string;
    loc: string;
    rows: Row[];
}>;
export {};
