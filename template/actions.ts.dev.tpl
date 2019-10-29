import { modelsContainer } from 'dva-model-enhance';
<%= ImportActions %>

const actions = {
<%= RegisterActions %>
};

modelsContainer.put(actions);

export default actions;
