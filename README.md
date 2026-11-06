# 福建开票信息自动展示

为福建电子税务局蓝字开票页面提供展示选项和项目名称编辑辅助，包含 Chrome / Edge 扩展和 Tampermonkey 油猴脚本两个版本。

**当前版本：1.8.1 · 完全免费 · 独立第三方工具**

## 下载

- [下载安装包](https://github.com/garlic-c/fujian-invoice-display/raw/refs/heads/main/downloads/fujian-invoice-display-v1.8.1.zip)
- [安装油猴脚本](https://github.com/garlic-c/fujian-invoice-display/raw/refs/heads/main/fujian-invoice-display.user.js)
- [查看版本发布页](https://github.com/garlic-c/fujian-invoice-display/releases)

两个版本任选其一，不建议同时启用。

## 功能

在开票页面顶部、店名左侧点击“插件展示设置”。六个选项首次均默认不勾选，修改后自动保存。

| 选项 | 功能 |
| --- | --- |
| 购买方地址 | 控制对应“是否展示” |
| 购方开户银行 | 控制对应“是否展示” |
| 销售方地址 | 控制对应“是否展示” |
| 销方开户银行 | 控制对应“是否展示” |
| 自动跳过提示 | 仅关闭“勾选后，相关信息将展示在备注栏，您可在发票预览查看。”提示，点击其中的“我知道了” |
| 项目名称多行显示 | 长名称自动折行，进入编辑后保持多行，关闭后恢复单行并保留内容 |

在原页面手动取消或勾选“是否展示”，会同步成最新偏好，不会强行恢复已取消的勾选。

## 安装 Chrome / Edge 扩展

1. 下载并解压安装包。
2. 在 Chrome 打开 `chrome://extensions`，或在 Edge 打开 `edge://extensions`。
3. 开启“开发者模式”，点击“加载已解压的扩展程序”。
4. 选择解压后的 `fujian-invoice-display/chrome-extension` 文件夹，其中包含 `manifest.json`。
5. 保存当前未完成工作后，重新进入开票页面。

更新时替换原扩展文件夹中的文件，在扩展管理页点击“重新加载”，再重新进入页面。无需 Chrome 网上应用店注册或付款。

## 安装油猴脚本

先安装 Tampermonkey，再点击上方“安装油猴脚本”。如未弹出安装页，可在油猴中添加新脚本，用本仓库 `fujian-invoice-display.user.js` 全部内容替换默认代码并保存。

若油猴提示需要浏览器开发者模式或允许用户脚本，请按照其提示设置。更新时替换现有脚本，不要重复安装两个副本。

## 适用范围与限制

仅在以下页面运行功能，需要用户自行合法登录并拥有业务权限：

`https://dppt.fujian.chinatax.gov.cn:8443/blue-invoice-makeout/invoice-makeout`

- 不自动保存草稿、预览发票或开具发票；业务数据和最终操作由用户核对。
- 自动折行不向名称插入换行。粘贴的换行转换为空格，回车沿用原候选项操作。
- 不勾选提示中的“本周不再提示”，不处理其他确认弹窗。
- 网站改版可能导致功能失效。发现异常可停用扩展，并在保存工作后重新进入页面。
- 本地模拟测试已覆盖控件重建、编辑焦点、输入同步等；新版在真实站点的中文输入法和候选项兼容性仍需使用者确认。

## 数据处理

为提供多行编辑，代码仅在当前页面内存中读取和同步项目名称。仅在该税务站点的 `localStorage` 中保存六项开关，不持久保存发票字段内容，不发起网络请求，不上传数据，不包含广告或统计代码。

设置存储键：`fj-invoice-display-preferences-v2`。同源网站脚本可以访问这些布尔设置。停用或卸载扩展不会自动删除网站本地存储；如需删除，可在浏览器开发者工具中只删除这个键。清除整个网站数据可能影响登录状态和其他网站设置。

## 反馈

- [提交问题](https://github.com/garlic-c/fujian-invoice-display/issues)
- 维护者：Gerley
- 支持邮箱：Gerleychan@live.com

本工具与税务机关无隶属或官方合作关系，不提供税务咨询，不改变法定开票规则。
