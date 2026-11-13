// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
export declare function bangGia(sp: SP): Promise<{
    ds: {
        id: number;
        ma: string;
        ten: string;
        don_vi: string;
        gia: number | null;
        tu: string | null;
    }[];
    dv: {
        id: number;
        ma: string;
        ten: string;
        don_vi: string;
        gia: number | null;
        tu: string | null;
    };
    lichSu: {
        don_gia: number;
        hieu_luc_tu: string;
        hieu_luc_den: string | null;
        nguoi: string | null;
    }[];
}>;
