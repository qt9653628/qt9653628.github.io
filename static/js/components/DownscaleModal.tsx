import { useMemo, useRef } from 'react'
import { useClickAway } from 'react-use'
import { RESIZE_LD } from '../adapters/config'
import Button from './Button'
import Modal from './Modal'

interface DownscaleModalProps {
  onClose: () => void
  onDownscale: () => void
  onUpgrade: () => void
  image: HTMLImageElement
}

export default function DownscaleModal(props: DownscaleModalProps) {
  const { onClose, onDownscale, onUpgrade, image } = props
  const ref = useRef(null)

  useClickAway(ref, onClose)

  const { width, height } = useMemo(() => {
    const maxSize = RESIZE_LD

    if (image.width > image.height) {
      return {
        height: Math.round(image.height * (maxSize / image.width)),
        width: maxSize,
      }
    }
    return {
      width: Math.round(image.width * (maxSize / image.height)),
      height: maxSize,
    }
  }, [image.width, image.height])

  return (
    <Modal
      onClose={onClose}
      className="w-full sm:w-auto h-full sm:h-auto p-0 sm:p-0"
    >
      <div className="flex-1 px-4 pt-6 sm:p-8 flex flex-col justify-between h-full">
        <div>
          <h2 className="text-xl">This is an HD Image</h2>
          <p className="text-xs pb-4 mt-4 opacity-50">
            Upgrade to Pro to keep the original quality, or downscale to
            continue for free.
          </p>
        </div>
        <div className="flex justify-evenly items-end space-x-4 pt-4">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <img src={image.src} className="w-auto h-20 sm:h-32" alt="" />
            <p className="pb-4 text-xs opacity-50">
              {width} x {height}
            </p>
            <Button
              className="hidden sm:block bg-gray-200"
              onClick={onDownscale}
            >
              Continue with SD
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <img src={image.src} className="w-auto h-40 sm:h-64" alt="" />
            <p className="pb-4 text-xs opacity-50">
              {image.width} x {image.height}
            </p>
            <Button primary className="hidden sm:block" onClick={onUpgrade}>
              Try Pro 3 days free
            </Button>
          </div>
        </div>
        <div className="sm:hidden flex flex-col space-y-4 pb-4">
          <Button className="bg-gray-200 h-16" onClick={onDownscale}>
            Continue with SD
          </Button>
          <Button primary className="h-16" onClick={onUpgrade}>
            Try Pro 3 days free
          </Button>
        </div>
      </div>
    </Modal>
  )
}
