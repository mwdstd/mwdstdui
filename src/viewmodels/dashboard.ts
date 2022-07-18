import m from 'mithril'
import { dls } from '../calc';
import { events } from '../events';
import { SurveyControl, TasksModel } from "../models";
import { ActiveRunInfo, CorrectedSurvey, PlanInfo, Station, Task, TaskStatus } from "../types";
import { BaseVm } from "./common";
import { QaVm } from './qc';

const REFRESH_TIME = 10 * 1000; //10 sec

interface DashboardItem {
    name: string
    no_correction: boolean
    qa: QaVm
    bh_id: string
    run_id: string
    last: CorrectedSurvey & Station
    deepest?: Station
    plan_dev?: Station & {dh: number}
    plan?: PlanInfo
    maintenance_mode: boolean
}

export class DashboardVm extends BaseVm {
    items: DashboardItem[]
    tasks: {[id: string] : Task}
    bhTasks: {[id: string] : Task}
    #es: EventSource
    constructor() {
        super()
        this.buildPath()
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        await this.load()
        await this.getTasks()
        this.listenToTaskChanges()
        await this.periodicRefresh()
    }
    buildPath() {
        this.path = [
            {ref: `/`, title: 'Home'},
            {ref: `/control`, title: 'Dashboard'},
        ]
    }
    private async load()
    {
        let info: ActiveRunInfo[] = await SurveyControl.load()
        this.items = info.map(o => { 
            const cr = o.correction?.result
            let pd = cr?.plan_dev
            const last = {
                ...cr?.surveys?.slice(-1)[0],
                ...cr?.stations?.slice(-1)[0],
            }
            const stations = cr?.stations_hd ?? cr?.stations?.filter(s => s.qc == 0).slice().sort((a,b) => a.md - b.md);
            const prev = stations?.filter(s => s.md < last.md).slice(-1)[0]
            last.dls = dls(last, prev, this.user.us.dls_interval)
            return {
                name: `${o.client.name} - ${o.field.name} - ${o.pad.name} - ${o.well.name} - ${o.borehole.name} - ${o.run.name}`,
                no_correction: !cr,
                qa: new QaVm(cr?.qa),
                bh_id: o.borehole.id, 
                run_id: o.run.id,
                last,
                deepest: cr?.deepest,
                plan_dev: {
                    ...pd, 
                    ...pd ? {dh: Math.sqrt(pd.ns * pd.ns + pd.ew * pd.ew)} : {dh: null}
                    },
                plan: o.plan,
                maintenance_mode: o.well.maintenance_mode
            }
        })
    }
    private async getTasks() {
        let tlist : Task[] = await TasksModel.loadList()
        tlist = tlist.filter(t => t.type == 'correction')
        this.tasks = {}
        this.bhTasks = {}
        tlist.forEach((t => {
            this.tasks[t.id] = t
            this.bhTasks[t.parent_id] = t
        }));
    }

    private handleTaskUpdate = async (e: any) => {
        let task : Task = JSON.parse(e.data)
        if(task.type != 'correction') return
        this.tasks[task.id] = task
        this.bhTasks[task.parent_id] = task
        if (task.status == TaskStatus.completed)
            await this.load()
        m.redraw()
    }
    private handleTaskDelete = async (e: any) => {
        delete this.bhTasks[this.tasks[e.data].parent_id]
        delete this.tasks[e.data]
        m.redraw()
}

    private listenToTaskChanges() {
        events.tasks.addEventListener('update', this.handleTaskUpdate)
        events.tasks.addEventListener('delete', this.handleTaskDelete)
    }
    private async periodicRefresh() {
        await this.load()
        await this.getTasks()
        m.redraw()
        if (!this.destroy_flag) setTimeout(async () => await this.periodicRefresh(), REFRESH_TIME)
    }
    protected ondestroy() {
        events.tasks.removeEventListener('update', this.handleTaskUpdate)
        events.tasks.removeEventListener('delete', this.handleTaskDelete)
        super.ondestroy()
    }
}
