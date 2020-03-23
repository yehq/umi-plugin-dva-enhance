import { modelsContainer } from 'dva-model-enhance';
import Test from "/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/example/pages/models/test";

const actions = {
	test: new Test(),
};

modelsContainer.put(actions);

export default actions;