// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
type HD = {
    id: number;
    ma_hoa_don: string;
    benh_nhan_id: number;
    ho_ten: string;
    ma_ho_so: string;
    sdt: string;
    phieu_dieu_tri_id: number | null;
    kham_luc: string | null;
    nguoi_lap: string;
    lap_luc: string;
    ghi_chu: string | null;
    tong_tien: number;
    da_thu: number;
    con_no: number;
};
export declare function hoaDonChiTiet(sp: SP): Promise<{
    id: number;
    hd: HD;
    dong: {
        id: number;
        mo_ta: string;
        so_luong: number;
        don_gia: number;
        giam_gia: number;
        thanh_tien: number;
        bac_si: string | null;
    }[];
    thu: {
        id: number;
        so_tien: number;
        hinh_thuc: string;
        ma_giao_dich: string | null;
        thu_luc: string;
        nguoi: string;
    }[];
    dot: {
        id: number;
        ten: string;
        dot_so: number;
        mo_ta: string | null;
        so_tien: number;
    }[];
    bacSi: {
        id: number;
        ho_ten: string;
        vai_tro: string;
    }[];
}>;
export {};
