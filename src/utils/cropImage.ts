export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Load an image from a URL and return the HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

/**
 * Given a source image and crop area, returns a Blob of the cropped image.
 * The output is a square (or whatever aspect the crop is) JPEG/WebP.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: PixelCrop,
  mimeType: string = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Cannot get canvas context')

  // Use the crop dimensions directly (already in natural pixel space from react-easy-crop)
  canvas.width = crop.width
  canvas.height = crop.height

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}