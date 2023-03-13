const urlParams = new URLSearchParams(window.location.search)

export const RESIZE_LD = 720
export const RESIZE_HD = parseInt(urlParams.get('hd_downscale') || '1440', 10)
