import { utils } from "umi";
import { join, basename, extname } from "path";
import { readFileSync } from "fs";
import getNamespace from "./getNamespace";

interface ClassModels {
    [namespace: string]: string;
}
export default function getClassModels(opts: {
    base: string;
    pattern?: string;
    extraModels?: string[];
    skipClassModelValidate: boolean;
}): ClassModels {
    return utils.lodash
        .uniq(
            utils.glob
                .sync(opts.pattern || "**/*.{ts,tsx,js,jsx}", {
                    cwd: opts.base
                })
                .map(f => join(opts.base, f))
                .concat(opts.extraModels || [])
                .map(utils.winPath)
        )
        .reduce<ClassModels>((target, path) => {
            if (/\.d.ts$/.test(path)) return target;
            if (/\.(test|e2e|spec).(j|t)sx?$/.test(path)) return target;

            const namespace = opts.skipClassModelValidate
                ? basename(path, extname(path))
                : getNamespace({
                      content: readFileSync(path, { encoding: "utf-8" })
                  });
            if (!namespace) return target;
            target[namespace] = path;
            return target;
        }, {});
}
