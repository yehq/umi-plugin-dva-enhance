import { readFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import globby from 'globby';
import uniq from 'lodash.uniq';
import isRoot from 'path-is-root';
import { chunkName, findJS, optsToArray, endWithSlash } from 'umi-utils';

const env = process.env.NODE_ENV;

export function getModel(cwd, api) {
  const { config, winPath } = api;

  const modelJSPath = findJS(cwd, 'model');
  if (modelJSPath) {
    return [winPath(modelJSPath)];
  }

  return globby
    .sync(`./${config.singular ? 'model' : 'models'}/**/*.{ts,tsx,js,jsx}`, {
      cwd,
    })
    .filter(
      p =>
        !p.endsWith('.d.ts') &&
        !p.endsWith('.test.js') &&
        !p.endsWith('.test.jsx') &&
        !p.endsWith('.test.ts') &&
        !p.endsWith('.test.tsx'),
    )
    .map(p => api.winPath(join(cwd, p)));
}

function getModelsWithRoutes(routes, api) {
  const { paths } = api;
  return routes.reduce((memo, route) => {
    return [
      ...memo,
      ...(route.component && route.component.indexOf('() =>') !== 0
        ? getPageModels(join(paths.cwd, route.component), api)
        : []),
      ...(route.routes ? getModelsWithRoutes(route.routes, api) : []),
    ];
  }, []);
}

function getPageModels(cwd, api) {
  let models = [];
  while (!isSrcPath(cwd, api) && !isRoot(cwd)) {
    models = models.concat(getModel(cwd, api));
    cwd = dirname(cwd);
  }
  return models;
}

function isSrcPath(path, api) {
  const { paths, winPath } = api;
  return endWithSlash(winPath(path)) === endWithSlash(winPath(paths.absSrcPath));
}

// 简单判断当前 dva 版本是否是 esm 规范版本
function isEsmVersion(version) {
  /**
   * dva@2.6 beta 全部走 esm
   *
   * @see https://github.com/umijs/umi/issues/2672#issuecomment-505759031
   */
  const versionItems = String(version).split('.');

  return [2, 6].every((item, index) => Number(versionItems[index]) >= item);
}

function handleDvaDependencyImport(api, { dvaVersion, shouldImportDynamic }) {
  let modifyRouterRootComponentValue = `require('dva/router').routerRedux.ConnectedRouter`;
  let addRouterImportValue = shouldImportDynamic
    ? {
        source: 'dva/dynamic',
        specifier: '_dvaDynamic',
      }
    : null;

  // esm 版本
  if (isEsmVersion(dvaVersion)) {
    const importFromDva = ['routerRedux'];

    if (shouldImportDynamic) {
      importFromDva.push('dynamic as _dvaDynamic');
    }

    addRouterImportValue = {
      source: 'dva',
      specifier: `{ ${importFromDva.join(', ')} }`,
    };

    modifyRouterRootComponentValue = `routerRedux.ConnectedRouter`;
  }

  if (addRouterImportValue) {
    api.addRouterImport(addRouterImportValue);
  }

  api.modifyRouterRootComponent(modifyRouterRootComponentValue);
}

export function getGlobalModels(api, shouldImportDynamic) {
  const { paths, routes } = api;
  let models = getModel(paths.absSrcPath, api);
  if (!shouldImportDynamic) {
    // 不做按需加载时，还需要额外载入 page 路由的 models 文件
    models = [...models, ...getModelsWithRoutes(routes, api)];
    // 去重
    models = uniq(models);
  }
  return models;
}

export default function(api, opts = {}) {
  const { paths, cwd, compatDirname, winPath } = api;
  const isDev = process.env.NODE_ENV === 'development';
  const shouldImportDynamic = opts.dynamicImport;

  const dvaDir = compatDirname(
    'dva/package.json',
    cwd,
    process.env.DEFAULT_DVA_DIR || dirname(require.resolve('dva/package.json')),
  );
  // eslint-disable-next-line import/no-dynamic-require
  const dvaVersion = require(join(dvaDir, 'package.json')).version;

  function getDvaJS() {
    const dvaJS = findJS(paths.absSrcPath, 'dva');
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
      for (const exclude of excludes) {
        if (typeof exclude === 'function' && exclude(getModelName(model))) {
          return false;
        }
        if (exclude instanceof RegExp && exclude.test(getModelName(model))) {
          return false;
        }
      }
      return true;
    });
  }

  function getGlobalModelContent() {
    return exclude(getGlobalModels(api, shouldImportDynamic), optsToArray(opts.exclude))
      .map(path =>
        `
    app.model({ 
      namespace: '${basename(path, extname(path))}', 
      ...(getModel(require('${path}').default) || require('${path}').default)
    });
  `.trim(),
      )
      .join('\r\n');
  }

  function getPluginContent() {
    const pluginPaths = globby.sync('plugins/**/*.{js,ts}', {
      cwd: paths.absSrcPath,
    });
    const ret = pluginPaths.map(path =>
      `
app.use(require('../../${path}').default);
  `.trim(),
    );
    if (opts.immer) {
      ret.push(
        `
app.use(require('${winPath(require.resolve('dva-immer'))}')());
      `.trim(),
      );
    }
    return ret.join('\r\n');
  }

  function getGlobalActionContent() {
    const { imports, actions } = exclude(
      getGlobalModels(api, false),
      optsToArray(opts.exclude),
    ).reduce(
      (target, path) => {
        const namespace = basename(path, extname(path));
        target.imports.push(
          `import ${namespace} from '${path.substring(0, path.lastIndexOf(extname(path)))}';`,
        );
        target.actions.push(isDev ? `\t${namespace}: new ${namespace}(),` : `\t\t${namespace}: {},`);
        return target;
      },
      { imports: [], actions: [] },
    );
    return [imports.join('\n'), actions.join('\t\n')];
  }

  function getGlobalStoreStateType() {
    if (!isDev) return ['', ''];
    const { imports, state } = exclude(
      getGlobalModels(api, false),
      optsToArray(opts.exclude),
    ).reduce(
      (target, path) => {
        const namespace = basename(path, extname(path));
        const prefixName = namespace.charAt(0).toUpperCase() + namespace.slice(1);
        const stateTypeName = `${prefixName}State`;
        target.imports.push(
          `import { ${stateTypeName} } from '${path.substring(
            0,
            path.lastIndexOf(extname(path)),
          )}';`,
        );
        target.state.push(`\t${namespace}: ${stateTypeName},`);
        return target;
      },
      { imports: [], state: [] },
    );
    return [imports.join('\n'), state.join('\t\n')];
  }

  function generateInitDva() {
    const tpl = join(__dirname, '../template/dva.js.tpl');
    let tplContent = readFileSync(tpl, 'utf-8');
    const dvaJS = getDvaJS();
    if (dvaJS) {
      tplContent = tplContent.replace(
        '<%= ExtendDvaConfig %>',
        `
...((require('${dvaJS}').config || (() => ({})))()),
        `.trim(),
      );
    }
    tplContent = tplContent
      .replace('<%= ExtendDvaConfig %>', '')
      .replace('<%= EnhanceApp %>', '')
      .replace('<%= RegisterPlugins %>', getPluginContent())
      .replace('<%= RegisterModels %>', getGlobalModelContent());
    api.writeTmpFile('dva.js', tplContent);
  }

  function generateInitAction() {
    const tpl = join(
      __dirname,
      '../template',
      isDev ? 'actions.ts.dev.tpl' : 'actions.ts.prod.tpl',
    );
    let tplContent = readFileSync(tpl, 'utf-8');
    const [importContent, actionContent] = getGlobalActionContent();
    tplContent = tplContent
      .replace('<%= ImportActions %>', importContent)
      .replace('<%= RegisterActions %>', actionContent);
    api.writeTmpFile('actions.ts', tplContent);
  }

  function generateInitStoreStateType() {
    const tpl = join(__dirname, '../template/StoreState.ts.tpl');
    let tplContent = readFileSync(tpl, 'utf-8');
    const [importState, stateContent] = getGlobalStoreStateType();
    tplContent = tplContent
      .replace('<%= ImportState %>', importState)
      .replace('<%= StateContent %>', stateContent);
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

  handleDvaDependencyImport(api, { dvaVersion, shouldImportDynamic });

  if (shouldImportDynamic) {
    api.modifyRouteComponent((memo, args) => {
      const { importPath, webpackChunkName } = args;
      if (!webpackChunkName) {
        return memo;
      }

      let loadingOpts = '';
      if (opts.dynamicImport.loadingComponent) {
        loadingOpts = `LoadingComponent: require('${winPath(
          join(paths.absSrcPath, opts.dynamicImport.loadingComponent),
        )}').default,`;
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
      const models = getPageModels(join(paths.absTmpDirPath, importPath), api);
      if (models && models.length) {
        ret = ret.replace(
          '<%= MODELS %>',
          `
app: require('@tmp/dva').getApp(),
models: () => [
  ${models
    .map(
      model =>
        `import(${
          opts.dynamicImport.webpackChunkName
            ? `/* webpackChunkName: '${chunkName(paths.cwd, model)}' */`
            : ''
        }'${model}').then(m => { const { getModel } = require('dva-model-enhance'); return { namespace: '${basename(
          model,
          extname(model),
        )}',...(getModel(m.default) || m.default)}})`,
    )
    .join(',\r\n  ')}
],
      `.trim(),
        );
      }
      return ret.replace('<%= MODELS %>', '');
    });
  }

  api.addVersionInfo([
    `dva@${dvaVersion} (${dvaDir})`,
    `dva-loading@${require('dva-loading/package').version}`,
    `dva-immer@${require('dva-immer/package').version}`,
    `path-to-regexp@${require('path-to-regexp/package').version}`,
  ]);

  api.modifyAFWebpackOpts(memo => {
    const alias = {
      ...memo.alias,
      dva: dvaDir,
      'dva-loading': require.resolve('dva-loading'),
      'path-to-regexp': require.resolve('path-to-regexp'),
      'object-assign': require.resolve('object-assign'),
      ...(opts.immer
        ? {
            immer: require.resolve('immer'),
          }
        : {}),
    };
    const extraBabelPlugins = [
      ...(memo.extraBabelPlugins || []),
      ...(isDev && opts.hmr ? [require.resolve('babel-plugin-dva-hmr')] : []),
    ];
    return {
      ...memo,
      alias,
      extraBabelPlugins,
    };
  });

  api.addPageWatcher([
    join(paths.absSrcPath, 'models'),
    join(paths.absSrcPath, 'plugins'),
    join(paths.absSrcPath, 'model.js'),
    join(paths.absSrcPath, 'model.jsx'),
    join(paths.absSrcPath, 'model.ts'),
    join(paths.absSrcPath, 'model.tsx'),
    join(paths.absSrcPath, 'dva.js'),
    join(paths.absSrcPath, 'dva.jsx'),
    join(paths.absSrcPath, 'dva.ts'),
    join(paths.absSrcPath, 'dva.tsx'),
  ]);

  api.registerGenerator('dva:model', {
    Generator: require('./model').default(api),
    resolved: join(__dirname, './model'),
  });

  api.addRuntimePlugin(join(__dirname, './runtime'));
  api.addRuntimePluginKey('dva');

  api.addEntryCodeAhead(
    `
const app = require('@tmp/dva')._onCreate();
${api.config.disableGlobalVariables ? '' : `window.g_app = app;`}
${api.config.ssr ? `app.router(() => <div />);\napp.start();` : ''}
  `.trim(),
  );
}
