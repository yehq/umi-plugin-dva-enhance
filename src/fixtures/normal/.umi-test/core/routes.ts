import { ApplyPluginsType } from '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/node_modules/@umijs/runtime/dist/index.js';
import { plugin } from './plugin';

const routes = [
  {
    "path": "/",
    "component": require('/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/src/fixtures/normal/pages/index').default,
    "exact": true
  }
];

// allow user to extend routes
plugin.applyPlugins({
  key: 'patchRoutes',
  type: ApplyPluginsType.event,
  args: { routes },
});

export { routes };
