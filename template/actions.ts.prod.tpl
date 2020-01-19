import { modelsContainer } from 'dva-model-enhance';
<%= ImportActions %>

const globalActions = {
<%= RegisterGlobalActions %>
};

modelsContainer.put(globalActions);

const actions = new Proxy(
    {
<%= RegisterActions %>
    },
    {
        get(t: object, p: string | number | symbol) {
            return new Proxy(
                {},
                {
                    get(target: {}, property: string | number | symbol) {
                        return (...args: any[]) => ({
                            type: `${p.toString()}/${property.toString()}`,
                            payload: args,
                        });
                    },
                },
            );
        },
    },
);

export default actions;
