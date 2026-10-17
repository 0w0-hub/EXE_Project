/**
 * Helper chụp ảnh thumbnail từ WebGL Canvas với nền trong suốt
 */

export function captureCanvasThumbnail(canvas, mimeType = 'image/png', quality = 0.92) {
  if (!canvas) return null;
  try {
    return canvas.toDataURL(mimeType, quality);
  } catch (err) {
    console.error('[ThumbnailCapture] Không thể chụp ảnh canvas:', err);
    return null;
  }
}

export function captureCanvasBlob(canvas, mimeType = 'image/png', quality = 0.92) {
  if (!canvas) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, mimeType, quality);
    } catch (err) {
      console.error('[ThumbnailCapture] Lỗi toBlob:', err);
      resolve(null);
    }
  });
}
