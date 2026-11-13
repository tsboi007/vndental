// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
type HD = {
    hoa_don_id: number;
    ma_hoa_don: string;
    lap_luc: string;
    tong_tien: number;
    da_thu: number;
    con_no: number;
    benh_nhan_id: number;
    ho_ten: string;
    sdt: string;
    noi_dung: string | null;
    so_ngay: number;
};
export declare function congNo(sp: SP): Promise<{
    tim: string;
    qua30: boolean;
    rows: HD[];
    thuThang: {
        tong: number;
        lan: number;
    }[];
}>;
export {};
