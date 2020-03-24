# umi-plugin-dva-enhance

[![NPM version](https://img.shields.io/npm/v/umi-plugin-dva-enhance.svg?style=flat)](https://npmjs.org/package/umi-plugin-dva-enhance)

> 当前 2.0 版本 需要 umi 3.0 以上

搭配 [dva-model-enhance](https://github.com/yehq/dva-model-enhance) 使用, 自动 实例化 class model 和收集 State。 通过 解析成 AST 获取 准确的 namespace  
添加插件后，在运行后的 ./src/.umi/plugin-dva-enhance 文件夹中会多生成 actions.ts 和 StoreState.ts 文件，它们会随着 全局 和 pages 下的 models 文件里面的 model 文件改变而改变。

-   actions.ts 自动加载所有的 class model 并实例化添加到 modelsContainer 中
-   StoreState.ts 自动加载所有的 class model 中对外导出的 State 类型。默认导出的类型名称为 文件名加 State 后缀

## Install

```bash
# or yarn
$ npm install umi-plugin-dva-enhance
```

```bash
$ npm run build --watch
$ npm run start // 运行 example
```

## Usage

Configure in `.umirc.ts`,

```ts
export default {
    dva: {
        hmr: true,
        // 默认为 false，且必须 设置 false，否则 plugin-dva 会重复加载 model
        skipModelValidate: false
    },
    "dva-enhance": {
        // class model 中对外导出的 state 名称, 生成的 StoreState.ts 中需要引用
        // renderStateName?: (namespace: string, path: string) => string;
        // 是否跳过 class model 验证, 跳过后生成的文件 namespace 默认取 文件名称, 默认值 false;
        // skipClassModelValidate?: boolean;
    },
    // 如果提示 plugin umi-plugin-dva-enhance is already registered, 就不用显示添加插件
    plugins: ["umi-plugin-dva-enhance"]
};
```

### 在 src/models 下任意添加一个 原生的 model, 来强制启用 @umijs/plugin-dva 插件相关功能，举例如下

```ts
/**
 * 添加了一个 dva model, 用于开启 @umijs/plugin-dva 插件
 * 插件内部判断 没有 符合条件的 model 时 不启用 dva 相关功能
 */
export default {
    namespace: "__enableDva",
    state: {}
};
```

### 如下 可以在 umi 中直接导出 actions 和 StoreState

-   actions 是所有 class model 实例
-   StoreState 是所有 class model 文件下 导出的类型集合
-   使用 dva-model-enhance 中的 useDispatch 传入 actions 可以提供 dva 方法的类型提示

```ts
import React, { useEffect } from "react";
import { useSelector, actions, StoreState } from "umi";
import { useDispatch } from "dva-model-enhance";

export default () => {
    const dispatch = useDispatch(actions);
    const state = useSelector((state: StoreState) => state);

    useEffect(() => {
        console.log(state.test, "state");
    }, []);
    return (
        <div>
            {state.test.count}
            <button
                onClick={() => {
                    dispatch.test.addCount();
                }}
            >
                click
            </button>
        </div>
    );
};
```

## LICENSE

MIT
