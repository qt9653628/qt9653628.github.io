import * as Sentry from '@sentry/react'
import { useEffect, useState } from 'react'

export function dataURItoBlob(dataURI: string) {
  const mime = dataURI.split(',')[0].split(':')[1].split(';')[0]
  const binary = atob(dataURI.split(',')[1])
  const array = []
  for (let i = 0; i < binary.length; i += 1) {
    array.push(binary.charCodeAt(i))
  }
  return new Blob([new Uint8Array(array)], { type: mime })
}

export function downloadImage(file: File) {
  const uri = URL.createObjectURL(file)

  const link = document.createElement('a')
  link.href = uri
  link.download = file.name

  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  )

  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    // window.URL.revokeObjectURL(base64)
    link.remove()
  }, 100)
}

export async function shareImage(file: File) {
  const filesArray = [file]
  const shareData = {
    files: filesArray,
  }
  const nav: any = navigator
  const canShare = nav.canShare && nav.canShare(shareData)
  const userAgent = navigator.userAgent || navigator.vendor
  const isMobile = /android|iPad|iPhone|iPod/i.test(userAgent)
  if (canShare && isMobile) {
    try {
      await navigator.share(shareData)
      return true
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return true
      }
      if (err.name !== 'NotAllowedError') {
        Sentry.captureException(err)
      }
      return false
    }
  }
  return false
}

export async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>(resolve => {
    canvas.toBlob(blob => {
      if (!blob) throw new Error('Could not convert canvas to blob')

      resolve(blob)
    })
  })
}

export function loadImage(image: HTMLImageElement, src: string) {
  return new Promise((resolve, reject) => {
    const initSRC = image.src
    const img = image
    img.onload = resolve
    img.onerror = err => {
      img.src = initSRC
      reject(err)
    }
    img.src = src
  })
}

export function useImage(file?: File): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>()

  useEffect(() => {
    if (!file) {
      setImage(undefined)
      return
    }
    const img = new Image()
    img.onload = () => {
      setImage(img)
    }
    img.src = URL.createObjectURL(file)
    return () => {
      img.onload = null
    }
  }, [file])

  return image
}

// https://stackoverflow.com/questions/23945494/use-html5-to-resize-an-image-before-upload
interface ResizeImageFileResult {
  file: File
  resized: boolean
  originalWidth: number
  originalHeight: number
}
export async function resizeImageFile(
  file: File,
  maxSize: number
): Promise<ResizeImageFileResult> {
  const image = await getImage(file)
  const canvas = document.createElement('canvas')

  let { width, height } = image

  if (width > height) {
    if (width > maxSize) {
      height *= maxSize / width
      width = maxSize
    }
  } else if (height > maxSize) {
    width *= maxSize / height
    height = maxSize
  }

  if (width === image.width && height === image.height) {
    return {
      file,
      resized: false,
      originalWidth: image.width,
      originalHeight: image.height,
    }
  }

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('could not get context')
  }
  canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/jpeg')
  const blob = dataURItoBlob(dataUrl)
  const f = new File([blob], file.name, {
    type: file.type,
  })
  return {
    file: f,
    resized: true,
    originalWidth: image.width,
    originalHeight: image.height,
  }
}

export function getImage(file: File): Promise<HTMLImageElement> {
  const reader = new FileReader()
  const image = new Image()
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) {
      reject(new Error('Not an image'))
      return
    }
    reader.onload = (readerEvent: any) => {
      image.onload = () => resolve(image)
      image.src = readerEvent.target.result
    }
    reader.readAsDataURL(file)
  })
}
