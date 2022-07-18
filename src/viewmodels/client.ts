import {BaseNewVm, BaseEditVm, BaseViewVm, ChildrenVm} from './common'
import {Client, ClientInfo} from '../types'
import {ClientModel} from '../models'
import { ObjType } from '../actrl'

class ClientNewVm extends BaseNewVm {
    obj: ClientInfo
    constructor() {
        super(ClientModel)
        this.display_name = 'Create new client'
        this.return_path = (id) => `/client/${id}`
    }
}

class ClientEditVm extends BaseEditVm {
    obj: Client
    constructor(id: string) {
        super(ClientModel, id)
    }
}

class ClientViewVm extends BaseViewVm {
    obj: Client
    oilfields: ChildrenVm
    constructor(id: string) {
        super(ObjType.Client, ClientModel, id)
        this.oilfields = new ChildrenVm({
            object_type: ObjType.Oilfield,
            user_role: this.userRole,
            display_name: 'oilfield',
            child_path: (cid) => `/field/${cid}`,
            create_path: `/client/${id}/create_field`
        })
    }
}

export {ClientNewVm, ClientEditVm, ClientViewVm}