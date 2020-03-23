import { effect, reducer, BaseModel } from "dva-model-enhance";

interface GlobalState {}
interface Test2LocalState {
    count: number;
}
export interface Test2State extends Test2LocalState {}

class Test2 extends BaseModel<Test2State, GlobalState> {
    @effect()
    *initCount() {
        const result = yield this.effects.call(() => Promise.resolve(100));
        yield this.effects.put(
            this.setState({
                count: result
            })
        );
    }

    @reducer
    addCount() {
        return {
            ...this.state,
            count: this.state.count + 1
        };
    }
}
export default Test2;
