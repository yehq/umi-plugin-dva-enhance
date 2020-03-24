import { join } from "path";
import { defineConfig } from "umi";

export default defineConfig({
    routes: [{ path: "/", component: "./index" }],
    dva: {
        hmr: true
    },
    "dva-enhance": {
        // 设置自定义的 state 名称
        // renderStateName(namespace) {
        //     return namespace;
        // }
    },
    plugins: [
        join(__dirname, "..", "node_modules", "@umijs", "plugin-dva"),
        join(__dirname, "..", require("../package.json").main || "index.js")
    ]
});
