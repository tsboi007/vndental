// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
type LichHom = {
    id: number;
    gio_bat_dau: string;
    trang_thai: string;
    benh_nhan_id: number;
    ho_ten: string;
    bac_si: string;
    ghe: string;
    viec: string | null;
};
export declare function tiepNhan(sp: SP): Promise<{
    tim: string;
    chon: number;
    loc: string;
    hom: string;
    lich: LichHom[];
    nhom: Record<string, string[]>;
    hien: LichHom[];
    ketQua: import("@/lib/data").BenhNhan[];
    bnId: number;
    bn: import("@/lib/data").BenhNhan | undefined;
    lichBn: LichHom[];
    tomTat: {
        con_no: number;
        lieu_trinh: string | null;
    } | undefined;
    ca: import("@/lib/data").CaTruc[];
    ghe: {
        id: number;
        ten: string;
    }[];
}>;
export {};
