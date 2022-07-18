import m from 'mithril'
import {selectFile} from '../utils'
import {BaseModelVm, BaseNewVm, BaseEditVm, BaseViewVm, AnyConstructor, IAction} from './common'
import {BoreholeModel, RunModel, SurveyModel, Workflow} from '../models'
import { Borehole, GeometrySection, Run, RunInfo } from '../types'
import { Load6AxisMixin, LoadBhaMixin, LoadCiMixin, LoadGeometryMixin, LoadSlidesheetMixin, LoadTrajMixin } from './loaders'
import { CorrectionVm } from './tasks'
import { DialogService } from '../dialog'
import { Action, ObjType } from '../actrl'
import { CheckParentTagsMixin, CheckTagsMixin } from './datatags'
import { QaVm } from './qc'
import { events } from '../events'

var RunEditBase = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends LoadBhaMixin(LoadGeometryMixin(c)) 
{
    last_section?: GeometrySection
    hole_size?: number
    continue_section?: boolean = undefined
    protected _is_last_section_cased: boolean = false
    get is_last_section_cased() {
        return this._is_last_section_cased
    }
}

class RunNewVm extends LoadTrajMixin(RunEditBase(CheckParentTagsMixin(BaseNewVm))) {
    obj: RunInfo
    parent: Borehole
    #is_plan_actual?: boolean
    set is_plan_actual(val: boolean) {
        this.#is_plan_actual = val
        if(val)
            this.obj.plan = Object.assign({}, this.parent.last_plan)
    }
    get is_plan_new() { return !this.parent.last_plan || (this.#is_plan_actual === false) }
    constructor(parent_id: string) {
        super(RunModel, BoreholeModel, parent_id)
        this.display_name = 'Create new run'
        this.return_path = (id) => `/run/${id}`
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.last_section = this.parent.geometry_finished?.slice(-1)[0]
        this._is_last_section_cased = !this.last_section || this.last_section.casing_inner_diameter != null
    }

    get well() { return this.parent.well }

    async submit() {
        if(this.isManualMode()) {
            await super.submit()
        } else {
            var geom = this.parent.geometry_finished
            if(!this.continue_section) {
                this.obj.geometry = [...geom, {hole_diameter: this.hole_size, description: 'Open hole'}]
            } else {
                this.obj.geometry = geom
            }
            let id = await Workflow.newRun(this.parent, this.obj)
            m.route.set(this.return_path(id))
        }
    }
}

class RunEditVm extends RunEditBase(CheckTagsMixin(BaseEditVm)) {
    obj: Run
    constructor(id: string) {
        super(RunModel, id)
    }
    get well() { return this.obj.well }
}

class RunViewVm extends Load6AxisMixin(LoadSlidesheetMixin(LoadTrajMixin(LoadCiMixin(CheckTagsMixin(BaseViewVm))))) {
    obj: Run
    raw_stations?: any[]
    cor_stations?: any[]
    correction: CorrectionVm
    qa: QaVm
    constructor(id: string) {
        super(ObjType.Run, RunModel, id)
        this.hasExport = true
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        await this.recalcStations()
        this.correction = new CorrectionVm({...this.obj.borehole, well: this.obj.well}, () => this.update())
        await this.correction.init
        this.qa = new QaVm(this.obj.correction?.result?.qa)
        this.subscribeToRunEvents()
    }

    protected getOperations(): IAction[] {
        const ops = super.getOperations()
        if (!this.isManualMode()) {
            ops[0].disabled = () => true
            ops[1].disabled = () => true
            ops.push({
                type: Action.Workflow, 
                name: 'Finalize', 
                icon: 'lock', 
                disabled: () => !this.obj.active || this.obj.surveys.length == 0,
                action: () => this.finalize()
            })
        }
        return ops
    }
    protected ondestroy(): void {
        events.runs.removeRunListener(this.obj.id, this.handleRunUpdate)
        this.correction?.destroy()
        super.ondestroy()
    }

    private subscribeToRunEvents() {
        events.runs.addRunListener(this.obj.id, this.handleRunUpdate)
    }

    private handleRunUpdate = async (e: any) => { 
        this.update();
    }


    async update() {
        await super.update()
        await this.recalcStations()
        this.correction?.updateParent({...this.obj.borehole, well: this.obj.well})
    }

    async recalcStations() {
        this.raw_stations = this.obj?.stations
        
        if(this.obj?.correction?.result && this.obj.correction.result.surveys.length <= this.raw_stations.length)
        {
            this.cor_stations = this.obj.correction.result.stations.map((s, i) => {
                s.qc = this.obj.correction.result.surveys[i].qc
                s.inc_pass = this.obj.correction.result.surveys[i].inc_pass
                s.az_pass = this.obj.correction.result.surveys[i].az_pass
                return s
            })
            this.qa = new QaVm(this.obj.correction?.result?.qa)
        }
        else
            this.cor_stations = null
    }

    get newSurvey() {
        const manual = this.isManualMode()
        return this.wrapAction({
            type: manual ? Action.Create : Action.Workflow,
            name: 'New survey', 
            icon: 'add', 
            disabled: () => !manual && (!this.obj.active || this.correction.running),
            action: () => {m.route.set(`/run/${this.obj.id}/create_survey`)}
        }, ObjType.Survey)
    }
    
    get undoLastSurvey() {
        if (this.isManualMode()) return null
        return this.wrapAction({
            type: Action.Workflow,
            name: 'Undo last survey', 
            icon: 'undo', 
            disabled: () => !this.obj.active || this.correction.running || this.obj.surveys.length < 1,
            action: () => {this.undoLastSurvey_impl()}
        }, ObjType.Survey)
    }

    get importSurveys() {
        if (!this.isManualMode()) return null
        return this.wrapAction({
            type: Action.Create,
            name: 'Import', 
            icon: 'upload', 
            action: async () => { await this.importSurveys_impl() },
        }, ObjType.Survey)
    }

    get importCi() {
        if (!this.isManualMode()) return null
        return this.wrapAction({
            type: Action.Edit,
            name: 'Import', 
            icon: 'upload', 
            action: async () => { await this.importCi_impl() },
        })
    }

    get uploadPlan() {
        if (!this.isManualMode()) return null
        return this.wrapAction({
            type: Action.Edit,
            name: 'Upload new revision', 
            icon: 'upload', 
            action: () => {},
        })
    }

    private async importCi_impl() {
        var file = await selectFile('application/json,.las')
        let data = await this.loadCi(file)
        try {
            await RunModel.saveCi(this.obj, data)
            await this.update()
        } catch (e) {
            DialogService.showError(e)
        }
    }
    async importSurveys_impl() {
        var file = await selectFile('application/json, text/csv')
        if (!file) return
        try {
            var data = await this.load6Axis(file)
        } catch (e) {
            DialogService.showError(e)
            return
        }
        try {
            await RunModel.saveSurveys(this.obj, data)
        } catch (e) {
            DialogService.showError(e)
            return
        }
        await this.update()
    }
    async uploadPlan_impl(plan) {
        try {
            await RunModel.savePlan(this.obj, plan)
        } catch (e) {
            DialogService.showError(e)
            return
        }
        await this.update()
    }

    async finalize() {
        await Workflow.finalizeRun(this.obj)
        m.route.set(this.path[this.path.length - 2].ref)        
    }

    async editSurvey(s) {
        m.route.set(`/survey/${s.id}/edit`)
    }

    async deleteSurvey(s) {
        await SurveyModel.delete(s)
        await this.update()
    }

    private async undoLastSurvey_impl() {
        let sid = this.obj.surveys.slice(-1)[0]?.id
        if (!sid) return
        await Workflow.undoSurvey(sid)
        await this.update()
    }
}

export {RunNewVm, RunEditVm, RunViewVm}