import { join } from "path";
import { readFileSync } from "fs";
import getNamespace from "./getNamespace";

const fixtures = join(__dirname, "fixtures");

test("getNamespace", () => {
    const content = readFileSync(join(fixtures, "normal/c.ts"), {
        encoding: "utf-8"
    });

    expect(
        getNamespace({
            content
        })
    ).toEqual("test");

    const content2 = readFileSync(join(fixtures, "normal/b.ts"), {
        encoding: "utf-8"
    });

    expect(
        getNamespace({
            content: content2
        })
    ).toEqual("");

    const content3 = readFileSync(join(fixtures, "normal/f.tsx"), {
        encoding: "utf-8"
    });

    expect(
        getNamespace({
            content: content3
        })
    ).toEqual("");

    const content4 = readFileSync(join(fixtures, "normal/a.ts"), {
        encoding: "utf-8"
    });

    expect(
        getNamespace({
            content: content4
        })
    ).toEqual("");
});
