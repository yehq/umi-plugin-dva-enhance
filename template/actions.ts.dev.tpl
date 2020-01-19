import { modelsContainer } from 'dva-model-enhance';
<%= ImportActions %>

const actions = {
<%= RegisterGlobalActions %>
};

modelsContainer.put(actions);

export default actions;
