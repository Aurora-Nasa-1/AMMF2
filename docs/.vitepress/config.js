export default {
  title: 'AMMF2 文档',
  description: 'Aurora Modular Magisk Framework 2 文档',
  lang: 'zh-CN',
  lastUpdated: true,
  base: process.env.NODE_ENV === 'production' ? '/AMMF2/' : '/',
  srcDir: './',
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' }
    ],
    ignoreDeadLinks: [
      /^\.\.\/\.\.\/LICENSE$/,
      /^\.\.\/README$/
    ],
    // 修改侧边栏配置，确保路径正确
    sidebar: {
      '/': [
        {
          text: '快速开始',
          collapsible: true,  // 添加可折叠选项
          items: [
            { text: '项目概述以及构建指南', link: '/README' },  // 改为指向README
            { text: '目录结构', link: '/directory' },
          ]
        },
        {
          text: '开发指南',
          collapsible: true,
          items: [
            { text: '模块开发指南', link: '/module_development' },
            { text: '脚本指南', link: '/script' },
            { text: 'WebUI 指南', link: '/webui' },
            { text: 'WebUI 页面开发指南', link: '/webui-develop' },
          ]
        }
      ],
      '/en/': [
        {
          text: 'Quick Start',
          items: [
            { text: 'Overview and Build Guide', link: '/en/README' },
            { text: 'Directory Structure', link: '/en/directory' },
          ]
        },
        {
          text: 'Development Guide',
          items: [
            { text: 'Module Development Guide', link: '/en/module_development' },
            { text: 'Script Guide', link: '/en/script' },
            { text: 'WebUI Guide', link: '/en/webui' },
            { text: 'WebUI Page Development Guide', link: '/en/webui-develop' },
          ]
        }
      ]
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Aurora-Nasa-1/AMMF2' }
    ],
    
    // 页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 AuroraNasa'
    },
    
    // 搜索
    search: {
      provider: 'local'
    }
  },
  
  // 多语言配置
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/'
    }
  }
}