/**
 * 公共上传服务
 * 提供前端上传文件到服务器的统一接口
 */

export interface UploadResult {
  url: string
}

export interface UploadOptions {
  onProgress?: (progress: number) => void
  abortSignal?: AbortSignal
}

/**
 * 上传文件到服务器
 * @param file 要上传的文件
 * @param options 上传选项（进度回调、取消信号等）
 * @returns 上传结果，包含文件URL
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, abortSignal } = options

  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Handle abort signal
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('Upload cancelled'))
      })
    }

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress?.(progress)
      }
    })

    // Handle response
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.code === '0' && response.result?.url) {
            resolve({ url: response.result.url })
          } else {
            reject(new Error(response.message || 'Upload failed'))
          }
        } catch {
          reject(new Error('Invalid response format'))
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText)
          reject(new Error(response.message || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'))
    })

    // Send request
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

/**
 * 上传图片文件
 * @param file 图片文件
 * @param options 上传选项
 * @returns 上传结果，包含图片URL
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // 验证是否为图片
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  return uploadFile(file, options)
}
