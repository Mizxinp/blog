# 需求

## 需求v1.0.0 编辑器-图片支持复制自动上传

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

## 需求v1.0.1 后台新增html预览

概述：管理后台有个地方新增html预览管理，前台有个页面可以预览。链路：
- 管理员新建一个htmlpreviw， 用户可以通过url查看这个html。 类似文章管理
主要功能
- 类似文章管理，新增一个HTML预览管理，点击后进入是个列表卡片，点击可以编辑，可以删除
- 编辑页： 定义链接slug，然后就是一个大的输入框，使用的时候会将完整的html粘贴到这里，有按钮点击可以预览
- 其他人可以通过链接直接产看这个html的完整内容

前端：
- 后台管理
  - 路径： admin/html
  - 参考文章的路径：admin/page的卡片，点击到 admin/posts, 编辑时：admin/editor/id
- 用户查看：app/html/xxx

后端：
- 新增相关表结构
- migragte同步表
- 相关接口：api/html/xx


## 需求v1.0.2集成编辑器

概述：在项目中集成开源编辑器WeMD， WeMD的源码我已经放到目录的根目录下了 /WeMD，
说明：
- 只集成编辑器部分，不需要集成后端和桌面端，也就是只迁移 /WeMD/apps/web这部分内容
- 将web内容完整迁移到当前项目里
- 放到当前页面路由： /src/app/editor 下
- 相关到组件都放到同一目录下

