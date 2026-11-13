// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
import { type BenhNhan } from '@/lib/data';
export declare function lichHenDat(sp: SP): Promise<{
    bn: BenhNhan | null;
    ketQua: BenhNhan[];
    tomTat: {
        lan_cuoi: string | null;
        sap_toi: string | null;
        con_no: number;
    } | null;
    lieuTrinh: {
        lieu_trinh_id: number;
        ten: string;
        so_buoi_da_lam: number;
        tong_so_buoi: number;
    }[];
    ca: import("@/lib/data").CaTruc[];
    lich: {
        bac_si_id: number;
        ghe_id: number;
        gio_bat_dau: string;
    }[];
    ghe: {
        id: number;
        ten: string;
    }[];
    dichVu: import("@/lib/data").DichVu[];
}>;
