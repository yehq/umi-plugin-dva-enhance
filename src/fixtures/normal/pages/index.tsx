import React from "react";
import styles from "./index.less";
import { connect } from "dva";

export default connect(state => ({
    test: state.test
}))(props => {
    return (
        <div>
            <h1 className={styles.title}>Page index {props.test.count}</h1>
        </div>
    );
});
