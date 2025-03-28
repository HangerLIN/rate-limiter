# 限流算法可视化

该项目是一个直观的交互式可视化工具，用于展示和比较四种常见的限流算法：固定窗口、滑动窗口、令牌桶和漏桶。通过动画效果，用户可以清晰理解各种算法的工作原理及其在处理流量时的差异。

## 主要特性

- **四种限流算法的动态可视化**：通过生动的动画展示不同算法的工作原理
- **交互式体验**：用户可以实时开启/停止模拟、调整参数、触发突发流量等
- **算法实现代码展示**：每个算法旁边都展示了对应的Java实现代码
- **直观对比**：清晰展示令牌桶和漏桶算法之间的关键差异
- **响应式设计**：适配各种屏幕尺寸

## 限流算法概述

1. **固定窗口限流**
   - 在固定时间窗口内限制请求数量，窗口结束时重置计数器
   - 简单易实现，但在窗口边界可能出现突发流量

2. **滑动窗口限流**
   - 基于时间的滑动窗口，计算过去一段时间内的请求数
   - 比固定窗口更平滑，避免了窗口边界问题

3. **令牌桶限流**
   - 以固定速率向桶中添加令牌，每个请求消耗一个令牌
   - 允许一定程度的突发流量（桶满时可以一次性消耗多个令牌）
   - 支持预填充令牌，可以应对突发流量

4. **漏桶限流**
   - 请求先进入桶中排队，然后以恒定速率处理
   - 超出桶容量的请求被拒绝
   - 与令牌桶不同，漏桶始终以固定速率处理请求，不允许任何突发流量

## 最近更新

1. 修复了令牌桶实现中突发流量处理的逻辑问题
2. 增强了漏桶可视化效果，使排队和流出过程更加直观
3. 添加了更多的动画效果和状态指示
4. 为每个算法组件添加了详细的文本说明
5. 添加了Java实现代码展示

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看运行效果。

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion (动画效果)

## 项目结构

- `/src/app/components/` - 各种限流算法组件
- `/src/app/components/RateLimitVisualizer.tsx` - 主可视化容器
- `/src/app/components/RateLimiterCard.tsx` - 算法卡片组件
- `/src/app/components/CodeBlock.tsx` - 代码展示组件

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
