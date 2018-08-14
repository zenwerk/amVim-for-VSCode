import {RecursiveMap, MatchResultKind} from '../Generic';
import {SpecialKeyCommon, SpecialKeyMatchResult} from './Common';

export class SpecialKeyN implements SpecialKeyCommon {

    indicator = '{N}';

    // 衝突の正規表現
    private conflictRegExp = /^[1-9]|\{char\}$/;

    // 衝突しているものをunmapしている?
    // 何に衝突しているのか？
    unmapConflicts(node: RecursiveMap, keyToMap: string): void {
        if (keyToMap === this.indicator) {
            Object.getOwnPropertyNames(node).forEach(key => {
                // 正規表現にマッチしたら node[key] の要素を削除する
                this.conflictRegExp.test(key) && delete node[key];
            });
        }

        if (this.conflictRegExp.test(keyToMap)) {
            delete node[this.indicator];
        }
    }

    // 特殊キーにマッチしているか調べている？
    matchSpecial(
        inputs: string[],
        additionalArgs: {[key: string]: any},
        lastSpecialKeyMatch?: SpecialKeyMatchResult,
    ): SpecialKeyMatchResult | null {
        if (! /[1-9]/.test(inputs[0])) {
            return null;
        }

        let n = [inputs[0]];

        inputs.slice(1).every(input => {
            if (/[0-9]/.test(input)) {
                n.push(input);
                return true;
            }
            return false;
        });

        additionalArgs.n = parseInt(n.join(''), 10);

        return {
            specialKey: this,
            kind: MatchResultKind.FOUND,
            matchedCount: n.length,
        };
    }

}
