import m from 'mithril'
import {BaseNewVm, BaseEditVm, BaseViewVm, IAction} from './common'
import {PadModel, WellModel, BoreholeModel, UserModel} from '../models'
import {selectFile, readTextFileAsync} from '../utils'
import { BoreholeDb, Pad, User, UserRole, Well, WellInfo } from '../types'
import { DialogService } from '../dialog'
import { Action, ObjType } from '../actrl'

export const GeomagModeValues = { global: 'Global', manual: 'Manual' }
export const GeomagManualValues = { bggm: 'BGGM', hdgm: 'HDGM', ifr: 'IFR' }


class WellNewVm extends BaseNewVm {
    obj: WellInfo
    parent: Pad
    fes: User[]
    fe: string = null
    get geomode(): 'global' | 'crustal' | 'manual' {
        switch(this.obj.geomag) {
            case 'wmm': return 'global'
            case 'emm': return 'crustal'
            default: return 'manual'
        }
    }
    set geomode(val) {
        switch(val) {
            case 'global': this.obj.geomag = 'wmm'; return
            case 'crustal': this.obj.geomag = 'emm'; return
            case 'manual': this.obj.geomag = null; return
        }
    }
    get geoval(): 'bggm' | 'hdgm' | 'ifr' {
        switch(this.obj.geomag) {
            case 'bggm': return 'bggm'
            case 'hdgm': return 'hdgm'
            case 'ifr1': return 'ifr'
            default: return null
        }
    }
    set geoval(val) {
        switch(val) {
            case 'bggm': this.obj.geomag = 'bggm'; return
            case 'hdgm': this.obj.geomag = 'hdgm'; return
            case 'ifr': this.obj.geomag = 'ifr1'; return
        }
    }
    constructor(parent_id: string) {
        super(WellModel, PadModel, parent_id)
        this.display_name = 'Create new well'
        this.return_path = (id) => `/well/${id}`
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.fes = (await UserModel.loadList()).filter((fe: User) => fe.role == UserRole.FE && !fe.well)
    }
    async submit() {
        this.beforeSubmit()
        let id = await this.model.saveNew(this.parent, this.obj)
        await UserModel.setWell(this.fe, id)
        m.route.set(this.return_path(id))
    }
}

class WellEditVm extends BaseEditVm {
    obj: Well
    get geomode(): 'global' | 'crustal' | 'manual' {
        switch(this.obj.geomag) {
            case 'wmm': return 'global'
            case 'emm': return 'crustal'
            default: return 'manual'
        }
    }
    set geomode(val) {
        switch(val) {
            case 'global': this.obj.geomag = 'wmm'; return
            case 'crustal': this.obj.geomag = 'emm'; return
            case 'manual': this.obj.geomag = null; return
        }
    }
    get geoval(): 'bggm' | 'hdgm' | 'ifr' {
        switch(this.obj.geomag) {
            case 'bggm': return 'bggm'
            case 'hdgm': return 'hdgm'
            case 'ifr1': return 'ifr'
            default: return null
        }
    }
    set geoval(val) {
        switch(val) {
            case 'bggm': this.obj.geomag = 'bggm'; return
            case 'hdgm': this.obj.geomag = 'hdgm'; return
            case 'ifr': this.obj.geomag = 'ifr1'; return
        }
    }
    constructor(id: string) {
        super(WellModel, id)
    }
}

export function isNew(obj: WellNewVm | WellEditVm): obj is WellNewVm {
    return (obj as WellNewVm).fes !== undefined;
}


class WellViewVm extends BaseViewVm {
    obj: Well
    // decunc: TaskVm
    child_path = (cid) => `/borehole/${cid}`
    constructor(id: string) {
        super(ObjType.Well, WellModel, id)
        // this.decunc = new DecuncVm(id, () => this.update())
        this.hasExport = true
    }

    get newBorehole() {
        const manual = this.obj.data_mode == 'manual'
        return this.wrapAction({
            type: manual ? Action.Create : Action.Workflow,
            name: 'New borehole', 
            icon: 'add', 
            disabled: () => this.obj.boreholes.some(o => o.active),
            action: () => {m.route.set(`/well/${this.obj.id}/create_borehole`)}
        }, ObjType.Borehole)
    }

    importBorehole: IAction = this.wrapAction({
        type: Action.Create,
        name: 'Import',
        icon: 'upload',
        disabled: () => this.obj.boreholes.some(o => o.active),
        action: async () => { await this.importBorehole_impl() },
    }, ObjType.Borehole)
    private async importBorehole_impl() {
        var file = await selectFile('application/json')
        var json = await readTextFileAsync(file)
        try {
            var data = JSON.parse(json)
            await BoreholeModel.saveNew(this.obj, data)
            await this.update()
        } catch (e) {
            DialogService.showError(e)
        }
    }
    toggleActiveBorehole(borehole: BoreholeDb) {
        return this.wrapAction({
            type: Action.Edit,
            name: borehole.active ? 'finalize' : 'activate',
            icon: '',
            action: async (e: Event) => {e.preventDefault(); await this.toggleActiveBorehole_impl(borehole)}

        })
    }
    async toggleActiveBorehole_impl(borehole: BoreholeDb) {
        try {
            await BoreholeModel.setActive(borehole.id, !borehole.active)
            await this.update()
        } catch (e) {
            DialogService.showError(e)
        }
    }
}

export {WellNewVm, WellEditVm, WellViewVm}