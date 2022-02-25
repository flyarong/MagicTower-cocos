import { IVec2, Node, tween, v3 } from "cc";
import { CommandManager } from "../../../../GameFramework/Scripts/Application/Command/CommandManager";
import { SystemBase } from "../../../../GameFramework/Scripts/Application/Command/SystemBase";
import { GameApp } from "../../../../GameFramework/Scripts/Application/GameApp";
import { UIFactory } from "../../../../GameFramework/Scripts/Application/UI/UIFactory";
import { GameFrameworkLog } from "../../../../GameFramework/Scripts/Base/Log/GameFrameworkLog";
import { Utility } from "../../../../GameFramework/Scripts/Utility/Utility";
import { HeroModel } from "../../../Model/HeroModel/HeroModel";
import { EventInfo } from "../../../Model/MapModel/Data/Elements/EventInfo";
import { Npc } from "../../../Model/MapModel/Data/Elements/Npc";
import { LevelData } from "../../../Model/MapModel/Data/LevelData";
import { CommonEventArgs } from "../../Event/CommonEventArgs";
import { GameEvent } from "../../Event/GameEvent";
import { SceneAppearEventArgs } from "../../Event/SceneAppearEventArgs";
import { AppearCommand } from "../Command/AppearCommand";
import { CollisionCommand } from "../Command/CollisionCommand";
import { DisappearCommand } from "../Command/DisappearCommand";
import { MoveCommand } from "../Command/MoveCommand";
import { SpecialMoveCommand } from "../Command/SpecialMoveCommand";
import { IGameMap } from "../Map/GameMap/IGameMap";
import { Hero } from "../Map/Hero/Hero";

/** 事件系统 */
@CommandManager.register("GameEventSystem")
export class GameEventSystem extends SystemBase {
    private eventInfo: EventInfo = null!;
    private eventJson: any = null;
    private chatStep: number = 0;
    private appearStep: number = 0;
    private disappearStep: number = 0;
    private moveStep: number = 0;
    private step: number = 0;
    private globalConfig: any = null;
    private gameMap: IGameMap = null!;
    private hero: Hero = null!;
    private levelData: LevelData = null!;
    private eventCompleteFlag: boolean = false;

    initliaze(gameMap: IGameMap, hero: Hero, eventIdOrEventInfo: number | string | EventInfo, levelData: LevelData) {
        this.clear();
        if (typeof eventIdOrEventInfo == "object") {
            this.eventJson = Utility.Json.getJsonElement("event", eventIdOrEventInfo.id);
            this.eventInfo = eventIdOrEventInfo;
        } else {
            this.eventJson = Utility.Json.getJsonElement("event", eventIdOrEventInfo);
        }
        if (this.eventJson.monsterDoor) {
            levelData.addMonsterDoor(this.eventJson.monsterDoor);
        }
        this.globalConfig = Utility.Json.getJson("global");
        this.gameMap = gameMap;
        this.hero = hero;
        this.levelData = levelData;
    }

    getEventCompleteFlag() {
        return this.eventCompleteFlag;
    }

    executeComplete() {
        return this.step >= this.eventJson.step.length;
    }

    clear(): void {
        this.eventInfo = null!;
        this.eventJson = null;
        this.chatStep = 0;
        this.appearStep = 0;
        this.disappearStep = 0;
        this.moveStep = 0;
        this.step = 0;
        this.globalConfig = null;
        this.gameMap = null!;
        this.hero = null!;
        this.levelData = null!;
        this.eventCompleteFlag = false;
    }

    execute() {
        if (this.step < this.eventJson.step.length) {
            let stepName = this.eventJson.step[this.step++];
            GameFrameworkLog.log(stepName);
            switch (stepName) {
                case "chat":
                    this.chat();
                    break;
                case "move":
                    this.move();
                    break;
                case "specialMove":
                    this.specialMove();
                    break;
                case "disappear":
                    this.disappear();
                    break;
                case "do":
                    GameApp.CommandManager.createCommand(CollisionCommand).execute(this.gameMap.getTile(this.eventJson.do));
                    break;
                case "show":
                    let elementInfo = this.levelData.getLayerElementWithoutName(this.eventJson.show);
                    if (elementInfo) {
                        GameApp.CommandManager.createCommand(AppearCommand).execute(elementInfo.layerName, elementInfo.element.index, elementInfo.element.id);
                    }
                    this.execute();
                case "appear":
                    this.appear();
                    break;
                case "beAttack":
                    this.beAttack(this.eventJson.beAttack);
                    break;
                case "sceneDisappear":
                    this.sceneDisappear();
                    break;
                case "sceneAppear":
                    this.sceneAppear();
                    break;
                case "clearNpcEvent":
                    this.clearNpcEvent();
                    break;
                case "weak":
                    //this.gameMap.getElement(this.eventJson.weak[0], "monster").weak(this.eventJson.weak[1]);
                    break;
            }
        } else if (!this.eventCompleteFlag) {
            this.eventCompleteFlag = true;
            if (this.eventInfo) {
                this.levelData.setDisappear("event", this.eventInfo.index);
            }
            GameApp.EventManager.fireNow(this, CommonEventArgs.create(GameEvent.COLLISION_COMPLETE));
        }
    }

