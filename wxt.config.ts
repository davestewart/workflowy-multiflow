import { defineConfig } from 'wxt'
import vue from '@vitejs/plugin-vue'

function toArray<T> (value: T | T[]): T[] {
  return Array.isArray(value)
    ? value
    : [value]
}

function resource (url: string | string[], resources: string | string[]) {
  return {
    matches: toArray(url),
    resources: toArray(resources),
  }
}

// See https://wxt.dev/api/config.html
const hostPermissions = [
  'https://workflowy.com/*',
  'https://*.workflowy.com/*',
]

export default defineConfig({
  // folders
  outDir: 'dist',
  srcDir: 'src',
  entrypointsDir: 'pages',

  // manifest
  manifest: {
    name: 'WorkFlowy MultiFlow',
    description : "Multi-column view for WorkFlowy",
    version: '3.0.0',
    // @ts-ignore
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoWDu35r1oWfV8YVlJbXNOpqL3lhgO4wgyb7dfAcl6trIfwsQSg2W3EERJDbN3LzhYEmvszbrQlot+scVpK9WM94HbXag8IBEIiIh24WmX6xlv5PT3j2ibccXiJ9x/sCaP2MGRzPNkkO1hJjBIup6ogn3/U3ynbQ6lqdtYI9Ju0IWSNXIt493Ch/dvD1cjxPzLLcCcrU9O50evAm/gFknFiPla6UKqU6ApkUpnwO3L3emphEXtKcK1I/VfzCFDJ/7PUnOKVBiLwbQWZjSfhdLtdzdwovGgklr4XmicpEL//k5HO9zTjXd8eEL6Yo0ik1Kk/Skm9226B9rQnL6Od9WgwIDAQAB',
    permissions: [
      'declarativeNetRequest',
      'declarativeContent',
      'activeTab',
      'storage',
    ],
    host_permissions: hostPermissions,
    declarative_net_request: {
      rule_resources: [{
        id: 'ruleset',
        enabled: true,
        path: 'rules.json',
      }],
    },
    web_accessible_resources: [
      resource('<all_urls>', 'icon/16.png'),
      resource(hostPermissions, [
        'scripts/installed.js',
        'scripts/links.js',
      ]),
    ],
  },

  // build
  alias: {
    '@utils': './src/utils',
  },

  runner: {
    disabled: true,
    binaries: {
      chrome: '/Applications/Google Chrome.app',
    },
  },

  imports: {
    addons: {
      vueTemplate: true,
    },
  },

  dev: {
    server: {
      port: 3010,
    },
  },

  vite: () => ({
    plugins: [vue()],
  }),
})
