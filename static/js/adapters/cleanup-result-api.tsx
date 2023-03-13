import { resizeImageFile } from '../utils'

type Fields = {
  inputImage: File
  inputMask: File
  resultImage: File
}

const RESULTS_ENDPOINT = process.env
  .REACT_APP_RESULTS_ENDPOINT_INTERNAL as string

async function resize(file: File, maxSize = 2000) {
  const { file: resized } = await resizeImageFile(file, maxSize)

  return resized
}

export default async function cleanupResultApi(
  fields: Fields,
  isPro: boolean,
  idToken: string,
  appCheckToken?: string
) {
  const body = new FormData()
  body.append('input_image', await resize(fields.inputImage))
  body.append('input_mask', await resize(fields.inputMask))
  body.append('result_image', await resize(fields.resultImage))

  const headers = {
    Authorization: `Bearer ${idToken}`,
    'x-clipdrop-pro-client': isPro ? 'true' : 'false',
    ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {}),
  }

  const result = await fetch(RESULTS_ENDPOINT, {
    method: 'POST',
    body,
    headers,
    // Not compatible with all browsers : https://caniuse.com/mdn-api_request_priority
    // Not critical, just ignored on incompatible browsers
    // @ts-ignore
    priority: 'low',
  })

  if (result.ok) return result.blob()

  throw new Error('[CLEANUP_RESULTS_API] Failed to upload results')
}
