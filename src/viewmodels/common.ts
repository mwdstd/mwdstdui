import m from 'mithril'
import {download, zip} from '../utils'
import { Model, UserModel } from '../models'
import { DbObject, User, UserRole } from '../types'
import { DialogService } from '../dialog'
import { Action, authorized, ObjType } from '../actrl'
import { events } from '../events'

export class BaseVm {
    init: Promise<void>
    user: User
    path: {ref: string, title:string}[] = []
    destroy_flag: boolean

    constructor() {
        this.init = new Promise((resolve, reject) => {
            setTimeout(() => {
                this.initialize().then(resolve).catch(reject)
            }, 0)
        })
    }
    protected async initialize() {
        try {
            this.user = await UserModel.loadMe()
        } catch {
            console.error("Error in fetch user info")
        }
    }
    buildPath() {
        this.path = []
    }
    checkServiceRequirements(services, level, field) {
        return services.some((s) => s[level].includes(field))
    }
    isRequired(field) { return true }
    destroy() {
        this.destroy_flag = true
        this.ondestroy()
        m.redraw.sync()
    }
    protected ondestroy() {}
    protected userRole = () => this.user.role
}

export class BaseModelVm extends BaseVm {
    model: Model
    constructor(model: Model) {
        super()
        this.model = model
    }
}

export class BaseObjectVM extends BaseModelVm {
    private global_event_source = null
    private id: string = null
    obj: DbObject
    constructor(model: Model, id: string) {
        super(model)
        this.id = id
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        try {
            this.obj = await this.load(this.id)
            this.buildPath()
            this.subscribeToEvents()
        } catch (e) {
            console.log(e)
            console.warn('Load error')
        }
    }

    protected async load (id) { 
        try {
            return await this.model.load(id) 
        } catch (e) {
            if(e.code == 404)
                m.route.set('/object/'+id)
            throw(e)
        }
    }
    protected async export() {
        let data = await this.model.export(this.obj.id)
        download(JSON.stringify(data, null, ' '), `${this.obj.name}.json`, `application/json`)
    }
    exportData(name: string, data: any) {
        download(JSON.stringify(data, null, ' '), `${this.obj.name}-${name}.json`, `application/json`)
    }
    protected async update() {
        this.obj = await this.load(this.obj.id)
        this.buildPath()
        m.redraw()
    }
    protected ondestroy(): void {
        events.global.removeEventListener('update', this.handleGlobalChange)
        super.ondestroy()
    }
    private subscribeToEvents() {
        events.global.addEventListener('update', this.handleGlobalChange)
    }
    private handleGlobalChange = async () => this.update()
}

export interface IAction {
    type: Action,
    name: string,
    icon: string,
    disabled?: () => boolean,
    hide?: () => boolean
    dangerous?: boolean,
    action: (e: any) => void | Promise<void> 
}

export class BaseViewVm extends BaseObjectVM {
    constructor(type: ObjType, model: Model, id: string) { 
        super(model, id)
        this.objType = type
    }

    private objType: ObjType
    protected hasExport: boolean = false

    protected wrapAction = (act: IAction, objType?: ObjType) => {
        act.hide = () => !authorized(this.user.role, objType ?? this.objType, act.type, this.obj)
        return act
    }

    get operations() {
        const ops = this.getOperations()
        for (const op of ops) {
            this.wrapAction(op)
        }
        return ops
    }

    protected getOperations() : IAction[] {
        return [
            {type: Action.Delete, name: 'Delete', icon: 'delete', dangerous: true, action: () => this.delete()},
            {type: Action.Edit, name: 'Edit', icon: 'edit', action: () => this.edit()},
            ...this.hasExport ? [
                {type: Action.Export, name: 'Export', icon: 'download', action: () => this.export()},
            ] : []
        ]
    }

    buildPath() {
        this.path = buildPath(this.user.role, this.obj)
    }

    protected edit() {
        m.route.set(`${this.path[this.path.length - 1].ref}/edit`)
    }
    protected async delete() {
        try {
            await this.model.delete(this.obj)
            if(this.path.length > 1)
                m.route.set(this.path[this.path.length - 2].ref)
            else
                m.route.set('/')
        } catch (e) {
            DialogService.showError(e)
        }
    }
}

const EditableMixin = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends c {
    beforeSubmit() {}
}

