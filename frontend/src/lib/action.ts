// Kết quả một thao tác ghi (Server Action -> backend /api/lenh/<ten>) hiển thị trong ActionForm.
export type ActionState = { ok?: string; error?: string; at?: number } | undefined
