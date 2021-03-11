import { Component, EventTouch, Node, UITransform, view, _decorator } from "cc";
import { ActionComponent, DialogAction } from "../Components/ActionComponent";

const { ccclass, property } = _decorator;

@ccclass("BaseDialog")
export default class BaseDialog extends Component {
    @property({
        type: Node,
        tooltip: "背景区域，用于做点击关闭，及事件屏蔽",
    })
    private touchNode: UITransform;

    @property({
        type: Node,
        tooltip: "弹窗中心内容，适用于做弹窗动作，默认选择弹窗node",
    })
    private dialogContent: Node;

    /** 点击弹窗空白关闭 */
    @property({
        tooltip: "点击弹窗空白关闭",
    })
    protected clickBgClose: boolean = true;

    /** 关闭弹窗是否摧毁 */
    @property({
        tooltip: "关闭弹窗是否摧毁",
    })
    protected closeWithDestroy: boolean = true;

    /** 使用弹窗动作 */
    @property({
        tooltip: "是否使用弹窗动作，默认无动作，数值可从BaseConstant查看",
    })
    protected actionType: DialogAction = DialogAction.NoneAction;

    /** 处理单点或者多点触摸，保证id唯一 */
    private touchId: number = null;

    /** 加载背景按钮等初始化 */
    onLoad() {
        if (this.touchNode) {
            this.touchNode.contentSize = view.getFrameSize();

            this.touchNode.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.touchNode.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.touchNode.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.touchNode.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
        this.dialogContent = this.dialogContent || this.node;
        this.addActionComponent();
    }

    private onTouchStart(event: EventTouch) {
        event.propagationStopped = true;
        if (this.touchId != null && this.touchId != event.getID()) {
            return;
        }

        this.touchId = event.getID(); //处理多点触摸
    }

    private onTouchMove(event: EventTouch) {
        event.propagationStopped = true;
    }

    private onTouchEnd(event: EventTouch) {
        if (event.getID() == this.touchId) {
            this.touchId = null;
            if (this.clickBgClose) {
                this.close();
            }
        }
        event.propagationStopped = true;
    }

    private addActionComponent() {
        let actionComponent: any = ActionComponent.getActionComponent(this.actionType);
        if (!this.getComponent(actionComponent)) {
            let component: ActionComponent = this.addComponent(actionComponent);
            if (component) {
                component.endActionCallback = this.closeCallback;
                component.dialogContentNode = this.dialogContent;
            }
        }
    }

    private closeCallback() {
        this.unscheduleAllCallbacks();
        if (this.closeWithDestroy) {
            this.node.destroy();
        } else {
            this.node.active = false;
        }
    }

    /** 关闭弹窗 */
    protected close() {
        let actionComponent: any = ActionComponent.getActionComponent(this.actionType);
        this.getComponent<ActionComponent>(actionComponent).executeEndAction();
    }
}
