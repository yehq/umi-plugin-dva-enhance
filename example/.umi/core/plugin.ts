import { Plugin } from '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/node_modules/@umijs/runtime/dist/index.js';

const plugin = new Plugin({
  validKeys: ['patchRoutes','rootContainer','render','onRouteChange','dva','dva-enhance',],
});
plugin.register({
  apply: require('/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/example/.umi/plugin-dva-enhance/runtime.tsx'),
  path: '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/example/.umi/plugin-dva-enhance/runtime.tsx',
});
plugin.register({
  apply: require('/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/example/.umi/plugin-dva/runtime.tsx'),
  path: '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/example/.umi/plugin-dva/runtime.tsx',
});

export { plugin };
