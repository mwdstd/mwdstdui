import { Borehole, Run, Well, WellInfo } from "./types"

export function isWell(obj: Well | Borehole | Run): obj is Well {
    return (obj as Borehole | Run).well === undefined;
}

export function hasBend(bha: any) {
    return bha.structure?.find(s => s.type == 'motor') || bha.structure?.find(s => s.type == 'bend_sub')
}
export function hasMwd(bha: any) {
    return bha.structure?.find(s => s.type == 'mwd')
}
export function bhaType(bha: any) {
    if (bha.structure?.find(s => s.type == 'rss')) return 'RSS'
    if (bha.structure?.find(s => s.type == 'motor')) return 'Motor'
    return 'N/A'
}
