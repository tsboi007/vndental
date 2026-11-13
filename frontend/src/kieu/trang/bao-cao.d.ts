// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function baoCao(sp: SP): Promise<{
    thang: string;
    doanhThuBs: {
        ho_ten: string;
        doanh_thu: number;
    }[];
    gheTrong: {
        ghe: string;
        ghe_id: number;
        gio_bat_dau: number;
        so_khung: number;
        so_trong: number;
    }[];
    quaSauThang: {
        id: number;
        ho_ten: string;
        sdt: string;
        lan_cuoi: string;
    }[];
    huy: {
        viec: string | null;
        ly_do_huy: string;
        ben_huy: string | null;
        n: number;
    }[];
    no: {
        benh_nhan_id: number;
        ho_ten: string;
        tong_no: number;
        so_hd: number;
    }[];
    lieuTrinh: {
        lieu_trinh_id: number;
        ho_ten: string;
        ten: string;
        so_buoi_da_lam: number;
        tong_so_buoi: number;
        so_buoi_con_lai: number;
    }[];
    sapHet: {
        id: number;
        ten: string;
        ton_kho: number;
        nguong_dat_them: number;
    }[];
    soSanh: {
        thang_nay: number | null;
        thang_truoc: number | null;
    }[];
    theoThang: {
        thang: string;
        doanh_thu: number;
    }[];
}>;
