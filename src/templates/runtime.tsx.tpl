import React from 'react';
import { getModel } from 'dva-model-enhance';
import { getDvaApp } from '../core/umiExports';
{{{ImportActions}}}

class Container extends React.Component {
    constructor(props: any) {
        super(props);
        if (getDvaApp) {
            const dvaApp = getDvaApp();
{{{ RegisterClassModels }}}
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
