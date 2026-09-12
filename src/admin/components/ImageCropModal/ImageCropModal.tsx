import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { X, ZoomIn } from 'lucide-react'
import { getCroppedImageBlob } from '../../../utils/cropImage'
import './ImageCropModal.css'

interface ImageCropModalProps {
  imageSrc: string
  onCancel: () => void
  onSave: (blob: Blob) => void | Promise<void>
  aspect?: number
  title?: string
}

export function ImageCropModal({
  imageSrc,
  onCancel,
  onSave,
  aspect = 1,
  title = 'Crop Image',
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsSaving(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      await onSave(blob)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="crop-modal__backdrop" onClick={onCancel}>
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal__header">
          <h3 className="crop-modal__title">{title}</h3>
          <button
            className="crop-modal__close"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="crop-modal__body">
          <div className="crop-modal__crop-area">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
              objectFit="contain"
            />
          </div>

          <div className="crop-modal__controls">
            <div className="crop-modal__zoom">
              <ZoomIn size={16} className="crop-modal__zoom-icon" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="crop-modal__zoom-slider"
                aria-label="Zoom"
              />
            </div>
            <p className="crop-modal__hint">
              Drag to reposition · Pinch or use the slider to zoom
            </p>
          </div>
        </div>

        <div className="crop-modal__footer">
          <button
            className="admin-btn admin-btn--secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={handleSave}
            disabled={isSaving || !croppedAreaPixels}
          >
            {isSaving ? 'Saving...' : 'Crop & Save'}
          </button>
        </div>
      </div>
    </div>
  )
}