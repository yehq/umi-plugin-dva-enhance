
import { getDvaApp } from 'umi';
import { getModels } from 'dva-model-enhance';

export { default as actions } from './actions';
export { default as StoreState } from './StoreState';

const dvaApp = getDvaApp();

dvaApp.model({ namespace: test, ...(getModel(require('/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/src/fixtures/normal/models/test').default)) });