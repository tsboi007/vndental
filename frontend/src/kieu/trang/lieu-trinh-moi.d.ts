// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
import { type BenhNhan } from '@/lib/data';
export declare function lieuTrinhMoi(sp: SP): Promise<{
    bn: BenhNhan | undefined;
    tim: string;
    ketQua: BenhNhan[];
    bacSi: {
        id: number;
        ho_ten: string;
        vai_tro: string;
    }[];
}>;
