// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
type Phieu = {
    id: number;
    benh_nhan_id: number;
    ho_ten: string;
    ma_ho_so: string;
    ngay_sinh: string | null;
    sdt: string;
    sdt_la_cua: string | null;
    tien_su_benh: string | null;
    di_ung: string | null;
    trang_thai: string;
    hoan_tat_luc: string | null;
    kham_luc: string;
    ghe: string;
    bac_si_chinh_id: number;
    bac_si: string;
    chan_doan: string | null;
    ghi_chu: string | null;
    lich_hen_id: number | null;
    trang_thai_lich: string | null;
    hoa_don_id: number | null;
    ma_hoa_don: string | null;
};
export declare function phieuChiTiet(sp: SP): Promise<{
    id: number;
    rangChon: number;
    p: Phieu;
    sua: boolean;
    viec: {
        id: number;
        rang_so: number | null;
        dich_vu: string;
        so_luong: number;
        bac_si: string;
        lieu_trinh: string | null;
        buoi_thu: number | null;
        ghi_chu: string | null;
    }[];
    thuoc: {
        id: number;
        ten: string;
        don_vi: string;
        lieu_dung: string;
        so_luong: number;
        da_hoan: boolean;
    }[];
    vatTuDung: {
        ten: string;
        don_vi: string;
        so_luong: number;
        viec: string;
    }[];
    lichSu: {
        id: number;
        bang: string;
        thao_tac: string;
        du_lieu_cu: Record<string, unknown> | null;
        du_lieu_moi: Record<string, unknown> | null;
        ai: string | null;
        vai_tro: string | null;
        sua_luc: string;
    }[];
    dichVu: import("@/lib/data").DichVu[];
    bacSi: {
        id: number;
        ho_ten: string;
        vai_tro: string;
    }[];
    khoThuoc: {
        id: number;
        ten: string;
        don_vi: string;
        ton_kho: number;
    }[];
    khoVatTu: {
        id: number;
        ten: string;
        don_vi: string;
        ton_kho: number;
    }[];
    lieuTrinh: {
        lieu_trinh_id: number;
        ten: string;
        so_buoi_da_lam: number;
        tong_so_buoi: number;
    }[];
}>;
export {};
