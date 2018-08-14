import {RecursiveMap, MatchResultKind} from '../Generic';

export interface SpecialKeyMatchResult {
    specialKey: SpecialKeyCommon;
    kind: MatchResultKind;
    matchedCount: number;
}

// 特殊キー入力の共通I/F(?)
export interface SpecialKeyCommon {
    indicator: string; // 指示者(?)

    unmapConflicts(node: RecursiveMap, keyToMap: string): void;
    matchSpecial(
        inputs: string[],
        additionalArgs: {[key: string]: any},
        lastSpecialKeyMatch?: SpecialKeyMatchResult,
    ): SpecialKeyMatchResult | null;
}
