# AI Gateway Web · 免费模型调用台

密码保护的网页，代理到任意 OpenAI 兼容的免费模型网关
（OmniRoute / OpenRouter / 9router / freellmapi 等）。
支持实时刷新「当前可用」模型列表、流式对话。

## 本地运行
```bash
npm install
PASSWORD=sk-834298 npm start
# 打开 http://localhost:3000
```

## 配置
登录后在左侧填写：
- **Base URL**：网关地址，例如 `https://openrouter.ai/api/v1`
- **API Key**：视网关而定，可留空
- 点「↻ 刷新可用模型」自动拉取可用模型，点击模型名即可选用

## 部署到 Render
1. 推到 GitHub 后，在 Render 新建 Web Service 连接该仓库
2. 或本地用脚本一键部署（需 Render Key）：
   ```bash
   RENDER_API_KEY=你的RenderKey GITHUB_TOKEN=你的GHP npm run deploy
   ```
3. 在 Render 环境变量里设置 `PASSWORD`（默认 `sk-834298`）

> 密钥只存在 Render 环境变量里，**不写进仓库**。
