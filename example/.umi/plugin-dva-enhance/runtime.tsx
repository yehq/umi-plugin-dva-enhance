import React from 'react';
import { getModel } from 'dva-model-enhance';
import { getDvaApp } from '../core/umiExports';

class Container extends React.Component {
    constructor(props: any) {
        super(props);
        if (getDvaApp) {
            const dvaApp = getDvaApp();
			dvaApp.model({ namespace: "test", ...getModel(require("/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/example/pages/models/test").default) });
        } else {
            console.error('请先加载 @umijs/plugin-dva 插件');
        }
    }

    render() {
        return this.props.children || null;
    }
}

export function rootContainer(container) {
    return React.createElement(Container, null, container);
}
