// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function kho(sp: SP): Promise<{
    loc: string;
    ds: {
        id: number;
        ma: string;
        ten: string;
        loai: string;
        don_vi: string;
        ton_kho: number;
        nguong_dat_them: number;
        gia_ban: number | null;
    }[];
    sapHet: {
        id: number;
        ma: string;
        ten: string;
        loai: string;
        don_vi: string;
        ton_kho: number;
        nguong_dat_them: number;
        gia_ban: number | null;
    }[];
    hien: {
        id: number;
        ma: string;
        ten: string;
        loai: string;
        don_vi: string;
        ton_kho: number;
        nguong_dat_them: number;
        gia_ban: number | null;
    }[];
    chon: {
        id: number;
        ma: string;
        ten: string;
        loai: string;
        don_vi: string;
        ton_kho: number;
        nguong_dat_them: number;
        gia_ban: number | null;
    };
    lichSu: {
        thoi_diem: string;
        loai: string;
        so_luong: number;
        ghi_chu: string | null;
        ai: string | null;
        viec: string | null;
        benh_nhan: string | null;
    }[];
}>;
