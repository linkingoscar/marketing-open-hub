/** @type {import('next').NextConfig} */
const nextConfig = {
  output: undefined,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.deepseek.com https://api.xiaomimimo.com https://dashscope.aliyuncs.com https://api.moonshot.cn https://ark.cn-beijing.volces.com https://qianfan.baidubce.com https://spark-api-open.xf-yun.com https://open.bigmodel.cn https://generativelanguage.googleapis.com https://api.semanticscholar.org",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
