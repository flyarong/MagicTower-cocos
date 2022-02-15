import { ModelBase } from "../../../GameFramework/Scripts/Application/Model/ModelBase";
import { ModelContainer } from "../../../GameFramework/Scripts/Application/Model/ModelContainer";
import { GameFrameworkLog } from "../../../GameFramework/Scripts/Base/Log/GameFrameworkLog";
import { Utility } from "../../../GameFramework/Scripts/Utility/Utility";
import { StairType } from "./Data/Elements/Stair";
import { LevelData } from "./Data/LevelData";
import { LevelTempData } from "./Data/LevelTempData";
import { MapSwitchLevelEventArgs } from "./MapModelEventArgs";

@ModelContainer.registerModel("MapModel")
export class MapModel extends ModelBase {
    private readonly MIN_LEVEL: number = 0;
    private readonly MAX_LEVEL: number = 50;
    private currentLevel: number = 1;
    private maps: { [key: number | string]: LevelData } = {};

    private levelTempDatas: { [key: number | string]: LevelTempData } = {};

    set level(value) {
        this.currentLevel = value;
    }

    get level() {
        return this.currentLevel;
    }

    canSwitchLevel(diff: number, useFeather: boolean = false): boolean {
        let minLevel = useFeather ? this.MIN_LEVEL : 1;
        let level = this.level + diff;
        return level >= minLevel && level <= this.MAX_LEVEL;
    }

    canReachLevel(diff: number): boolean {
        let level = this.level + diff;
        return !!this.maps[level];
    }

    setLevelDiff(diff: number): void {
        let newLevel = this.currentLevel + diff;
        if (newLevel > this.MAX_LEVEL || newLevel < this.MIN_LEVEL) {
            GameFrameworkLog.error(`level${newLevel}不合法`);
            return;
        }
        let currentLevel = this.currentLevel;
        this.currentLevel = newLevel;
        //如果是上去的，英雄站到下楼梯的旁边
        this.fireNow(MapSwitchLevelEventArgs.create(currentLevel, diff > 0 ? StairType.Down : StairType.UP));
    }

    getCurrentLevelData(): LevelData {
        return this.maps[this.currentLevel];
    }

    getLevelData(level: number): LevelData {
        return this.maps[level] || null;
    }

    getLevelTempData(level: number): LevelTempData {
        return this.levelTempDatas[level] || null;
    }

    /**
     * 创建层数据
     * @param level 层等级
     * @param properties 层地图属性
     * @param data 额外数据
     * @returns 层数据
     */
    createLevelData(level: number, properties: any, data: any = null) {
        let levelData = new LevelData(level);
        levelData.loadProperties(properties, data);
        this.maps[level] = levelData;
        this.levelTempDatas[level] = new LevelTempData(level, levelData, data);
        return levelData;
    }

    load(info: any = null) {
        if (info) {
            this.currentLevel = info.currentLevel;
            for (let level in info.maps) {
                this.maps[level] = new LevelData(parseInt(level));
                this.maps[level].load(info.maps[level]);
            }
        }

        this.useTestLoad();
    }

    private useTestLoad() {
        let useTestload = Utility.Json.getJsonElement("global", "useTestLoad");
        if (useTestload) {
            let testLoadData: any = Utility.Json.getJsonElement("global", "testLoad");
            if (testLoadData) {
                this.loadData(testLoadData);
            } else {
                GameFrameworkLog.error("hero model test laod data is null");
            }
        }
    }
}
