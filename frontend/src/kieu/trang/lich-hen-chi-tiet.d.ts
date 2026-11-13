// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
type Lich = {
    id: number;
    ngay: string;
    gio_bat_dau: string;
    trang_thai: string;
    benh_nhan_id: number;
    ho_ten: string;
    ma_ho_so: string;
    ngay_sinh: string | null;
    sdt: string;
    sdt_la_cua: string | null;
    tien_su_benh: string | null;
    di_ung: string | null;
    ly_do_ten: string | null;
    doi_tu_lich_hen_id: number | null;
    doi_sang_id: number | null;
    bac_si_id: number;
    bac_si: string;
    ghe: string;
    viec: string | null;
    noi_dung: string | null;
    lieu_trinh: string | null;
    buoi_thu: number | null;
    nguoi_dat: string;
    dat_luc: string;
    ly_do_huy_ma: string | null;
    ben_huy: string | null;
    ghi_chu_huy: string | null;
    nguoi_huy: string | null;
    huy_luc: string | null;
    phieu_id: number | null;
};
export declare function lichHenChiTiet(sp: SP): Promise<{
    id: string | string[] | undefined;
    l: Lich;
    nhac: {
        kenh: string;
        ket_qua: string;
        thoi_diem: string;
        ai: string | null;
    }[];
    choXuLy: boolean;
    lyDo: {
        ma: string;
        ten: string;
    }[];
}>;
export {};
