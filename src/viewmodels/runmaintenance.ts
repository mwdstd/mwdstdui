import m from 'mithril'
import { DialogService } from '../dialog';
import { BoreholeModel, CorrectionOptions, RunModel, SurveyControl, TasksModel } from "../models";
import { Borehole, Run } from "../types";
import { RunViewVm } from "./run";


export enum MultiMode {
    on = 'on',
    off = 'off',
    auto = 'auto'
}

export class RunMaintenanceVm extends RunViewVm {
    runs: Run[]
    show_runs_count: number
    opts: CorrectionOptions
    #sag: number[]
    #dirty: boolean = false
    #hasChanges: boolean = false
    constructor(id: string) {
        super(id)
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        const b: Borehole = await BoreholeModel.load(this.obj.borehole.id)
        const rids = b.runs.map(r => r.id).filter(id => id != this.obj.id)
        this.runs = await Promise.all(rids.map(rid => this.model.load(rid)))
        this.show_runs_count = Math.min(this.nonempty_runs_count, 2)
        this.opts = new CorrectionOptions(this.obj)
        this._markStations()
        this.updateSag()
    }
    protected async load (id: string) { return await RunModel.load(id, false) }
    buildPath() {
        this.path = [
            {ref: `/`, title: 'Home'},
            {ref: `/control`, title: 'Dashboard'},
            {ref: `/control/${this.obj.id}`, title: `${this.obj.field.name} - ${this.obj.pad.name} - ${this.obj.well.name} - ${this.obj.borehole.name} - ${this.obj.name}`},
        ]
    }
    async update(): Promise<void> {
        this.obj = await this.load(this.obj.id)
        this.opts = new CorrectionOptions(this.obj)
        this.recalcStations()
        this.updateSag()
        this.#hasChanges = false
        this.#dirty = false
        this.buildPath()
        m.redraw()
    }
    get maintenance_mode() {
        return this.obj.well.maintenance_mode
    }
    async setMaintenaceMode() {
        DialogService.showProgress()
        try {
            await SurveyControl.setMaintenanceMode(this.obj.well, true)
            //if (this.obj.well.maintenance_mode) this.invalidate()
        } catch (e){
            DialogService.showError(e)
        }
        await this.update()
        //await sleep(1000)
        DialogService.hideProgress()
    }
    async reset() {
        DialogService.showProgress()
        try {
            await this.update()
        } catch (e) {
            // alert('!!!')
        }
        DialogService.hideProgress()
        m.redraw()
    }
    async submit() {
        DialogService.showProgress()
        try {
            if (this.hasChanges)
                await SurveyControl.saveCorrection(this.obj, this.opts)
            await SurveyControl.setMaintenanceMode(this.obj.well, false)
            m.route.set(this.path[this.path.length - 2].ref)
        } catch (e) {
            // alert('!!!')
        }
        DialogService.hideProgress()
    }
    async calculate() {
        DialogService.showProgress()
        try {
            await this.filteredCorrection()
            this.#dirty = false
        } catch (e) {
            // alert('!!!')
        }
        DialogService.hideProgress()
    }
    selectAll() {
        this.opts.filter = this.opts.filter.map(() => true)
        this.invalidate()
    }
    selectGood() {
        this.opts.filter = this.opts.filter.map((v, i) => this.raw_stations[i].qc == 0)
        this.invalidate()
    }
    async manualCorrection() {
        console.log(this.opts.dni_cs)
        let res = await SurveyControl.manualCorrection(this.obj, this.opts, this.#sag)
        this.obj.correction = {result: res}
        this.recalcStations()
        m.redraw()
    }
    async filteredCorrection() {
        let res = await SurveyControl.filteredCorrection(this.obj, this.opts)
        this.obj.correction = {result: res}
        this.opts.dni_cs = res.dni_cs
        this.recalcStations()
        this.updateSag()
        m.redraw()
    }
    async recalcStations(){
        await super.recalcStations()
        this._markStations()
    }    
    private _markStations(){
        if(!this.opts) return
        this.raw_stations.forEach(s => {
            s.qc = undefined
        })
        this.raw_stations.filter((s, i) => this.opts.filter[i]).forEach((s, i) => {
            s.qc = this.cor_stations?.[i]?.qc
        })
    }
    private updateSag() {
        this.#sag = this.obj.stations.map(x => 0.0)
        let j = 0;
        if (this.obj?.correction?.result?.sag)
            for(let i = 0; i < this.opts.filter.length; i++)
                if(this.opts.filter[i])
                    this.#sag[i] = this.obj.correction.result.sag[j++]
    }
    invalidate() { 
        this.#dirty = true 
        this.#hasChanges = true
    }
    get dirty() { return this.#dirty }
    get hasChanges() { return this.#hasChanges }
    set status_msa(value) {
        this.opts.status_msa = value
    }
    get status_msa() {return this.opts.status_msa}
    set msa_multi(value: MultiMode) {
        switch(value){
            case MultiMode.auto:
                this.opts.status_auto = true
                this.opts.status_multi = false
                break
            case MultiMode.off:
                this.opts.status_auto = false
                this.opts.status_multi = false
                break
            case MultiMode.on:
                this.opts.status_auto = false
                this.opts.status_multi = true
                break
            }
    }
    get msa_multi() {return this.opts.status_auto ? MultiMode.auto : this.opts.status_multi ? MultiMode.on : MultiMode.off}
    get nonempty_runs_count() {return this.runs.filter(r => r.stations.length > 0).length + 1}
}