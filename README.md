# MiniMax 井字棋演示

一个基于 React + TDesign 的互动示例项目，通过井字棋游戏从零展示 **MiniMax 算法与 Alpha-Beta 剪枝** 的完整工作流程。项目提供真实对弈体验、搜索树可视化和教学说明，帮助学习者理解经典博弈算法的核心思想。

## 功能概览

- **井字棋对弈**：与不可战胜的 AI 实时博弈，体验算法的决策能力。
- **MiniMax + Alpha-Beta**：内置带剪枝优化的博弈树搜索算法，确保最优策略。
- **搜索树可视化**：逐步播放评估过程，展示被剪枝节点、最佳路径和节点评分。
- **动画控制**：自定义播放速度、手动前进/后退，观察每一步判断依据。
- **残局生成器**：一键生成不同复杂度的残局，从局中学习 AI 的应对策略。
- **视频介绍**：嵌入 B 站讲解视频，加深对算法原理的理解。

## 技术栈

- [React 19](https://react.dev/) 与 [React Router](https://reactrouter.com/) 构建单页应用
- [TDesign React](https://tdesign.tencent.com/react/) 组件库与图标
- [Vite 7](https://vitejs.dev/) + TypeScript 提供极速开发体验
- MiniMax + Alpha-Beta 剪枝算法实现与可视化

## 快速开始

```bash
pnpm install
pnpm run dev
```

默认在浏览器访问 `http://localhost:5173/`。

> 项目使用 `pnpm` 作为包管理器，如需使用 `npm` 或 `yarn`，请自行调整命令。

## 项目结构

```text
.
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── assets/
│   └── pages/
│       ├── Game.tsx
│       ├── Demo.tsx
│       └── Video.tsx
├── public/
├── dist/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 主要页面

| 路由 | 说明 |
| --- | --- |
| `/game` | 井字棋对弈界面，提供先手选择、局面高亮与结果弹窗 |
| `/demo` | MiniMax 搜索树可视化演示，支持动画播放、拖拽缩放等交互 |
| `/video` | 嵌入式教学视频，快速回顾算法原理 |

## 开发脚本

| 命令 | 功能 |
| --- | --- |
| `pnpm run dev` | 启动本地开发服务器 |
| `pnpm run build` | 生成生产环境构建产物（`dist/`）|
| `pnpm run preview` | 预览构建结果 |
| `pnpm run lint` | 运行 ESLint 代码检查 |

## 学习建议

1. 先在 `/game` 体验完整对局，感受 AI 如何应对玩家策略。
2. 切换至 `/demo`，通过动画观察 MiniMax 的递归过程与剪枝优化。
3. 自定义残局深度与动画速度，逐步分析复杂局面的决策路径。
4. 观看 `/video` 页面中的讲解视频，加深对算法理论基础的理解。

## 许可证

本项目基于 [MIT License](./LICENSE) 开源，欢迎学习、借鉴与拓展。
