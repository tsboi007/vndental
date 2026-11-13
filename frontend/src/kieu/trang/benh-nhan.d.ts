// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
type SP = Record<string, string | string[] | undefined>;
import { type BenhNhan } from '@/lib/data';
export declare function benhNhan(sp: SP): Promise<{
    tim: string;
    ds: BenhNhan[];
    tong: {
        n: number;
    }[];
}>;
