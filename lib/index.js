"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

function _umi() {
  const data = require("umi");

  _umi = function _umi() {
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

var _getClassModels = _interopRequireDefault(require("./getClassModes/getClassModels"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const Mustache = _umi().utils.Mustache;

function _default(api) {
  api.describe({
    key: "dva-enhance",
    config: {
      schema(joi) {
        return joi.object({
          renderStateName: joi.func(),
          skipClassModelValidate: joi.bool()
        });
      }

    }
  });
  const options = api.userConfig["dva-enhance"] || {};

  function getModelDir() {
    return api.config.singular ? "model" : "models";
  }

  function getSrcModelsPath() {
    return (0, _path().join)(api.paths.absSrcPath, getModelDir());
  }

  function getTargetModels() {
    const srcModelsPath = getSrcModelsPath();
    const baseOptions = {
      skipClassModelValidate: options.skipClassModelValidate || false
    };
    return _objectSpread(_objectSpread(_objectSpread({}, (0, _getClassModels.default)(_objectSpread({
      base: srcModelsPath
    }, baseOptions))), (0, _getClassModels.default)(_objectSpread({
      base: api.paths.absPagesPath,
      pattern: `**/${getModelDir()}/**/*.{ts,tsx,js,jsx}`
    }, baseOptions))), (0, _getClassModels.default)(_objectSpread({
      base: api.paths.absPagesPath,
      pattern: `**/model.{ts,tsx,js,jsx}`
    }, baseOptions)));
  }
  /**
   * 统一遍历 models 生成 模板搜需要的内容
   * @param models
   * @param tmpProps
   */


  function getTmpContent(models, tmpProps) {
    const namespaces = Object.keys(models);
    const result = Object.keys(tmpProps).reduce((target, key) => {
      target[key] = [];
      return target;
    }, {});

    const func = (namespace, path, index) => {
      const noExtnamePath = path.substring(0, path.lastIndexOf((0, _path().extname)(path)));
      Object.keys(tmpProps).forEach(key => {
        const fn = tmpProps[key];
        result[key][index] = fn({
          namespace,
          noExtnamePath,
          path,
          index
        });
      });
    };

    namespaces.forEach((namespace, index) => {
      func(namespace, models[namespace], index);
    });
    return result;
  }

  function fistCharUpper(str) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }

  function getStateName(namespace, path) {
    if (options.renderStateName) {
      return options.renderStateName(namespace, path);
    }

    return `${fistCharUpper(namespace)}State`;
  }

  api.onGenerateFiles({
    fn() {
      const models = getTargetModels();
      const tmpProps = getTmpContent(models, {
        actionsImportActions: ({
          namespace,
          noExtnamePath
        }) => {
          return `import ${fistCharUpper(namespace)} from "${noExtnamePath}";`;
        },
        actionRegisterGlobalActions: ({
          namespace
        }) => {
          return `\t${namespace}: new ${fistCharUpper(namespace)}(),`;
        },
        storeStateImportState: ({
          namespace,
          noExtnamePath,
          path
        }) => {
          const stateName = getStateName(namespace, path);
          return `import { ${stateName} } from "${noExtnamePath}";`;
        },
        storeStateContent: ({
          namespace,
          path
        }) => {
          const stateName = getStateName(namespace, path);
          return `\t${namespace}: ${stateName},`;
        },
        runntimeRegisterClassModels: ({
          namespace,
          noExtnamePath
        }) => {
          return `\t\t\tdvaApp.model({ namespace: "${namespace}", ...getModel(${fistCharUpper(namespace)}) });`;
        }
      }); // action.ts

      const actionTpl = (0, _fs().readFileSync)((0, _path().join)(__dirname, "./templates/actions.ts.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/actions.ts",
        content: Mustache.render(actionTpl, {
          ImportActions: tmpProps.actionsImportActions.join("\n"),
          RegisterGlobalActions: tmpProps.actionRegisterGlobalActions.join("\n")
        })
      }); // StoreState.ts

      const storeStateTpl = (0, _fs().readFileSync)((0, _path().join)(__dirname, "./templates/StoreState.ts.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/StoreState.ts",
        content: Mustache.render(storeStateTpl, {
          ImportState: tmpProps.storeStateImportState.join("\n"),
          StateContent: tmpProps.storeStateContent.join("\n")
        })
      }); // exports.ts

      const exportsTpl = (0, _fs().readFileSync)((0, _path().join)(__dirname, "./templates/exports.ts.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/exports.ts",
        content: Mustache.render(exportsTpl, {})
      }); // exports.ts

      const runtimeTpl = (0, _fs().readFileSync)((0, _path().join)(__dirname, "./templates/runtime.tsx.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/runtime.tsx",
        content: Mustache.render(runtimeTpl, {
          ImportActions: tmpProps.actionsImportActions.join("\n"),
          RegisterClassModels: tmpProps.runntimeRegisterClassModels.join("\n")
        })
      });
    }

  }); // Runtime Plugin

  api.addRuntimePlugin({
    fn: () => [(0, _path().join)(api.paths.absTmpPath, "plugin-dva-enhance/runtime.tsx")],
    stage: -1
  });
  api.addRuntimePluginKey(() => ["dva-enhance"]); // 导出内容

  api.addUmiExports(() => [{
    exportAll: true,
    source: "../plugin-dva-enhance/exports"
  }]);
}