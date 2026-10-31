# 添加 p5.js / three.js 作品

建议把这个入口加入浏览器书签：

**[打开作品资料工具](https://cyberjck.github.io/class-portfolio/manage.html)** · **[直接添加 three.js](https://cyberjck.github.io/class-portfolio/manage.html?medium=threejs)**

这个工具负责生成作品资料。填完表单不会立即更改网站；在 GitHub 提交后，Pages 会发布更新。它不需要 GitHub 密码或 token，也不会替你上传作品项目的源码、模型或贴图。

## 1. 准备作品链接

### p5.js

在 p5.js 编辑器里打开新作品，复制完整地址，例如：

`https://editor.p5js.org/jkan349/sketches/作品ID`

也支持同一个作品的 `/full/作品ID` 和 `/embed/作品ID` 链接。不要使用 collection 链接。新作品通过 p5.js 原地址实时播放，请用无痕窗口检查：没有登录 p5.js 也要能看到作品。

### three.js

先把完整 three.js 项目发布为可公开访问的 **HTTPS 网页**，例如放在 GitHub Pages、Netlify 或 Vercel。确认网页能加载项目所需的 JavaScript、模型和贴图，再复制作品实际运行页面的地址。

- 表单里的分类选择 **three.js**，或使用上方「直接添加 three.js」入口。
- 填运行页面地址，例如 `https://你的账号.github.io/你的作品/`。不要填 GitHub 仓库主页、代码文件、编辑器或电脑上的本地文件地址。
- 用无痕窗口确认无需登录就能运行。这个工具只检查链接格式，不能判断网页是否确实使用 three.js、是否在线或能否嵌入。
- 托管页面需要允许 iframe 嵌入，作品才能在网站卡片和详情里播放。如果对方通过浏览器策略禁止嵌入，使用作品的 **Open original** 链接打开原网页。
- three.js 资料不会自动获得摄像头或麦克风权限。需要这些设备的作品应在原网页中访问并授权。

## 2. 生成更新文件

1. 打开资料工具，等待「现有作品已读取」。每次开始新一轮添加前先刷新此页，读取最近发布的数据。
2. 选择作品分类，填链接、名称、类型。介绍、操作方式和封面可选。
3. 点击「加入待添加列表」。一次可以添加多个作品，也可以混合添加 p5.js 和 three.js；误加的待添加项可以移除。
4. 点击「复制完整 JSON」。这个完整文件会保留已有新增作品，原有九个内置作品也会保持原样。

工具只允许移除本次未提交的新项。它不会删除 GitHub 中的已有资料。刷新页面会清空尚未提交的待添加项，请先完成下一步。

如果出现读取失败，不要手动用 `[]` 覆盖原文件。先检查网络和 [`additional-projects.json`](https://github.com/CyberJck/class-portfolio/blob/main/additional-projects.json)，修复后再刷新工具。

## 3. 在仓库提交

1. 点击工具里的「到 GitHub 编辑」，或打开 [additional-projects.json 编辑页](https://github.com/CyberJck/class-portfolio/edit/main/additional-projects.json)。
2. 用有仓库写入权限的账号登录，通常是 **CyberJJack**。
3. 点击文件编辑框，按 **⌘ A** 全选原内容，再按 **⌘ V** 粘贴完整 JSON。Windows 对应 **Ctrl A / Ctrl V**。
4. 点击 **Commit changes…**，输入说明，例如 `Add Orbit Study`，确认提交到 `main`。
5. 到仓库的 [Actions](https://github.com/CyberJck/class-portfolio/actions) 等 Pages 发布变绿，然后刷新 [网站作品区](https://cyberjck.github.io/class-portfolio/#work)。作品会进入表单里选择的 **p5js** 或 **three.js** 分类。

p5.js 作品可以来自不同账号，按账号 / 作品 ID 去重；three.js 按规范化后的运行页面网址去重。同一个作品链接不需要添加两次。

## 封面图片

可选以下任一种方式：

- 填一个可公开访问的 **HTTPS 图片网址**。
- 在 GitHub 打开仓库的 `assets/` 目录，点击 **Add file → Upload files** 上传截图并提交，然后填 `assets/my-cover.webp` 这样的相对路径。文件名建议使用英文字母、数字和短横线。
- 留空：网站使用示意封面，打开作品后可运行原页面。

表单只保存封面路径，不会替你上传图片。不要填电脑本地路径，例如 `/Users/...`，网页访客无法读取它。

## 直接编辑 JSON

也可以直接编辑 `additional-projects.json`。整个文件必须是数组。下面分别给出单个作品的资料格式，请将它加入已有数组，保留原有作品。资料工具会自动处理格式和去重。

p5.js 的格式：

```json
{
  "id": "YOUR_SKETCH_ID",
  "owner": "YOUR_P5_ACCOUNT",
  "title": "My New Work",
  "original": "My New Work",
  "medium": "p5js",
  "type": "CREATIVE CODING",
  "description": "A short introduction.",
  "instructions": "Move the mouse to interact.",
  "source": "https://editor.p5js.org/YOUR_P5_ACCOUNT/sketches/YOUR_SKETCH_ID",
  "remote": true
}
```

three.js 的格式（示例地址须替换为真实运行页）：

```json
{
  "title": "My Three.js Work",
  "original": "My Three.js Work",
  "medium": "threejs",
  "type": "THREE.JS / WEBGL",
  "description": "A short introduction.",
  "instructions": "Drag to orbit.",
  "source": "https://YOUR_ACCOUNT.github.io/YOUR_WORK/",
  "image": "assets/my-three-cover.webp",
  "remote": true
}
```

three.js 的 `id` 由运行页网址自动生成；用工具导出时会包含它。如果手动更换网址，请删除旧 `id` 或重新用工具生成。已有数组里增加一项时，前一项和新项之间需要逗号，最后一项后不要加逗号。

## 关于权限

作品资料工具本身是公开网页，任何人都能填写并生成自己的 JSON，但只有拥有写入权限的账号可以提交仓库。不要在这个表单、JSON 或作品资料里填写密码、API key 或其他秘密。

仓库可见性与网站发布是分别管理的。公开网站需要向访客的浏览器提供实际使用的 JavaScript、图片和视频；公开作品及其运行资源不会因为链接加入作品集而变成不可下载的文件。
