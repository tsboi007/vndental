// Tín hiệu trả về frontend thay cho next/navigation (backend không render trang).

// Lỗi có mã HTTP: 401 chưa đăng nhập, 403 sai vai trò, 404 không thấy, 400 dữ liệu sai.
export class LoiApi extends Error {
  constructor(public status: number, message = '') {
    super(message)
  }
}

// Lệnh ghi xong muốn frontend chuyển sang trang khác: trả { redirect: url }.
export class ChuyenTrang extends Error {
  constructor(public url: string) {
    super('CHUYEN_TRANG')
  }
}

export function redirect(url: string): never {
  throw new ChuyenTrang(url)
}

export function notFound(): never {
  throw new LoiApi(404, 'Không tìm thấy.')
}
