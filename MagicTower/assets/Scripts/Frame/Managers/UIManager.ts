import { director, instantiate, js, NodePool, Prefab, resources, UITransform, Vec3, view } from "cc";
import { BasePoolNode } from "../Base/BasePoolNode";
import { ColorToast, ToastType } from "../Components/ColorToast";

enum UIPrefabPath {
    TOAST_PATH = "Prefabs/Base/ColorToast",
    DIALOGS_PATH = "Prefabs/Dialogs",
}

/** UI管理器 */
export class UIManager {
    /** 弹窗起始优先级 */
    private DIALOG_PRIORITY: number = 255;
    /** toast优先级 */
    private TOAST_PRIORITY: number = 512;
    /** toast对象池 */
    private toastPool: NodePool = new NodePool("ColorToast");
    private toastY: number = 0;
    /** 弹窗缓存，避免重复打开弹窗 */
    private dialogCache: any = {};
    /** 弹窗名字对应的路径 */
    private dialogPath: any = {};

    init() {
        this.toastY = view.getFrameSize().height * 0.75;
        let dirInfo = resources.getDirWithPath(UIPrefabPath.DIALOGS_PATH, Prefab);
        dirInfo.forEach((info) => {
            let name = info.path.substring(info.path.lastIndexOf("/") + 1);
            this.dialogPath[name] = info.path;
        });
        return this;
    }

    private getCanvas(): any {
        return director.getScene().getChildByName("Canvas");
    }

    private createToast(prefab: Prefab) {
        let toast = BasePoolNode.generateNodeFromPool(this.toastPool, prefab);
        toast.position = new Vec3(0, this.toastY, 0);
        toast.parent = this.getCanvas();
        toast.getComponent(UITransform).priority = this.TOAST_PRIORITY;
        return toast;
    }

    private createDialog(prefab: Prefab) {
        let dialog = instantiate(prefab);
        dialog.position = Vec3.ZERO;
        dialog.parent = this.getCanvas();
        dialog.getComponent(UITransform).priority = this.DIALOG_PRIORITY;
        return dialog;
    }

    private loadPrefab(path: string): Promise<Prefab> {
        return new Promise((resolve) => {
            resources.load(path, Prefab, (err, prefab: Prefab) => {
                if (err) {
                    console.error(err);
                    resolve(null);
                }
                resolve(prefab);
            });
        });
    }

    /**
     * 飘字
     * @param content 飘字内容
     * @param toastType normal普通飘字，color富文本飘字
     */
    async showToast(content: string = "", toastType: ToastType = ToastType.NORAML) {
        if (!content || content == "") {
            return;
        }

        let prefab = resources.get<Prefab>(UIPrefabPath.TOAST_PATH);
        if (!prefab) {
            prefab = await this.loadPrefab(UIPrefabPath.TOAST_PATH);
            if (!prefab) {
                return;
            }
        }
        let toast = this.createToast(prefab);
        toast.getComponent(ColorToast).init(content, toastType);
    }

    /**
     * 显示弹窗
     * @param dialogName 弹窗名字
     * @param args 弹窗初始化数据
     * @returns 返回Promise弹窗节点
     */
    async showDialog(dialogName: string, ...args: any[]): Promise<Node> {
        if (this.dialogCache[dialogName]) {
            console.error(`${dialogName}弹窗正在打开`);
            return null;
        }
        let dialogNode = this.getCanvas().getChildByName(dialogName);

        if (dialogNode && dialogNode.active) return null;

        if (!dialogNode) {
            let dialogPath = this.dialogPath[dialogName];
            if (!dialogPath) {
                console.error(`找不到${dialogName}预设`);
                return null;
            }
            let dialogPrefab = resources.get<Prefab>(dialogPath);
            if (!dialogPrefab) {
                this.dialogCache[dialogName] = true;
                dialogPrefab = await this.loadPrefab(dialogPath);
                this.dialogCache[dialogName] = false;
                if (!dialogPrefab) {
                    return null;
                }
            }
            dialogNode = this.createDialog(dialogPrefab);
        }
        dialogNode.active = true;
        let control = dialogNode.getComponent(js.getClassByName(dialogName));
        control && control.init && control.init(...args);
        return dialogNode;
    }
}
