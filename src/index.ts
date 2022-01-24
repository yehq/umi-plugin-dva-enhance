// ref:
// - https://umijs.org/plugin/develop.html
import { IApi, utils } from "umi";
import { readFileSync } from "fs";
import { join, extname } from "path";
import getClassModels from "./getClassModes/getClassModels";
import { Options } from "./interfaces";

const { Mustache } = utils;

export default function(api: IApi) {
    api.describe({
        key: "dva-enhance",
        config: {
            schema(joi) {
                return joi.object({
                    renderStateName: joi.func(),
                    skipClassModelValidate: joi.bool()
                });
            }
        }
    });

    const options: Options = api.userConfig["dva-enhance"] || {};

    function getModelDir() {
        return api.config.singular ? "model" : "models";
    }

    function getSrcModelsPath() {
        return join(api.paths.absSrcPath!, getModelDir());
    }

    function getTargetModels() {
        const srcModelsPath = getSrcModelsPath();
        const baseOptions = {
            skipClassModelValidate: options.skipClassModelValidate || false
        };
        return {
            ...getClassModels({
                base: srcModelsPath,
                ...baseOptions
            }),
            ...getClassModels({
                base: api.paths.absPagesPath!,
                pattern: `**/${getModelDir()}/**/*.{ts,tsx,js,jsx}`,
                ...baseOptions
            }),
            ...getClassModels({
                base: api.paths.absPagesPath!,
                pattern: `**/model.{ts,tsx,js,jsx}`,
                ...baseOptions
            })
        };
    }

    /**
     * 统一遍历 models 生成 模板搜需要的内容
     * @param models
     * @param tmpProps
     */
    function getTmpContent<
        T extends {
            [name: string]: (options: {
                namespace: string;
                path: string;
                noExtnamePath: string;
                index: number;
            }) => string;
        }
    >(
        models: { [namespace: string]: string },
        tmpProps: T
    ): { [E in keyof T]: string[] } {
        const namespaces = Object.keys(models);
        const result = Object.keys(tmpProps).reduce<{
            [name: string]: string[];
        }>((target, key) => {
            target[key] = [];
            return target;
        }, {});

        const func = (namespace, path, index) => {
            const noExtnamePath = path.substring(
                0,
                path.lastIndexOf(extname(path))
            );
            Object.keys(tmpProps).forEach(key => {
                const fn = tmpProps[key];
                result[key][index] = fn({
                    namespace,
                    noExtnamePath,
                    path,
                    index
                });
            });
        };

        namespaces.forEach((namespace, index) => {
            func(namespace, models[namespace], index);
        });

        return result as any;
    }

    function fistCharUpper(str: string) {
        return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
    }

    function getStateName(namespace: string, path: string) {
        if (options.renderStateName) {
            return options.renderStateName(namespace, path);
        }
        return `${fistCharUpper(namespace)}State`;
    }

    api.onGenerateFiles({
        fn() {
            const models = getTargetModels();
            const tmpProps = getTmpContent(models, {
                actionsImportActions: ({ namespace, noExtnamePath }) => {
                    return `import ${fistCharUpper(
                        namespace
                    )} from "${noExtnamePath}";`;
                },
                actionRegisterGlobalActions: ({ namespace }) => {
                    return `\t${namespace}: new ${fistCharUpper(namespace)}(),`;
                },
                storeStateImportState: ({ namespace, noExtnamePath, path }) => {
                    const stateName = getStateName(namespace, path);
                    return `import { ${stateName} } from "${noExtnamePath}";`;
                },
                storeStateContent: ({ namespace, path }) => {
                    const stateName = getStateName(namespace, path);
                    return `\t${namespace}: ${stateName},`;
                },
                runntimeRegisterClassModels: ({ namespace, noExtnamePath }) => {
                    return `\t\t\tdvaApp.model({ namespace: "${namespace}", ...getModel(${fistCharUpper(namespace)}) });`;
                }
            });

            // action.ts
            const actionTpl = readFileSync(
                join(__dirname, "./templates/actions.ts.tpl"),
                "utf-8"
            );
            api.writeTmpFile({
                path: "plugin-dva-enhance/actions.ts",
                content: Mustache.render(actionTpl, {
                    ImportActions: tmpProps.actionsImportActions.join("\n"),
                    RegisterGlobalActions: tmpProps.actionRegisterGlobalActions.join(
                        "\n"
                    )
                })
            });

            // StoreState.ts
            const storeStateTpl = readFileSync(
                join(__dirname, "./templates/StoreState.ts.tpl"),
                "utf-8"
            );
            api.writeTmpFile({
                path: "plugin-dva-enhance/StoreState.ts",
                content: Mustache.render(storeStateTpl, {
                    ImportState: tmpProps.storeStateImportState.join("\n"),
                    StateContent: tmpProps.storeStateContent.join("\n")
                })
            });

            // exports.ts
            const exportsTpl = readFileSync(
                join(__dirname, "./templates/exports.ts.tpl"),
                "utf-8"
            );
            api.writeTmpFile({
                path: "plugin-dva-enhance/exports.ts",
                content: Mustache.render(exportsTpl, {})
            });

            // exports.ts
            const runtimeTpl = readFileSync(
                join(__dirname, "./templates/runtime.tsx.tpl"),
                "utf-8"
            );
            api.writeTmpFile({
                path: "plugin-dva-enhance/runtime.tsx",
                content: Mustache.render(runtimeTpl, {
                    ImportActions: tmpProps.actionsImportActions.join("\n"),
                    RegisterClassModels: tmpProps.runntimeRegisterClassModels.join(
                        "\n"
                    )
                })
            });
        }
    });

    // Runtime Plugin
    api.addRuntimePlugin({
        fn: () => [
            join(api.paths.absTmpPath!, "plugin-dva-enhance/runtime.tsx")
        ],
        stage: -1
    });
    api.addRuntimePluginKey(() => ["dva-enhance"]);

    // 导出内容
    api.addUmiExports(() => [
        {
            exportAll: true,
            source: "../plugin-dva-enhance/exports"
        }
    ]);
}
