import { director, Scene } from "cc";
import { GameFrameworkLog } from "../../Base/Log/GameFrameworkLog";
import { ISceneHelp } from "../../Scene/ISceneHelp";

export class CSceneHelp implements ISceneHelp {
    getScene<T extends object>(): T | null {
        return director.getScene() as T;
    }

    loadScene(sceneName: string, onLaunchedCallback?: Function, onUnloadedCallback?: Function): boolean {
        return director.loadScene(
            sceneName,
            (error: Error | null, scene?: Scene) => {
                if (error) {
                    GameFrameworkLog.error(error);
                }
                onLaunchedCallback && onLaunchedCallback();
            },
            () => {
                onUnloadedCallback && onUnloadedCallback();
            }
        );
    }

    preloadScene(sceneName: string, onProgressCallback?: (completedCount: number, totalCount: number, item: any) => void, onLoadedCallback?: (error: Error | null, sceneAsset?: object) => void): void {
        if (onProgressCallback && onLoadedCallback) {
            director.preloadScene(sceneName, onProgressCallback, onLoadedCallback);
        } else {
            director.preloadScene(sceneName, onLoadedCallback);
        }
    }
}
