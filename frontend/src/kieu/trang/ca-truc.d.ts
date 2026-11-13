// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function caTruc(sp: SP): Promise<{
    goc: string;
    tuan: string;
    ngayTuan: string[];
    nhanVien: {
        id: number;
        ho_ten: string;
        vai_tro: string;
        ban_thoi_gian: boolean;
    }[];
    ca: {
        id: number;
        nhan_vien_id: number;
        ngay: string;
        buoi: string;
        gio_bat_dau: string;
        gio_ket_thuc: string;
        vai_tro: string;
    }[];
}>;
