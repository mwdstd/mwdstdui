import { isWell } from "../typehelpers"
import { Borehole, BoreholeParents, DbObject, Run, Well, WellInfo } from "../types"
import { AnyConstructor, BaseNewVm, BaseObjectVM } from "./common"

const reqTags = (well: WellInfo) => {
    let tags = []
    switch (well.service_level) {
        case 3:            
            tags = [...tags, 'ci']
        case 2:            
            tags = [...tags, 'bha', 'mud_weight']
        case 1:
            tags = [...tags, 'plan', 'wellbore_geometry']
    }
    return tags
}

const optTags = (well: WellInfo) => {
    return []
}

export const CheckTagsMixin =  <T extends AnyConstructor<BaseObjectVM>>(c: T) => class extends c {
    obj: BoreholeParents & DbObject
    checkTag(tag: string) {
        const well = this.obj.well
        if(reqTags(well).includes(tag)) return true
        if(optTags(well).includes(tag)) return false
        return null
    }
    isManualMode() { return this.obj.well.data_mode == 'manual' }
}


export const CheckParentTagsMixin = <T extends AnyConstructor<BaseNewVm>>(c: T) => class extends c {
    parent: Well | Borehole | Run
    checkTag(tag: string) {
        const well = isWell(this.parent) ? this.parent : this.parent.well
        if(reqTags(well).includes(tag)) return true
        if(optTags(well).includes(tag)) return false
        return null
    }
    isManualMode() { return !isWell(this.parent) ? this.parent.well.data_mode == 'manual' : this.parent.data_mode == 'manual' }
}