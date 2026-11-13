// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function lieuTrinhChiTiet(sp: SP): Promise<{
    id: number;
    lt: {
        id: number;
        ten: string;
        loai: string;
        trang_thai: string;
        tong_so_buoi: number;
        tong_chi_phi: number;
        ngay_bat_dau: string;
        ghi_chu: string | null;
        benh_nhan_id: number;
        ho_ten: string;
        bac_si_id: number;
        bac_si: string;
    };
    dot: {
        id: number;
        dot_so: number;
        so_tien: number;
        mo_ta: string | null;
        ma_hoa_don: string | null;
        hoa_don_id: number | null;
        con_no: number | null;
    }[];
    buoi: {
        phieu_id: number;
        kham_luc: string;
        buoi_thu: number;
        bac_si: string;
        viec: string;
        ghi_chu: string | null;
    }[];
    hen: {
        id: number;
        ngay: string;
        gio_bat_dau: string;
        buoi_thu: number;
    }[];
}>;
