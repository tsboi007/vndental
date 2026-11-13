// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function danhMuc(sp: SP): Promise<{
    tab: string;
    nhanVien: {
        id: number;
        ho_ten: string;
        sdt: string | null;
        vai_tro: string;
        ten_dang_nhap: string;
        ban_thoi_gian: boolean;
        dang_lam_viec: boolean;
        so_ca_tuan: number;
        co_mat_khau: boolean;
    }[];
    dichVu: {
        id: number;
        ma: string;
        ten: string;
        nhom: string | null;
        don_vi: string;
        theo_rang: boolean;
        dang_ap_dung: boolean;
        gia: number | null;
        so_lan: number;
    }[];
    ghe: {
        id: number;
        ten: string;
        dang_hoat_dong: boolean;
        lich_sap_toi: number;
    }[];
    lyDo: {
        ma: string;
        ten: string;
        dang_dung: boolean;
        so_lan: number;
    }[];
}>;
