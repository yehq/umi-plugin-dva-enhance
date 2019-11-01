"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getModel = getModel;
exports.getGlobalModels = getGlobalModels;
exports.default = _default;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("fs");

  _fs = function _fs() {
    return data;
  };

  return data;
}

function _path() {
  const data = require("path");

  _path = function _path() {
    return data;
  };

  return data;
}

function _globby() {
  const data = _interopRequireDefault(require("globby"));

  _globby = function _globby() {
    return data;
  };

  return data;
}

var _lodash = _interopRequireDefault(require("lodash.uniq"));

function _pathIsRoot() {
  const data = _interopRequireDefault(require("path-is-root"));

  _pathIsRoot = function _pathIsRoot() {
    return data;
  };

  return data;
}

function _umiUtils() {
  const data = require("umi-utils");

  _umiUtils = function _umiUtils() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

const env = process.env.NODE_ENV;

function getModel(cwd, api) {
  const config = api.config,
        winPath = api.winPath;
  const modelJSPath = (0, _umiUtils().findJS)(cwd, 'model');

  if (modelJSPath) {
    return [winPath(modelJSPath)];
  }

  return _globby().default.sync(`./${config.singular ? 'model' : 'models'}/**/*.{ts,tsx,js,jsx}`, {
    cwd
  }).filter(p => !p.endsWith('.d.ts') && !p.endsWith('.test.js') && !p.endsWith('.test.jsx') && !p.endsWith('.test.ts') && !p.endsWith('.test.tsx')).map(p => api.winPath((0, _path().join)(cwd, p)));
}

function getModelsWithRoutes(routes, api) {
  const paths = api.paths;
  return routes.reduce((memo, route) => {
    return [...memo, ...(route.component && route.component.indexOf('() =>') !== 0 ? getPageModels((0, _path().join)(paths.cwd, route.component), api) : []), ...(route.routes ? getModelsWithRoutes(route.routes, api) : [])];
  }, []);
}

function getPageModels(cwd, api) {
  let models = [];

  while (!isSrcPath(cwd, api) && !(0, _pathIsRoot().default)(cwd)) {
    models = models.concat(getModel(cwd, api));
    cwd = (0, _path().dirname)(cwd);
  }

  return models;
}

function isSrcPath(path, api) {
  const paths = api.paths,
        winPath = api.winPath;
  return (0, _umiUtils().endWithSlash)(winPath(path)) === (0, _umiUtils().endWithSlash)(winPath(paths.absSrcPath));
} // 简单判断当前 dva 版本是否是 esm 规范版本


function isEsmVersion(version) {
  /**
   * dva@2.6 beta 全部走 esm
   *
   * @see https://github.com/umijs/umi/issues/2672#issuecomment-505759031
   */
  const versionItems = String(version).split('.');
  return [2, 6].every((item, index) => Number(versionItems[index]) >= item);
}

function handleDvaDependencyImport(api, {
  dvaVersion,
  shouldImportDynamic
}) {
  let modifyRouterRootComponentValue = `require('dva/router').routerRedux.ConnectedRouter`;
  let addRouterImportValue = shouldImportDynamic ? {
    source: 'dva/dynamic',
    specifier: '_dvaDynamic'
  } : null; // esm 版本

  if (isEsmVersion(dvaVersion)) {
    const importFromDva = ['routerRedux'];

    if (shouldImportDynamic) {
      importFromDva.push('dynamic as _dvaDynamic');
    }

    addRouterImportValue = {
      source: 'dva',
      specifier: `{ ${importFromDva.join(', ')} }`
    };
    modifyRouterRootComponentValue = `routerRedux.ConnectedRouter`;
  }

  if (addRouterImportValue) {
    api.addRouterImport(addRouterImportValue);
  }

  api.modifyRouterRootComponent(modifyRouterRootComponentValue);
}

function getGlobalModels(api, shouldImportDynamic) {
  const paths = api.paths,
        routes = api.routes;
  let models = getModel(paths.absSrcPath, api);

  if (!shouldImportDynamic) {
    // 不做按需加载时，还需要额外载入 page 路由的 models 文件
    models = [...models, ...getModelsWithRoutes(routes, api)]; // 去重

    models = (0, _lodash.default)(models);
  }

  return models;
}

function _default(api, opts = {}) {
  const paths = api.paths,
        cwd = api.cwd,
        compatDirname = api.compatDirname,
        winPath = api.winPath;
  const isDev = process.env.NODE_ENV === 'development';
  const shouldImportDynamic = opts.dynamicImport;
  const dvaDir = compatDirname('dva/package.json', cwd, process.env.DEFAULT_DVA_DIR || (0, _path().dirname)(require.resolve('dva/package.json'))); // eslint-disable-next-line import/no-dynamic-require

  const dvaVersion = require((0, _path().join)(dvaDir, 'package.json')).version;

  function getDvaJS() {
    const dvaJS = (0, _umiUtils().findJS)(paths.absSrcPath, 'dva');

    if (dvaJS) {
      return winPath(dvaJS);
    }
  }

  function getModelName(model) {
    const modelArr = winPath(model).split('/');
    return modelArr[modelArr.length - 1];
  }

  function exclude(models, excludes) {
    return models.filter(model => {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = excludes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          const exclude = _step.value;

          if (typeof exclude === 'function' && exclude(getModelName(model))) {
            return false;
          }

          if (exclude instanceof RegExp && exclude.test(getModelName(model))) {
            return false;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return true;
    });
  }

  function getGlobalModelContent() {
    return exclude(getGlobalModels(api, shouldImportDynamic), (0, _umiUtils().optsToArray)(opts.exclude)).map(path => `
    app.model({ 
      namespace: '${(0, _path().basename)(path, (0, _path().extname)(path))}', 
      ...(getModel(require('${path}').default) || require('${path}').default)
    });
  `.trim()).join('\r\n');
  }

  function getPluginContent() {
    const pluginPaths = _globby().default.sync('plugins/**/*.{js,ts}', {
      cwd: paths.absSrcPath
    });

    const ret = pluginPaths.map(path => `
app.use(require('../../${path}').default);
  `.trim());

    if (opts.immer) {
      ret.push(`
app.use(require('${winPath(require.resolve('dva-immer'))}')());
      `.trim());
    }

    return ret.join('\r\n');
  }

  function getGlobalActionContent() {
    const _exclude$reduce = exclude(getGlobalModels(api, false), (0, _umiUtils().optsToArray)(opts.exclude)).reduce((target, path) => {
      const namespace = (0, _path().basename)(path, (0, _path().extname)(path));
      target.imports.push(`import ${namespace} from '${path.substring(0, path.lastIndexOf((0, _path().extname)(path)))}';`);
      target.actions.push(isDev ? `\t${namespace}: new ${namespace}(),` : `\t\t${namespace}: {},`);
      return target;
    }, {
      imports: [],
      actions: []
    }),
          imports = _exclude$reduce.imports,
          actions = _exclude$reduce.actions;

    return [imports.join('\n'), actions.join('\t\n')];
  }

  function getGlobalStoreStateType() {
    if (!isDev) return ['', ''];

    const _exclude$reduce2 = exclude(getGlobalModels(api, false), (0, _umiUtils().optsToArray)(opts.exclude)).reduce((target, path) => {
      const namespace = (0, _path().basename)(path, (0, _path().extname)(path));
      const prefixName = namespace.charAt(0).toUpperCase() + namespace.slice(1);
      const stateTypeName = `${prefixName}State`;
      target.imports.push(`import { ${stateTypeName} } from '${path.substring(0, path.lastIndexOf((0, _path().extname)(path)))}';`);
      target.state.push(`\t${namespace}: ${stateTypeName},`);
      return target;
    }, {
      imports: [],
      state: []
    }),
          imports = _exclude$reduce2.imports,
          state = _exclude$reduce2.state;

    return [imports.join('\n'), state.join('\t\n')];
  }

  function generateInitDva() {
    const tpl = (0, _path().join)(__dirname, '../template/dva.js.tpl');
    let tplContent = (0, _fs().readFileSync)(tpl, 'utf-8');
    const dvaJS = getDvaJS();

    if (dvaJS) {
      tplContent = tplContent.replace('<%= ExtendDvaConfig %>', `
...((require('${dvaJS}').config || (() => ({})))()),
        `.trim());
    }

    tplContent = tplContent.replace('<%= ExtendDvaConfig %>', '').replace('<%= EnhanceApp %>', '').replace('<%= RegisterPlugins %>', getPluginContent()).replace('<%= RegisterModels %>', getGlobalModelContent());
    api.writeTmpFile('dva.js', tplContent);
  }

  function generateInitAction() {
    const tpl = (0, _path().join)(__dirname, '../template', isDev ? 'actions.ts.dev.tpl' : 'actions.ts.prod.tpl');
    let tplContent = (0, _fs().readFileSync)(tpl, 'utf-8');

    const _getGlobalActionConte = getGlobalActionContent(),
          _getGlobalActionConte2 = _slicedToArray(_getGlobalActionConte, 2),
          importContent = _getGlobalActionConte2[0],
          actionContent = _getGlobalActionConte2[1];

    tplContent = tplContent.replace('<%= ImportActions %>', importContent).replace('<%= RegisterActions %>', actionContent);
    api.writeTmpFile('actions.ts', tplContent);
  }

  function generateInitStoreStateType() {
    const tpl = (0, _path().join)(__dirname, '../template/StoreState.ts.tpl');
    let tplContent = (0, _fs().readFileSync)(tpl, 'utf-8');

    const _getGlobalStoreStateT = getGlobalStoreStateType(),
          _getGlobalStoreStateT2 = _slicedToArray(_getGlobalStoreStateT, 2),
          importState = _getGlobalStoreStateT2[0],
          stateContent = _getGlobalStoreStateT2[1];

    tplContent = tplContent.replace('<%= ImportState %>', importState).replace('<%= StateContent %>', stateContent);
    api.writeTmpFile('StoreState.ts', tplContent);
  }

  api.onGenerateFiles(() => {
    generateInitDva();
    /**
     * 生成  pages/.umi/actions.ts 文件
     */

    generateInitAction();
    /**
     * 生成  types/StoreState.ts 文件
     */

    generateInitStoreStateType();
  });
  handleDvaDependencyImport(api, {
    dvaVersion,
    shouldImportDynamic
  });

  if (shouldImportDynamic) {
    api.modifyRouteComponent((memo, args) => {
      const importPath = args.importPath,
            webpackChunkName = args.webpackChunkName;

      if (!webpackChunkName) {
        return memo;
      }

      let loadingOpts = '';

      if (opts.dynamicImport.loadingComponent) {
        loadingOpts = `LoadingComponent: require('${winPath((0, _path().join)(paths.absSrcPath, opts.dynamicImport.loadingComponent))}').default,`;
      }

      let extendStr = '';

      if (opts.dynamicImport.webpackChunkName) {
        extendStr = `/* webpackChunkName: ^${webpackChunkName}^ */`;
      }

      let ret = `
  __IS_BROWSER
    ? _dvaDynamic({
      <%= MODELS %>
      component: () => import(${extendStr}'${importPath}'),
      ${loadingOpts}
    })
    : require('${importPath}').default
      `.trim();
      const models = getPageModels((0, _path().join)(paths.absTmpDirPath, importPath), api);

      if (models && models.length) {
        ret = ret.replace('<%= MODELS %>', `
app: require('@tmp/dva').getApp(),
models: () => [
  ${models.map(model => `import(${opts.dynamicImport.webpackChunkName ? `/* webpackChunkName: '${(0, _umiUtils().chunkName)(paths.cwd, model)}' */` : ''}'${model}').then(m => { const { getModel } = require('dva-model-enhance'); return { namespace: '${(0, _path().basename)(model, (0, _path().extname)(model))}',...(getModel(m.default) || m.default)}})`).join(',\r\n  ')}
],
      `.trim());
      }

      return ret.replace('<%= MODELS %>', '');
    });
  }

  api.addVersionInfo([`dva@${dvaVersion} (${dvaDir})`, `dva-loading@${require('dva-loading/package').version}`, `dva-immer@${require('dva-immer/package').version}`, `path-to-regexp@${require('path-to-regexp/package').version}`]);
  api.modifyAFWebpackOpts(memo => {
    const alias = _objectSpread({}, memo.alias, {
      dva: dvaDir,
      'dva-loading': require.resolve('dva-loading'),
      'path-to-regexp': require.resolve('path-to-regexp'),
      'object-assign': require.resolve('object-assign')
    }, opts.immer ? {
      immer: require.resolve('immer')
    } : {});

    const extraBabelPlugins = [...(memo.extraBabelPlugins || []), ...(isDev && opts.hmr ? [require.resolve('babel-plugin-dva-hmr')] : [])];
    return _objectSpread({}, memo, {
      alias,
      extraBabelPlugins
    });
  });
  api.addPageWatcher([(0, _path().join)(paths.absSrcPath, 'models'), (0, _path().join)(paths.absSrcPath, 'plugins'), (0, _path().join)(paths.absSrcPath, 'model.js'), (0, _path().join)(paths.absSrcPath, 'model.jsx'), (0, _path().join)(paths.absSrcPath, 'model.ts'), (0, _path().join)(paths.absSrcPath, 'model.tsx'), (0, _path().join)(paths.absSrcPath, 'dva.js'), (0, _path().join)(paths.absSrcPath, 'dva.jsx'), (0, _path().join)(paths.absSrcPath, 'dva.ts'), (0, _path().join)(paths.absSrcPath, 'dva.tsx')]);
  api.registerGenerator('dva:model', {
    Generator: require('./model').default(api),
    resolved: (0, _path().join)(__dirname, './model')
  });
  api.addRuntimePlugin((0, _path().join)(__dirname, './runtime'));
  api.addRuntimePluginKey('dva');
  api.addEntryCodeAhead(`
const app = require('@tmp/dva')._onCreate();
${api.config.disableGlobalVariables ? '' : `window.g_app = app;`}
${api.config.ssr ? `app.router(() => <div />);\napp.start();` : ''}
  `.trim());
}