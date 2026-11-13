// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function lieuTrinh(sp: SP): Promise<{
    tt: string;
    ds: {
        id: number;
        ten: string;
        loai: string;
        ho_ten: string;
        benh_nhan_id: number;
        bac_si: string;
        ngay_bat_dau: string;
        tong_so_buoi: number;
        tong_chi_phi: number;
        da_lam: number;
        da_lap: number;
    }[];
}>;
