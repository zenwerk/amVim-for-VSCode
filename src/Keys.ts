// ここで指定された key は keyboard shortcuts に `amVim.` で登録される
export const raws = new Array<string>().concat(
    'backspace delete space escape left right up down'
        .split(' '),

    'cruwfb['
        .split('').map(key => `ctrl+${key}`)
);
