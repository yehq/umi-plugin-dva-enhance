export interface Options {
    // class model 中对外导出的 state 名称, 生成的 StoreState.ts 中需要引用
    renderStateName?: (namespace: string, path: string) => string;
    // 是否跳过 class model 验证, 跳过后生成的文件 namespace 默认取 文件名称, 默认值 false;
    skipClassModelValidate?: boolean;
}
