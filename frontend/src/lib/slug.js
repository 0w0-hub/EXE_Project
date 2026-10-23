/**
 * Slug tiếng Việt cho URL (vd "Phòng khách Modern" -> "phong-khach-modern") — chỉ để đường dẫn dễ đọc/chia
 * sẻ hơn, không phải định danh: `DesignResult` vẫn tra cứu job bằng `jobId` (UUID) trong URL, slug bị bỏ qua
 * hoàn toàn khi đọc dữ liệu.
 */
export function slugify(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
