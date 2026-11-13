// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
import { type BenhNhan } from '@/lib/data';
export declare function benhNhanChiTiet(sp: SP): Promise<{
    id: number;
    tab: string;
    bn: BenhNhan;
    kham: {
        id: number;
        kham_luc: string;
        bac_si: string;
        viec: string | null;
        ma_hoa_don: string | null;
        hoa_don_id: number | null;
        con_no: number | null;
    }[];
    lich: {
        id: number;
        ngay: string;
        gio_bat_dau: string;
        trang_thai: string;
        bac_si: string;
        viec: string | null;
    }[];
    hoaDon: {
        hoa_don_id: number;
        ma_hoa_don: string;
        lap_luc: string;
        tong_tien: number;
        da_thu: number;
        con_no: number;
    }[];
    lieuTrinh: {
        id: number;
        ten: string;
        trang_thai: string;
        tong_so_buoi: number;
        tong_chi_phi: number;
        bac_si: string;
        ngay_bat_dau: string;
        da_lam: number;
        da_thu: number;
    }[];
}>;
