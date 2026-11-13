// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function phieuDieuTri(sp: SP): Promise<{
    tatCa: boolean;
    chon: number;
    hom: string;
    cho: {
        id: number;
        gio_bat_dau: string;
        trang_thai: string;
        ho_ten: string;
        di_ung: string | null;
        tien_su_benh: string | null;
        bac_si: string;
        bac_si_id: number;
        ghe: string;
        viec: string | null;
        noi_dung: string | null;
        phieu_id: number | null;
    }[];
    phieu: {
        id: number;
        kham_luc: string;
        ho_ten: string;
        bac_si: string;
        viec: string | null;
        trang_thai: string | null;
        co_hoa_don: boolean;
    }[];
}>;