    private chat() {
        UIFactory.showDialog("Prefab/Dialogs/ChatDialog", {
            content: this.eventJson.chat[this.chatStep++],
            endCallback: () => {
                this.execute();
            },
        });
    }

    private move() {
        let moveData = this.eventJson.move[this.moveStep++];
        let movePath = moveData.path;
        for (let layer in movePath) {
            //moveinfo 格式[0, 38, 5]第一个延时，第二个当前坐标，第三个终点坐标
            let move = movePath[layer];
            move.forEach((moveInfo: number[]) => {
                GameApp.CommandManager.createCommand(MoveCommand).execute(layer, moveInfo[1], moveInfo[2], moveData.speed, moveInfo[0]);
            });
        }
        this.scheduleOnce(this.execute, moveData.interval * moveData.speed * this.globalConfig.npcSpeed + 0.05);
    }

    private specialMove() {
        let info = this.eventJson.specialMove;
        GameApp.CommandManager.createCommand(SpecialMoveCommand).execute(info);
        this.scheduleOnce(this.execute, info.interval);
    }

    private appear() {
        let appearInfo = this.eventJson.appear[this.appearStep++];
        if (appearInfo.delay) {
            for (let layer in appearInfo.layer) {
                let layerInfo = appearInfo.layer[layer];
                for (let i = 0; i < layerInfo.length; i++) {
                    this.scheduleOnce(() => {
                        GameApp.CommandManager.createCommand(AppearCommand).execute(layer, layerInfo[i][0], layerInfo[i][1]);
                    }, appearInfo.delay[i]);
                }
            }
        } else {
            for (let layer in appearInfo.layer) {
                let layerInfo = appearInfo.layer[layer];
                layerInfo.forEach((elementInfo: number[]) => {
                    GameApp.CommandManager.createCommand(AppearCommand).execute(layer, elementInfo[0], elementInfo[1]);
                });
            }
        }

        this.scheduleOnce(this.execute, appearInfo.interval);
    }

    private disappear() {
        let info = this.eventJson.disappear[this.disappearStep++];
        for (let layer in info) {
            info[layer].forEach((index: number) => {
                GameApp.CommandManager.createCommand(DisappearCommand).execute(layer, index);
            });
        }
        this.execute();
    }

    private beAttack(info: any) {
        if (info.hero) {
            this.hero.magicLight(info.hero);
        } else if (info.monster) {
            let position = this.gameMap.getPositionAt(this.gameMap.getTile(info.monster));
            if (position) {
                this.createAttack(position);
            }
        }

        this.scheduleOnce(this.execute, this.globalConfig.fadeInterval + 0.05);
    }

    private sceneAppear() {
        let info = this.eventJson.sceneAppear;
        GameApp.getModel(HeroModel).weak();
        GameApp.EventManager.fireNow(this, SceneAppearEventArgs.create(info[0], this.gameMap.getTile(info[1])));
        this.execute();
    }

    private sceneDisappear() {
        GameApp.EventManager.fireNow(this, CommonEventArgs.create(GameEvent.SCENE_DISAPPEAR));
        this.scheduleOnce(() => {
            this.execute();
        }, 1);
    }

    private async createAttack(position: IVec2) {
        let icon = (await GameApp.NodePoolManager.createNodeWithPath("attack", "Prefab/Element/Attack")) as Node;
        icon.parent = (this.gameMap as any).node;
        icon.position = v3(position.x, position.y);
        tween(icon).delay(this.globalConfig.fadeInterval).removeSelf().start();
    }

    private clearNpcEvent() {
        let npc = this.levelData.getLayerElement<Npc>("npc", this.eventJson.clearNpcEvent);
        if (npc) {
            npc.clearEvent();
        }
        this.execute();
    }
}
