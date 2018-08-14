import {window, commands, Disposable, ExtensionContext} from 'vscode';
import * as Keys from './Keys';

// Modes
import {Mode, ModeID} from './Modes/Mode';
import {ModeNormal} from './Modes/Normal';
import {ModeVisual} from './Modes/Visual';
import {ModeVisualLine} from './Modes/VisualLine';
import {ModeInsert} from './Modes/Insert';

// Actions
import {ActionMode} from './Actions/Mode';
import {ActionFind} from './Actions/Find';
import {ActionMoveCursor} from './Actions/MoveCursor';

// Config
import {Configuration} from './Configuration';

/* amVim の実際のエントリポイントのクラス */
export class Dispatcher {

    private _currentMode: Mode;
    get currentMode(): Mode { return this._currentMode; }

    private modes: {[k: string]: Mode} = {
        [ModeID.NORMAL]: new ModeNormal(),
        [ModeID.VISUAL]: new ModeVisual(),
        [ModeID.VISUAL_LINE]: new ModeVisualLine(),
        [ModeID.INSERT]: new ModeInsert(),
    };

    private disposables: Disposable[] = [];

    /* amVim の初期実行はここから */
    constructor(context: ExtensionContext) {
        // `amVim.mode.` 内部モード切り替えコマンドとして vscode に登録する
        Object.keys(this.modes).forEach(key => {
            let mode = this.modes[key];
            context.subscriptions.push(commands.registerCommand(`amVim.mode.${mode.id}`, () => {
                this.switchMode(mode.id);
            }));
        });

        // 入力操作をすべて inputHandler に流す(?)
        context.subscriptions.push(commands.registerCommand('type', args => {
            this.inputHandler(args.text)();
        }));

        // replacePreviousChar については https://github.com/Microsoft/vscode-extension-samples/blob/master/vim-sample/README.md
        context.subscriptions.push(commands.registerCommand('replacePreviousChar', args => {
            this.inputHandler(args.text, { replaceCharCnt: args.replaceCharCnt })();
        }));

        // Keys.ts で指定されているキーを `amVim.` コマンドとして inputHandler 経由の動作で登録する
        Keys.raws.forEach(key => {
            context.subscriptions.push(commands.registerCommand(`amVim.${key}`, this.inputHandler(key)));
        });

        context.subscriptions.push(commands.registerCommand('amVim.executeNativeFind', ActionFind.executeNativeFind));

        ActionMoveCursor.updatePreferredColumn();

        this.switchMode(Configuration.defaultModeID);

        this.disposables.push(
            // onDidChangeTextEditorSelection はエディタ内の選択項目が変更されたときに発火する
            window.onDidChangeTextEditorSelection(() => {
                // Ensure this is executed after all pending commands.
                setTimeout(() => {
                    ActionMode.switchByActiveSelections(this._currentMode.id);
                    ActionMoveCursor.updatePreferredColumn();
                    this._currentMode.onDidChangeTextEditorSelection();
                }, 0);
            }),
            // 現在アクティブなエディタのフォーカスが変わったときに発火
            window.onDidChangeActiveTextEditor(() => {
                if (Configuration.defaultModeID === ModeID.INSERT) {
                    ActionMode.toInsert();
                }
                else {
                    // Passing `null` to `currentMode` to force mode switch.
                    ActionMode.switchByActiveSelections(null);
                }
                ActionMoveCursor.updatePreferredColumn();
            })
        );
    }

    // 各キーの動作を amVim の現在のモードを経由して動作させるようにする
    private inputHandler(key: string, args: {} = {}): () => void {
        return () => {
            this._currentMode.input(key, args);
        };
    }

    private switchMode(id: ModeID): void {
        const lastMode = this._currentMode;

        if (lastMode) {
            lastMode.exit();
        }

        this._currentMode = this.modes[id];
        this._currentMode.enter();

        commands.executeCommand('setContext', 'amVim.mode', this._currentMode.name);

        // For use in repeat command
        if (lastMode) {
            this._currentMode.onDidRecordFinish(lastMode.recordedCommandMaps, lastMode.id);
        }
    }

    dispose(): void {
        Disposable.from(...this.disposables).dispose();

        Object.keys(this.modes).forEach(id => {
            (this.modes[id]).dispose();
        });
    }

}
