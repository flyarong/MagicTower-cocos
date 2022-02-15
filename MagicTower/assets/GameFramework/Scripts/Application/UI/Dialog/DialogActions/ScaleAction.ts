import { Node, tween, Tween, Vec3 } from "cc";
import { DialogActionBase } from "../DialogActionBase";

export class ScaleAction extends DialogActionBase {
    protected getStartAction(node: Node): Tween<Node> | null {
        return tween(node)
            .set({ scale: new Vec3(0.1, 0.1, 0.1) })
            .to(0.3, { scale: new Vec3(1, 1, 1) });
    }

    protected getEndAction(node: Node): Tween<Node> | null {
        return tween(node)
            .stop()
            .to(0.3, { scale: new Vec3(0, 0, 0) });
    }
}
