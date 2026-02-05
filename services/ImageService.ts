
class ImageService {
  /**
   * Nén ảnh bằng Canvas API
   * @param file File gốc
   * @param quality Chất lượng nén (0.1 - 1.0)
   * @param maxWidth Chiều rộng tối đa
   */
  static async compressImage(file: File, quality: number = 0.7, maxWidth: number = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Trả về base64 đã nén
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }
}

(window as any).ImageService = ImageService;
