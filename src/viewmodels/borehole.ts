import m from 'mithril'
import {BaseNewVm, BaseEditVm, BaseViewVm, AnyConstructor, BaseModelVm, IAction} from './common'
import {WellModel, BoreholeModel, RunModel, Workflow} from '../models'
import {selectFile, readTextFileAsync} from '../utils'
import { Borehole, BoreholeInfo, RunDb, Well } from '../types'
import { LoadGeometryMixin } from './loaders'
import { DialogService } from '../dialog'
import { CorrectionVm } from './tasks'
import { Action, ObjType } from '../actrl'
import { CheckParentTagsMixin, CheckTagsMixin } from './datatags'
import { QaVm } from './qc'


var BoreholeEditBase = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends LoadGeometryMixin(c) 
{
}


class BoreholeNewVm extends BoreholeEditBase(CheckParentTagsMixin(BaseNewVm)) {
    obj: BoreholeInfo
    parent: Well
    constructor(parent_id: string) {
        super(BoreholeModel, WellModel, parent_id)
        this.display_name = 'Create new borehole'
        this.return_path = (id) => `/borehole/${id}`
    }
    async submit() {
        if(this.isManualMode()) {
            await super.submit()
        } else {
            let id = await Workflow.newBorehole(this.parent, this.obj)
            m.route.set(this.return_path(id))
        }
    }
}

class BoreholeEditVm extends BoreholeEditBase(CheckTagsMixin(BaseEditVm)) {
    obj: Borehole
    constructor(id: string) {
        super(BoreholeModel, id)
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.obj.ref_head = this.obj.ref_head ?? {}
        this.obj.ref_traj = this.obj.ref_traj ?? []
    }
}

class BoreholeViewVm extends CheckTagsMixin(BaseViewVm) {
    obj: Borehole
    correction: CorrectionVm
    section: any
    finalized?: boolean
    child_path = (cid) => `/run/${cid}`
    issues: string[][]
    constructor(id: string) {
        super(ObjType.Borehole, BoreholeModel, id)
        this.hasExport = true
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.correction = new CorrectionVm(this.obj, () => this.update())
        await this.correction.init
        this.section = this.obj?.geometry?.[this.obj.geometry_finished?.length]
        this.issues = this.obj.runs.
            map(r => new QaVm(r.correction?.result?.qa)).
            map(qc => qc.issues)
    }

    async update() {
        await super.update()
        this.correction?.updateParent(this.obj)
    }


    get newRun() {
        const manual = this.isManualMode()
        return this.wrapAction({
            type: manual ? Action.Create : Action.Workflow,
            name: 'New run', 
            icon: 'add', 
            disabled: () => !manual && !this.obj.active || this.obj.runs.some(o => o.active),
            action: () => {m.route.set(`/borehole/${this.obj.id}/create_run`)}
        }, ObjType.Run)
    }

    protected ondestroy(): void {
        this.correction.destroy()
        super.ondestroy()
    }

    protected getOperations(): IAction[] {
        const ops = super.getOperations()
        if (!this.isManualMode()) {
            ops[0].disabled = () => this.obj.runs.length != 0
            ops[1].disabled = () => true
            ops.push({
                type: Action.Workflow, 
                name: 'Finalize', 
                icon: 'lock', 
                disabled: () => !this.obj.active || this.obj.runs.length == 0 || this.obj.runs.some(o => o.active),
                action: () => this.finalize()
            })
        }
        return ops
    }

    async importRun() {
        var file = await selectFile('application/json')
        var json = await readTextFileAsync(file)
        var data = JSON.parse(json)
        try {
            await RunModel.saveNew(this.obj, data)
            await this.update()
        } catch (e) {
            DialogService.showError(e)
        }

    }
    async importGyro() {
        var file = await selectFile('application/json')
        var json = await readTextFileAsync(file)
        var data = JSON.parse(json)
        try {
            await BoreholeModel.saveGyro(this.obj, data)
            await this.update()
        } catch (e) {
            DialogService.showError(e)
        }
    }
    async finalize() {
        try {
            await Workflow.finalizeBorehole(this.obj)
        } catch (e) {
            DialogService.showError(e)
        }
        m.route.set(this.path[this.path.length - 2].ref)        
    }

    toggleActiveRun(run: RunDb) {
        return this.wrapAction({
            type: Action.Edit,
            name: run.active ? 'finalize' : 'activate',
            icon: '',
            action: async (e: Event) => {e.preventDefault(); await this.toggleActiveRun_impl(run)}

        })
    }

    async toggleActiveRun_impl(run: RunDb) {
        try {
            await RunModel.setActive(run.id, !run.active)
            await this.update()
        } catch (e) {
            DialogService.showError(e)
        }
    }
}

export {BoreholeNewVm, BoreholeEditVm, BoreholeViewVm}