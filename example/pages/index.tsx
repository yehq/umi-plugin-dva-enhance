import React, { useEffect } from "react";
import { useSelector, actions, StoreState } from "umi";
import { useDispatch } from "dva-model-enhance";

export default () => {
    const dispatch = useDispatch(actions);
    const state = useSelector((state: StoreState) => state);

    useEffect(() => {
        console.log(state.test, "state");
    }, []);
    return (
        <div>
            {state.test.count}
            <button
                onClick={() => {
                    dispatch.test.addCount();
                }}
            >
                click
            </button>
        </div>
    );
};
