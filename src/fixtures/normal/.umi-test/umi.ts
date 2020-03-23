import './core/polyfill';

import { plugin } from './core/plugin';
import { createHistory } from './core/history';
import { ApplyPluginsType } from '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/node_modules/@umijs/runtime/dist/index.js';
import { renderClient } from '/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/node_modules/@umijs/renderer-react/dist/index.js';




const getClientRender = (args: { hot?: boolean } = {}) => plugin.applyPlugins({
  key: 'render',
  type: ApplyPluginsType.compose,
  initialValue: () => {
    return renderClient({
      // @ts-ignore
      routes: require('./core/routes').routes,
      plugin,
      history: createHistory(args.hot),
      rootElement: 'root',
      defaultTitle: '',
    });
  },
  args,
});

const clientRender = getClientRender();
export default clientRender();


    window.g_umi = {
      version: '3.0.12',
    };
  

// hot module replacement
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept('./core/routes', () => {
    getClientRender({ hot: true })();
  });
}
