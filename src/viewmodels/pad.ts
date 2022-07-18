import {BaseNewVm, BaseEditVm, BaseViewVm, ChildrenVm} from './common'
import {OilfieldModel, PadModel, WellModel} from '../models'
import {selectFile, readTextFileAsync} from '../utils'
import { Oilfield, Pad, PadInfo } from '../types'
import { DialogService } from '../dialog'
import { ObjType } from '../actrl'

class PadNewVm extends BaseNewVm {
    obj: PadInfo
    parent: Oilfield
    constructor(parent_id: string) {
        super(PadModel, OilfieldModel, parent_id)
        this.display_name = 'Create new pad'
        this.return_path = (id) => `/pad/${id}`
    }
}

class PadEditVm extends BaseEditVm {
    obj: Pad
    constructor(id: string) {
        super(PadModel, id)
    }
}

class PadViewVm extends BaseViewVm {
    obj: Pad
    wells: ChildrenVm
    constructor(id: string) {
        super(ObjType.Pad, PadModel, id)
        this.wells = new ChildrenVm({
            object_type: ObjType.Well,
            user_role: this.userRole,
            display_name: 'well',
            child_path: (cid) => `/well/${cid}`,
            create_path: `/pad/${id}/create_well`,
        })
    }
    async importWell() {
        var file = await selectFile('application/json')
        var json = await readTextFileAsync(file)
        try{
            var data = JSON.parse(json)
            await WellModel.saveNew(this.obj, data)
            await this.update()
        } catch (e) {
            DialogService.showError(e)
        }
    }
}

export {PadNewVm, PadEditVm, PadViewVm}