export class BaseEditVm extends EditableMixin(BaseObjectVM) {
    constructor(model: Model, id: string) {
        super(model, id)
    }

    get display_name() {
        return `Edit ${this.obj?.name}`
    }

    buildPath() {
        this.path = buildPath(this.user.role, this.obj, PathType.edit)
    }

    async submit() {
        this.beforeSubmit()
        await this.model.save(this.obj)
        if(this.path.length > 1)
            m.route.set(this.path[this.path.length - 2].ref)
        else
            m.route.set('/')
    }
}

export class BaseNewVm extends EditableMixin(BaseModelVm) {
    private parent_model: Model
    private parent_id: string
    obj: any
    parent: DbObject
    display_name: string
    return_path: (id: string) => string
    constructor(model: Model, parent_model?: Model, parent_id?: string) {
        super(model)
        this.parent_model = parent_model
        this.parent_id = parent_id
        this.return_path = (id) => ''
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        if (this.parent_model) 
            this.parent = await this.parent_model.load(this.parent_id)
        this.obj = this.model.createNew(this.parent)
        this.buildPath()
    }
    buildPath() {
        this.path = buildPath(this.user.role, this.parent, PathType.create)
    }
    async submit() {
        this.beforeSubmit()
        let id = await this.model.saveNew(this.parent, this.obj)
        m.route.set(this.return_path(id))
    }
}

export class ChildrenVm {
    createNew: IAction
    display_name: string
    child_path: (id: string) => string
    create_path: string
    name_generator: (o: any) => string
    constructor(options: {
        object_type: ObjType,
        display_name: string, 
        child_path: (id: string) => string, 
        create_path?: string, 
        name_generator?: (o: any) => string | m.Vnode<any, any>,
        user_role: () => UserRole,
        disable_new?: () => boolean,
    }) {
        this.display_name = options.display_name
        this.child_path = options.child_path
        this.create_path = options.create_path
        this.name_generator = options.name_generator ?? ((s) => s.name)
        this.createNew = {
            type: Action.Create,
            name: `New ${this.display_name}`,
            icon: 'add',
            action: () => { m.route.set(this.create_path) },
            hide: () => !authorized(options.user_role(), options.object_type, Action.Create),
            disabled: options.disable_new
        }
    }
}

export type AnyFunction<A = any> = (...input: any[]) => A
export type AnyConstructor<A = object> = new (...input: any[]) => A
export type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>

enum PathType {view, edit, create}

function buildPath(role: UserRole, obj: any, mode: PathType = PathType.view) {
    let levels = ['/', '/client/', '/field/', '/pad/', '/well/', '/borehole/', '/run/', '/survey/']
    let objs = obj ? [
        {name: 'Home', id: null}, 
        obj.client ?? obj, 
        obj.field ?? obj, 
        obj.pad ?? obj, 
        obj.well ?? obj, 
        obj.borehole ?? obj, 
        obj.run ?? obj, 
        obj, 
    ] : [{name: 'Home', id: null}]
    objs = [...new Set(objs)]
    let paths = zip(levels, objs).filter(([l, o]) => o).map(([l, o]) => (
        {ref: `${l}${o.id ?? ''}`, title: o.name}
    ))
    if (mode == PathType.edit) {
        let last = paths.slice(-1)[0]
        let title = 'Edit'
        if(paths.length == 8) { // survey level
            paths.pop()
            title = 'Edit Survey'
        } 
            
        paths.push({ref: `${last.ref}/edit`, title})
    } else if (mode == PathType.create) {
        let last = paths.slice(-1)[0]
        const urls = ['client', 'field', 'pad', 'well', 'borehole', 'run', 'survey']
        const names = ['client', 'oilfield', 'pad', 'well', 'borehole', 'run', 'survey']
        paths.push({ref: `${last.ref}/create_${urls[paths.length - 1]}`, title: `New ${names[paths.length - 1]}`})
    }

    if (role == UserRole.DE) {
        paths[2] = {ref: paths[2].ref, title: `${paths[1].title} - ${paths[2].title}`}
        delete paths[1]
        paths = paths.filter(x => x)
    } else if(role == UserRole.FE) {
        paths[4] = {ref: paths[4].ref, title: `${paths[2].title} - ${paths[3].title} - ${paths[4].title}`}
        delete paths[1]
        delete paths[2]
        delete paths[3]
        paths = paths.filter(x => x)
    }

    return paths
}