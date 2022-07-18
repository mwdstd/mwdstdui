import m from 'mithril'
import {parse} from 'papaparse'
import {BaseNewVm, BaseEditVm} from './common'
import { Load6AxisMixin, LoadCiMixin, LoadSlidesheetMixin, LoadTrajMixin } from './loaders'
import {RunModel, SurveyControl, SurveyModel, Workflow} from '../models'
import { selectFile } from '../utils'
import { CiStation, Plan, Reference, RefParams, Run, SlideInterval, Station, Survey } from '../types'
import { DialogService } from '../dialog'
import { dls } from '../calc'
import { CheckParentTagsMixin, CheckTagsMixin } from './datatags'

class SurveyNewVm extends Load6AxisMixin(LoadSlidesheetMixin(LoadTrajMixin(LoadCiMixin(CheckParentTagsMixin(BaseNewVm))))) {
    parent: Run
    ci: CiStation[]
    plan: Plan
    raw: any
    corrected: any
    delta: RefParams
    dls: Number
    dls_pass: Boolean
    reference: Reference
    is_plan_actual?: boolean
    is_ci_empty: boolean = false
    constructor(parent_id: string) {
        super(SurveyModel, RunModel, parent_id)
        this.display_name = 'Create new survey'
        this.return_path = (id) => `/run/${parent_id}`
        this.plan = {revision: null, stations: []}
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.reference = this.parent.head_ref
    }


    async submit() {
        if(this.isManualMode()) {
            await super.submit()
        } else {
            let id = await Workflow.newSurvey(this.parent, {
                survey: this.obj, 
                ci: this.ci, 
                ...this.is_plan_new ? {plan: this.plan} : {}
            })
            m.route.set(this.return_path(id))
        }
    }

    async importSurvey() {
        var file = await selectFile('text/csv')
        try {
            this.obj = (await this.load6Axis(file)).pop()
        } catch (e) {
            DialogService.showError(e)
        }
        m.redraw()
    }

    async importCi(file: File) {
        if(!file) return
        var ci: CiStation[];
        try {
            ci = await this.loadCi(file)
            let mindepth = Math.max(0, ...this.parent.surveys.map(s => s.md))
            ci = ci.filter((c) => c.md < this.obj.md && c.md > mindepth)
            this.is_ci_empty = false
        } catch (e) {
            DialogService.showError(Error("Error parsing file"))
            return
        }
        this.ci = ci
        m.redraw()
    }

    async importPlan(file: File) {
        if(!file) return
        var stations: Station[];
        try {
            stations = await this.loadTraj(file)
        } catch (e) {
            DialogService.showError(e)
            return
        }
        this.plan.stations = stations
        m.redraw()
    }

    validateCi() {
        return this.is_ci_empty || this.ci?.length > 0 
    }

    async calculateCorrection() {
        {
            let empty = {
                ABX: 0, ABY: 0, ABZ: 0, ASX: 0, ASY: 0, ASZ: 0,
                MBX: 0, MBY: 0, MBZ: 0, MSX: 0, MSY: 0, MSZ: 0,
                MXY: 0, MXZ: 0, MYZ: 0, 
            }
            let res = await SurveyControl.manualCorrectionSingle(this.parent, empty, this.obj)
            let stations: any[] = res.stations.map((s, i) => ({...s, ...res.surveys[i]}))
            let st = stations.slice(-1)[0]
            let c = {
                ...st,
                g: st.tg,
                b: st.tb
            }
            this.raw = c
            this.delta = {
                g: 0.5 * (c.max.g - c.min.g),
                b: 0.5 * (c.max.b - c.min.b),
                dip: 0.5 * (c.max.dip - c.min.dip)
            }
        }
        if(this.parent.correction){
            let res = await SurveyControl.manualCorrectionSingle(this.parent, this.parent.correction.result.dni_cs, this.obj)
            let stations: any[] = res.stations.map((s, i) => ({...s, ...res.surveys[i]}))

            let st = stations.slice(-1)[0]
            let c = {
                ...st,
                g: st.tg,
                b: st.tb
            }
            this.corrected = c
            this.delta = {
                g: 0.5 * (c.max.g - c.min.g),
                b: 0.5 * (c.max.b - c.min.b),
                dip: 0.5 * (c.max.dip - c.min.dip)
            }
            let prev = stations.slice().sort((a,b) => a.md - b.md).filter((s) => s.qc == 0 && s.md < st.md).slice(-1)[0]
            if(prev) {
                this.dls = dls(st, prev, this.user.us.dls_interval)
                if(st.qc == 0)
                    this.dls_pass = true
                else if (st.qc_pass.g && st.qc_pass.b && st.qc_pass.dip)
                    this.dls_pass = false
                else
                    this.dls_pass = undefined
            }
        }
    }

    get total_depth() {
        return this.obj.md + this.parent.bha.dni_to_bit
    }

    get b() {
        return Math.sqrt(this.obj.bx * this.obj.bx + this.obj.by * this.obj.by + this.obj.bz * this.obj.bz)
    }
    get g() {
        return Math.sqrt(this.obj.gx * this.obj.gx + this.obj.gy * this.obj.gy + this.obj.gz * this.obj.gz)
    }
    get dip() {
        return Math.asin((this.obj.gx * this.obj.bx + this.obj.gy * this.obj.by + this.obj.gz * this.obj.bz) / (this.g * this.b)) * (180/Math.PI);
    }
    get inc() {
        return Math.acos(this.obj.gz / this.g) * (180/Math.PI)
    }
    get az() {
        let a1 = this.obj.bz / this.b - this.obj.gz / this.g * Math.sin(this.dip / (180/Math.PI)); //SIN(ASIN)???
        let a2 = (this.obj.gy * this.obj.bx - this.obj.gx * this.obj.by) / (this.g * this.b);
        let azm = Math.atan2(a2, a1) * (180/Math.PI)
        let dec = this.parent.reference && this.parent.reference.length > 0 ? this.parent.reference[this.parent.reference.length - 1].dec : 0;
        let grid = this.parent.reference && this.parent.reference.length > 0 ? this.parent.reference[this.parent.reference.length - 1].grid : 0;
        return (azm + (dec - grid) + 360) % 360.0;
    }

    get is_plan_new() { return (this.is_plan_actual === false) }
}

class SurveyEditVm extends CheckTagsMixin(BaseEditVm) {
    obj: Survey
    constructor(id: string) {
        super(SurveyModel, id)
    }
}

export {SurveyNewVm, SurveyEditVm}