import { ObjType } from '../actrl'
import { DialogService } from "../dialog"
import { ClientModel, OilfieldModel, UserModel, WellModel } from "../models"
import { ClientDb, OilfieldDb, User, WellShort } from "../types"
import { BaseNewVm, BaseViewVm } from "./common"

export class UserNewVm extends BaseNewVm {
    pass_confirm: string
    constructor() {
        super(UserModel)
    }
}

export class UserViewVm extends BaseViewVm {
    obj: User
    oilfields: OilfieldDb[]
    wells: WellShort[]
    clients: ClientDb[]
    constructor(id: string) {
        super(ObjType.User, UserModel, id)
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        try {
            this.clients = await ClientModel.loadList()
        } catch {}
        
        this.oilfields = await OilfieldModel.loadList()
        this.wells = await WellModel.loadList()
    }
    buildPath() {
        this.path = [
            {ref: `/`, title: 'Home'},
            {ref: `/user/${this.obj.id}`, title: this.obj.name}
        ]
    }
    async setRole() {
        try {
            await UserModel.setRole(this.obj.id, this.obj.role)
        } catch (e) {
            DialogService.showError(e)
            await this.update()
        }
    }
    async setClient(clid: string) {
        try {
            await UserModel.setClient(this.obj.id, clid)
        } catch (e) {
            DialogService.showError(e)
        }
        await this.update()
    }
    async addOilfield(name: string) {
        try {
            let field = this.oilfields.filter(of => of.name == name)[0]
            if (field) {
                this.obj.oilfields.push(field.id)
                await UserModel.setOilfields(this.obj.id, this.obj.oilfields)
            }
        } catch (e) {
            DialogService.showError(e)
        }
        await this.update()
    }
    async removeOilfield(fid: string) {
        try {
            this.obj.oilfields = this.obj.oilfields.filter(f => f != fid)
            await UserModel.setOilfields(this.obj.id, this.obj.oilfields)
        } catch (e) {
            DialogService.showError(e)
        }
        await this.update()
    }
    async addWell(name: string) {
        try {
            let names = name.split('/')
            let well = this.wells.filter(o => o.field.name == names[0] && o.pad.name == names[1] && o.name == names[2])[0]
            if (well) {
                this.obj.well = well.id
                await UserModel.setWell(this.obj.id, well.id)
            }
        } catch (e) {
            DialogService.showError(e)
        }
        await this.update()
    }
    async removeWell(wid: string) {
        try {
            this.obj.well = null
            await UserModel.setWell(this.obj.id, null)
        } catch (e) {
            DialogService.showError(e)
        }
        await this.update()
    }
    getWellName(well: WellShort) {
        return `${well?.field?.name}/${well?.pad?.name}/${well?.name}`
    }
}