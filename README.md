# umi-plugin-dva-enhance

> 当前 2.0 版本 需要 umi 3.0 以上

添加插件后，在运行后的 ./src/.umi 文件夹中会多生成 actions.ts 和 StoreState.ts 文件，它们会随着 全局 和 pages 下的 models 文件里面的 model 文件改变而改变。

-   actions.ts 自动加载所有的 class model 并实例化添加到 modelsContainer 中
-   StoreState.ts 自动加载所有的 class model 中对外导出的 State 类型。默认导出的类型名称为 文件名加 State 后缀

[![NPM version](https://img.shields.io/npm/v/umi-plugin-dva-enhance.svg?style=flat)](https://npmjs.org/package/umi-plugin-dva-enhance)
[![NPM downloads](http://img.shields.io/npm/dm/umi-plugin-dva-enhance.svg?style=flat)](https://npmjs.org/package/umi-plugin-dva-enhance)

## Install

```bash
# or yarn
$ npm install umi-plugin-dva-enhance
```

```bash
$ npm run build --watch
$ npm run start
```

## Usage

Configure in `.umirc.ts`,

```ts
export default {
    "dva-enhance": {
        // class model 中对外导出的 state 名称, 生成的 StoreState.ts 中需要引用
        // renderStateName?: (namespace: string, path: string) => string;
        // 是否跳过 class model 验证, 跳过后生成的文件 namespace 默认取 文件名称, 默认值 false;
        // skipClassModelValidate?: boolean;
    },
    plugins: ["umi-plugin-dva-enhance"]
};
```

在 tsconfig.json 配置 如下后

```
"@@/*": ["src/.umi/*"]
```

可以 通过 访问 自动生成的 actions 和 状态

```ts
import actions from "@@/plugin-dva-enhance/actions";
import StoreState from "@@/plugin-dva-enhance/StoreState";
```

## LICENSE

MIT
