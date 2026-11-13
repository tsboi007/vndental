// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function hoaDon(sp: SP): Promise<{
    tim: string;
    cho: {
        id: number;
        kham_luc: string;
        ho_ten: string;
        bac_si: string;
        viec: string | null;
    }[];
    ds: {
        hoa_don_id: number;
        ma_hoa_don: string;
        lap_luc: string;
        ho_ten: string;
        sdt: string;
        tong_tien: number;
        da_thu: number;
        con_no: number;
    }[];
}>;
