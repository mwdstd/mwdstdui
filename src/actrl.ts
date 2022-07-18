import { UserRole } from "./types"

export enum ObjType {
    User,
    Client,
    Oilfield,
    Pad,
    Well,
    Borehole,
    Run,
    Survey,
    Task
}

export enum Action {
    Create,
    View,
    Delete,
    Edit,
    Export,
    Finalize,
    Workflow
}

export function authorized(role: UserRole, ot: ObjType, op: Action, obj?: any) {
    if (!role || role == UserRole.None) return false
    if (obj?.maintenance_mode || obj?.well?.maintenance_mode) return false
    if (role == UserRole.DE && ot == ObjType.Oilfield && op == Action.Create ) return false
    if (role == UserRole.DE && ot == ObjType.Oilfield && op == Action.Delete ) return false
    if (role == UserRole.DE && ot == ObjType.Oilfield && op == Action.Edit ) return false
    if (role == UserRole.FE) {
        if (op == Action.Workflow) return true
        if (op == Action.Export) return true
        if (ot == ObjType.Task && op == Action.Create) return true
        return false
    }
    if (role == UserRole.CR && op != Action.View ) return false
    return true
}