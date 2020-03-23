import { utils } from "umi";

const { traverse } = utils;

export default function getNamespace({ content }: { content: string }): string {
    const { parser } = utils;
    const ast = parser.parse(content, {
        sourceType: "module",
        plugins: [
            "typescript",
            "classProperties",
            "dynamicImport",
            "exportDefaultFrom",
            "exportNamespaceFrom",
            "functionBind",
            "nullishCoalescingOperator",
            "objectRestSpread",
            "optionalChaining",
            "decorators-legacy"
        ]
    });

    let namespace: string = "";

    traverse.default(ast as any, {
        ClassDeclaration(path) {
            if (path.node.decorators && path.node.decorators.length > 0) {
                path.node.decorators.some(decorator => {
                    const properties =
                        decorator.expression &&
                        decorator.expression.arguments.length === 1
                            ? decorator.expression.arguments[0].properties
                            : [];

                    const property = properties.find(
                        property => property.key.name === "namespace"
                    );
                    if (property) {
                        namespace = property.value.value;
                        return !!namespace;
                    }
                    return false;
                });
            }
        }
    });

    return namespace;
}
