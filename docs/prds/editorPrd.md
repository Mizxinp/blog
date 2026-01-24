# 文章编辑器

## 需求v1.0.0 编辑器图片支持复制自动上传

概述：现在的文章编辑器如果将已经写好的md格式直接复制过来，md格式中的图片也会一起展示，但是系统中有自己的oss，所以当复制过来发现md中包含的图片不是自己oss的图片时，则需要自动进行下载上传到oss。 md文档类似这样的：
```markdown
执行后会先出现这个选项，选移动端还是浏览器
![choose](https://img.wemd.app/1769159583971_b97pcz.png)

运行后会出现这样的一个二维码：
![qrcode](https://img.wemd.app/1769159575804_9uknab.png)
```

前端：
- 入口： app/admin/editor/[id]/page.tsx 中的 SimpleEditor
- 如何判断是否是自己的oss，通过，直接通过一个常量域名判断就行，系统中的oss域名是： 
https://miz-pub-bucket.oss-cn-beijing.aliyuncs.com/blog
- 上传到oss功能已经有了，编辑器（simple-editor）中的handleImageUpload

后端：
- 添加相关代码（如果需要的话）

