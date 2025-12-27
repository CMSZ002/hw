import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "src",
  lang: 'zh-CN',
  title: "作业 | VitePress",
  description: "由 Vite 和 Vue 驱动的作业网站",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: '目录',
        items: [
          {
            items: [
              { text: '八年级上册', link: '/G8S1/' },
              { text: '八年级下册', link: '/G8S2/' },
              { text: '九年级上册', link: '/' },
            ]
          }
        ]
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/CMSZ002/hw' }
    ],
    editLink: {
      pattern: 'https://github.com/CMSZ002/hw/edit/vitepress/src/:path',
      text: '在 GitHub 上编辑此页面'
    },
    outline: {
      label: '页面导航'
    },
    notFound: {
      title: '页面未找到',
      quote:
        '但如果你不改变方向，并且继续寻找，你可能最终会到达你所前往的地方。',
      linkLabel: '前往首页',
      linkText: '带我回首页'
    },
    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    skipToContentLabel: '跳转到内容',
  
  },
  markdown: {
    image: {
      lazyLoading: true
    },
    container: {
      tipLabel: '提示',
      warningLabel: '警告',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '详细信息'
    }
  },
  head: [
    [
      'script',
      {
        defer: 'defer',
        src: '/assets/umami.js',
        'data-website-id': '50438526-3c87-410d-8c6c-8bf7fc0ab6f3',
        'data-host-url': 'https://umami.acmsz.top'
      }
    ]
  ],
  rewrites: {
    'G9S1.md': '/index.md',
    'G8S2.md': 'G8S2/index.md',
    'G8S1.md': 'G8S1/index.md'
  },
  cleanUrls: true,
  lastUpdated: true,
})
