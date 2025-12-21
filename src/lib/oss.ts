import OSS from 'ali-oss'

class OSSService {
  private client: OSS | null = null
  private static instance: OSSService | null = null

  private constructor() {}

  /**
   * 获取 OSSService 单例
   */
  static getInstance(): OSSService {
    if (!OSSService.instance) {
      OSSService.instance = new OSSService()
    }
    return OSSService.instance
  }

  /**
   * 获取 OSS 客户端
   */
  private getClient(): OSS {
    if (this.client) {
      return this.client
    }

    const accessKeyId = process.env.OSS_ACCESS_KEY_ID
    const accessKeySecret = process.env.OSS_ACCESSKEY_SECRET
    const bucket = process.env.OSS_BUCKET
    const region = process.env.OSS_REGION || 'oss-cn-beijing'

    if (!accessKeyId || !accessKeySecret || !bucket) {
      throw new Error('OSS configuration is incomplete. Please check OSS_ACCESS_KEY_ID, OSS_ACCESSKEY_SECRET, and OSS_BUCKET environment variables.')
    }

    this.client = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
    })

    return this.client
  }

  /**
   * 生成唯一的文件名
   * @param originalName 原始文件名
   * @returns 唯一的文件名
   */
  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = originalName.split('.').pop() || 'jpg'
    const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')
    return `blog/${timestamp}-${random}-${baseName}.${ext}`
  }

  /**
   * 上传文件到 OSS
   * @param buffer 文件 Buffer
   * @param fileName 文件名
   * @returns 上传后的文件 URL
   */
  async upload(buffer: Buffer, fileName: string): Promise<string> {
    const client = this.getClient()
    const objectName = this.generateUniqueFileName(fileName)

    // 上传时设置文件为公共读，这样可以直接通过 URL 访问
    const result = await client.put(objectName, buffer, {
      headers: {
        'x-oss-object-acl': 'public-read'
      }
    })

    // 返回文件的 URL
    // 如果配置了自定义域名，可以在这里替换
    const customDomain = process.env.OSS_CUSTOM_DOMAIN
    if (customDomain) {
      return `${customDomain}/${objectName}`
    }

    return result.url
  }

  /**
   * 删除 OSS 文件
   * @param objectName 文件路径
   */
  async delete(objectName: string): Promise<void> {
    const client = this.getClient()
    await client.delete(objectName)
  }

  /**
   * 获取文件的签名 URL（用于私有文件访问）
   * @param objectName 文件路径
   * @param expires 过期时间（秒），默认 3600
   * @returns 签名 URL
   */
  getSignedUrl(objectName: string, expires: number = 3600): string {
    const client = this.getClient()
    return client.signatureUrl(objectName, { expires })
  }
}

// 导出单例
export const ossService = OSSService.getInstance()

// 为了兼容现有代码，保留原有导出
export async function uploadToOSS(buffer: Buffer, fileName: string): Promise<string> {
  return ossService.upload(buffer, fileName)
}
