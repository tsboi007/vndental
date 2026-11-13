// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function doiSoat(sp: SP): Promise<{
    ngay: string;
    loc: string;
    thu: {
        id: number;
        thu_luc: string;
        hinh_thuc: string;
        so_tien: number;
        ma_hoa_don: string;
        hoa_don_id: number;
        ho_ten: string;
        nguoi: string;
    }[];
    chot: {
        tien_mat_he_thong: number;
        tien_mat_dem_duoc: number;
        chenh_lech: number;
        ghi_chu: string | null;
        doi_soat_luc: string;
        nguoi: string;
    } | undefined;
    no: {
        hoa_don_id: number;
        ma_hoa_don: string;
        ho_ten: string;
        con_no: number;
    }[];
}>;
