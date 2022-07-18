import {BaseNewVm, BaseEditVm, BaseViewVm, ChildrenVm} from './common'
import {ClientModel, OilfieldModel, PadModel} from '../models'
import { Oilfield, OilfieldInfo } from '../types'
import { ObjType } from '../actrl'

class OilfieldNewVm extends BaseNewVm {
    obj: OilfieldInfo
    constructor(parent_id: string) {
        super(OilfieldModel, ClientModel, parent_id)
        this.display_name = 'Create new oilfield'
        this.return_path = (id) => `/field/${id}`
    }
}

class OilfieldEditVm extends BaseEditVm {
    obj: Oilfield
    constructor(id: string) {
        super(OilfieldModel, id)
    }
}

class OilfieldViewVm extends BaseViewVm {
    obj: Oilfield
    pads: ChildrenVm
    constructor(id: string) {
        super(ObjType.Oilfield, OilfieldModel, id)
        this.pads = new ChildrenVm({
            object_type: ObjType.Pad,
            user_role: this.userRole,
            display_name: 'pad',
            child_path: (cid) => `/pad/${cid}`,
            create_path: `/field/${id}/create_pad`, 
        })
    }
}

export {OilfieldNewVm, OilfieldEditVm, OilfieldViewVm}