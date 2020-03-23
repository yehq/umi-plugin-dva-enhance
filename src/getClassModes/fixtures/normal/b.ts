import { effect, reducer, dvaModel, BaseModel } from "dva-model-enhance";

interface GlobalState {}
interface TestLocalState {
    count: number;
}
export interface TestState extends TestLocalState {}

@dvaModel<TestLocalState>({
    state: {
        count: 0
    }
})
class Test extends BaseModel<TestState, GlobalState> {
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
export default Test;
