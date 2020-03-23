import { modelsContainer } from 'dva-model-enhance';
import Test from "/Users/yehangqi/Documents/work/web/umi-plugin-dva-enhance/src/fixtures/normal/models/test";

const actions = {
	test: new Test(),
};

modelsContainer.put(actions);

export default actions;