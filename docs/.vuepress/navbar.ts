/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig([
  {
    text: '统计',
    icon: 'simple-icons:umami',
    link: 'https://umami.acmsz.top/share/9PRtp5s5D0AqW9Hz/hw.acmsz.top',
  },
  {
    text: '目录',
    items: [
      { text: '八上', link: 'G8S1/' },
      { text: '八下', link: 'G8S2/' },
      { text: '九上', link: '/' },
    ]
  },
])
