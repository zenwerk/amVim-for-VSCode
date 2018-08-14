import {ExtensionContext} from 'vscode';
import {Configuration} from './Configuration';
import {Dispatcher} from './Dispatcher';
import {Mode} from './Modes/Mode';

let dispatcher: Dispatcher;

/* VSCode の拡張機能のエントリポイント
 * 拡張が有効になるときに activate が呼ばれる
 * この関数は起動時の1回のみ呼ばれる
 * 
 * ExtensionContext は拡張機能のユーティリティ集で activate の最初の引数
 */
export function activate(context: ExtensionContext) {
    Configuration.init();
    dispatcher = new Dispatcher(context);

    // disposable なものを context に登録する
    context.subscriptions.push(
        Configuration,
        dispatcher
    );
}

export function getCurrentMode(): Mode | null {
    return dispatcher ? dispatcher.currentMode : null;
}
