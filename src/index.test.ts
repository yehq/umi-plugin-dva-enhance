import { join } from "path";
import { Service } from "umi";

const fixtures = join(__dirname, "fixtures");

test("normal", async () => {
    const cwd = join(fixtures, "normal");
    const service = new Service({
        cwd
    });
    await service.run({
        name: "g",
        args: {
            _: ["g", "tmp"]
        }
    });
});
