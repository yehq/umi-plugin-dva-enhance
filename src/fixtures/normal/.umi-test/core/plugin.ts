import { Plugin } from '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/node_modules/@umijs/runtime/dist/index.js';

const plugin = new Plugin({
  validKeys: ['patchRoutes','rootContainer','render','onRouteChange','dva-enhance',],
});
plugin.register({
  apply: require('/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/src/fixtures/normal/.umi-test/plugin-dva-enhance/runtime.tsx'),
  path: '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/src/fixtures/normal/.umi-test/plugin-dva-enhance/runtime.tsx',
});

export { plugin };
