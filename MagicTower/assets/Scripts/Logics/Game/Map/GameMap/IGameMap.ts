import { IVec2 } from "../../../../../GameFramework/Scripts/Base/GameStruct/IVec2";
import { IAstarMap } from "../../../../../GameFramework/Scripts/ToolLibary/Astar/IAstarMap";

export type CheckType = (position: IVec2) => boolean;

/**
 * 地图接口
 */
export interface IGameMap extends IAstarMap {
    /**
     * 设置A*检查代理回调
     * @param callbackfn 回调函数
     */
    setCheckDelegate(callbackfn: CheckType): void;

    /**
     * 根据tile坐标得到地图索引
     * @param tile tile坐标
     * @returns 地图索引
     */
    getTileIndex(tile: IVec2): number;

    /**
     * 根据地图索引得到tile坐标
     * @param index 地图索引
     * @returns tile坐标
     */
    getTile(index: number): IVec2;

    /**
     * cocos坐标转换为屏幕坐标
     * @param position cocos坐标
     * @returns 屏幕坐标
     */
    toScreen(position: IVec2): IVec2;

    /**
     * cocos坐标转换为tile坐标
     * @param position cocos坐标
     * @returns tile坐标
     */
    toTile(position: IVec2): IVec2;

    /**
     * 根据tile坐标得到cocos坐标
     * @param tile tile坐标
     * @returns cocos坐标
     */
    getPositionAt(tile: IVec2): IVec2 | null;

    /**
     * 得到当前地图块的层名以及资源名字
     * @param tile tile坐标
     * @param layerName 层名
     */
    getTileInfo(
        tile: IVec2,
        layerName?: string
    ): {
        layerName?: string;
        spriteName?: string;
    };

    /**
     * 设置地图块的gid
     * @param layerName 层名
     * @param tile tile坐标
     * @param gid 地图块gid
     */
    setTileGIDAt(layerName: string, tile: IVec2, gid: number | null): void;

    /**
     * 得到地图块的gid
     * @param layerName 层名
     * @param tile tile坐标
     * @returns 地图块gid
     */
    getTileGIDAt(layerName: string, tile: IVec2): number | null;

    /**
     * 根据地图块资源名字获取gid
     * @param name 地图块资源名字
     * @returns 地图块gid
     */
    getGidByName(name: string): number | null;

    /**
     * 根据地图块的gid获取资源名字
     * @param gid 地图块gid
     * @returns 资源名字
     */
    getNameByGid(gid: number): string | null;
}
