import m from 'mithril'
import {BaseVm, ChildrenVm, IAction} from './common'
import {ClientModel, OilfieldModel, UserModel, WellModel} from '../models'
import { ClientDb, User, UserRole } from '../types'
import { Action, ObjType } from '../actrl'
import { DashboardVm } from './dashboard'

class HomeVm extends BaseVm {
    objects: ChildrenVm
    users?: User[]
    createUser: IAction
    dashboard?: DashboardVm
    list: ClientDb[]
    objects_name: string
    objects_model: any
    constructor() {
        super()
        this.path = [
            {ref: `/`, title: 'Home'},
        ]
        this.createUser = {
            type: Action.Create,
            name: `New user`,
            icon: 'add',
            action: () => { m.route.set('/create_user') },
            //hide: () => !authorized(options.user_role(), options.object_type, Action.Create),
        }
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        let after = Promise.resolve()
        switch(this.user.role) {
            case UserRole.SU:
                this.objects_name = 'Clients'
                this.objects = new ChildrenVm({
                    object_type: ObjType.Client,
                    user_role: this.userRole,
                    display_name: 'client',
                    child_path: (id) => `/client/${id}`,
                    create_path: '/create_client'
                })
                after = after.then(() => ClientModel.loadList().then((l) => {this.list = l}))
                break
            case UserRole.CR:
                this.dashboard = new DashboardVm()
                this.objects_name = 'Oilfields'
                this.objects = new ChildrenVm({
                    object_type: ObjType.Oilfield,
                    user_role: this.userRole,
                    display_name: 'oilfield',
                    child_path: (id) => `/field/${id}`
                })
                after = this.dashboard.init.then(() => ClientModel.load(this.user.client).then((c) => {this.list = c.oilfields}).catch(() => {this.list = []}))
                break
            case UserRole.DE:
                this.objects_name = 'Oilfields'
                this.objects = new ChildrenVm({
                    object_type: ObjType.Oilfield,
                    user_role: this.userRole,
                    display_name: 'oilfield',
                    child_path: (id) => `/field/${id}`
                })
                after = Promise.all(this.user.oilfields.map((id) => OilfieldModel.load(id))).then((l) => {this.list = l})
                
                break
            case UserRole.FE:
                this.objects_name = 'Wells'
                this.objects = new ChildrenVm({
                    object_type: ObjType.Well,
                    user_role: this.userRole,
                    display_name: 'well',
                    child_path: (id) => `/well/${id}`,
                    name_generator: (w) => m('', 
                        m('i.material-icons.right', 
                            w.data_mode == 'manual' ? 'engineering' : 'precision_manufacturing'), 
                            `${w.field.name} - ${w.pad.name} - ${w.name}`)
                })
                if (!this.user.well) {
                    this.list = []
                    after = Promise.resolve()
                } else {
                    after = Promise.all([this.user.well].map((id) => WellModel.load(id))).then((l) => {this.list = l})
                }
                break
            default:
                //Not active
        }
        await after
        if([UserRole.SU, UserRole.DE].includes(this.user.role)) 
            this.users = await UserModel.loadList()
    }
    protected ondestroy(): void {
        this.dashboard?.destroy()
        super.ondestroy()
    }
}

export {HomeVm}
