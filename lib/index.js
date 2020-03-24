"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _umi = require("umi");

var _fs = require("fs");

var _path = require("path");

var _getClassModels = _interopRequireDefault(require("./getClassModes/getClassModels"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Mustache = _umi.utils.Mustache;

function _default(api) {
  api.describe({
    key: "dva-enhance",
    config: {
      schema: function schema(joi) {
        return joi.object({
          renderStateName: joi.func(),
          skipClassModelValidate: joi.bool()
        });
      }
    }
  });
  var options = api.userConfig["dva-enhance"] || {};

  function getModelDir() {
    return api.config.singular ? "model" : "models";
  }

  function getSrcModelsPath() {
    return (0, _path.join)(api.paths.absSrcPath, getModelDir());
  }

  function getTargetModels() {
    var srcModelsPath = getSrcModelsPath();
    var baseOptions = {
      skipClassModelValidate: options.skipClassModelValidate || false
    };
    return _objectSpread({}, (0, _getClassModels.default)(_objectSpread({
      base: srcModelsPath
    }, baseOptions)), {}, (0, _getClassModels.default)(_objectSpread({
      base: api.paths.absPagesPath,
      pattern: "**/".concat(getModelDir(), "/**/*.{ts,tsx,js,jsx}")
    }, baseOptions)), {}, (0, _getClassModels.default)(_objectSpread({
      base: api.paths.absPagesPath,
      pattern: "**/model.{ts,tsx,js,jsx}"
    }, baseOptions)));
  }
  /**
   * 统一遍历 models 生成 模板搜需要的内容
   * @param models
   * @param tmpProps
   */


  function getTmpContent(models, tmpProps) {
    var namespaces = Object.keys(models);
    var result = Object.keys(tmpProps).reduce(function (target, key) {
      target[key] = [];
      return target;
    }, {});

    var func = function func(namespace, path, index) {
      var noExtnamePath = path.substring(0, path.lastIndexOf((0, _path.extname)(path)));
      Object.keys(tmpProps).forEach(function (key) {
        var fn = tmpProps[key];
        result[key][index] = fn({
          namespace: namespace,
          noExtnamePath: noExtnamePath,
          path: path,
          index: index
        });
      });
    };

    namespaces.forEach(function (namespace, index) {
      func(namespace, models[namespace], index);
    });
    return result;
  }

  function fistCharUpper(str) {
    return "".concat(str.charAt(0).toUpperCase()).concat(str.slice(1));
  }

  function getStateName(namespace, path) {
    if (options.renderStateName) {
      return options.renderStateName(namespace, path);
    }

    return "".concat(fistCharUpper(namespace), "State");
  }

  api.onGenerateFiles({
    fn: function fn() {
      var models = getTargetModels();
      var tmpProps = getTmpContent(models, {
        actionsImportActions: function actionsImportActions(_ref) {
          var namespace = _ref.namespace,
              noExtnamePath = _ref.noExtnamePath;
          return "import ".concat(fistCharUpper(namespace), " from \"").concat(noExtnamePath, "\";");
        },
        actionRegisterGlobalActions: function actionRegisterGlobalActions(_ref2) {
          var namespace = _ref2.namespace;
          return "\t".concat(namespace, ": new ").concat(fistCharUpper(namespace), "(),");
        },
        storeStateImportState: function storeStateImportState(_ref3) {
          var namespace = _ref3.namespace,
              noExtnamePath = _ref3.noExtnamePath,
              path = _ref3.path;
          var stateName = getStateName(namespace, path);
          return "import { ".concat(stateName, " } from \"").concat(noExtnamePath, "\";");
        },
        storeStateContent: function storeStateContent(_ref4) {
          var namespace = _ref4.namespace,
              path = _ref4.path;
          var stateName = getStateName(namespace, path);
          return "\t".concat(namespace, ": ").concat(stateName, ",");
        },
        runntimeRegisterClassModels: function runntimeRegisterClassModels(_ref5) {
          var namespace = _ref5.namespace,
              noExtnamePath = _ref5.noExtnamePath;
          return "\t\t\tdvaApp.model({ namespace: \"".concat(namespace, "\", ...getModel(require(\"").concat(noExtnamePath, "\").default) });");
        }
      }); // action.ts

      var actionTpl = (0, _fs.readFileSync)((0, _path.join)(__dirname, "./templates/actions.ts.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/actions.ts",
        content: Mustache.render(actionTpl, {
          ImportActions: tmpProps.actionsImportActions.join("\n"),
          RegisterGlobalActions: tmpProps.actionRegisterGlobalActions.join("\n")
        })
      }); // StoreState.ts

      var storeStateTpl = (0, _fs.readFileSync)((0, _path.join)(__dirname, "./templates/StoreState.ts.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/StoreState.ts",
        content: Mustache.render(storeStateTpl, {
          ImportState: tmpProps.storeStateImportState.join("\n"),
          StateContent: tmpProps.storeStateContent.join("\n")
        })
      }); // exports.ts

      var exportsTpl = (0, _fs.readFileSync)((0, _path.join)(__dirname, "./templates/exports.ts.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/exports.ts",
        content: Mustache.render(exportsTpl, {})
      }); // exports.ts

      var runtimeTpl = (0, _fs.readFileSync)((0, _path.join)(__dirname, "./templates/runtime.tsx.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-dva-enhance/runtime.tsx",
        content: Mustache.render(runtimeTpl, {
          RegisterClassModels: tmpProps.runntimeRegisterClassModels.join("\n")
        })
      });
    }
  }); // Runtime Plugin

  api.addRuntimePlugin({
    fn: function fn() {
      return [(0, _path.join)(api.paths.absTmpPath, "plugin-dva-enhance/runtime.tsx")];
    },
    stage: -1
  });
  api.addRuntimePluginKey(function () {
    return ["dva-enhance"];
  }); // 导出内容

  api.addUmiExports(function () {
    return [{
      exportAll: true,
      source: "../plugin-dva-enhance/exports"
    }];
  });
}