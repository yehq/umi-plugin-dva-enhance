# umi-plugin-dva-enhance

搭配 [dva-model-enhance](https://github.com/yehq/dva-model-enhance) 使用自动生成 dva-model-enhance 需要的相关 State 类型和 actions;

## 使用方式

```ts
// .umirc.js
plugins: [
  [
    'umi-plugin-react',
    {
      antd: true,
      dva: false,
      dynamicImport: true,
      title: 'bos-backstage',
      dll: false,
      routes: {
        exclude: [
          /models\//,
          /services\//,
          /model\.(t|j)sx?$/,
          /service\.(t|j)sx?$/,
          /components\//,
        ],
      },
    },
  ],
  [
    'umi-plugin-dva-enhance', // 属性和 umi-plugin-dva 一模一样
    {
      immer: true,
      dynamicImport: true,
    },
  ],
];
```

支持 umi dynamicImport

---

Suggest to use together with umi-plugin-react, see our website [umi-plugin-react](https://umijs.org/plugin/umi-plugin-react.html) for more.
