import { ObjType } from "../actrl"
import { tvd } from "../calc"
import { BoreholeModel } from "../models"
import { Borehole, Correction, Station } from "../types"
import { BaseViewVm } from "./common"
import { QaVm } from "./qc"

function getStations(c: Correction) {
    if (c.stations_hd) return c.stations_hd
    return c.stations.filter((s, i) => c.surveys[i].qc == 0).slice().sort((a, b) => a.md - b.md)
}

export class ReportVm extends BaseViewVm {
    obj: Borehole
    stations: Station[]
    corrections: {
        name: string 
        c: Correction
        qa: QaVm
    }[]
    constructor(id: string) {
        super(ObjType.Borehole, BoreholeModel, id)
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.stations = this.obj.runs.filter(r => r.correction?.result).map(r => getStations(r.correction.result)).flat()
        const start_md = Math.min(...this.stations.map(s => s.md))
        if (start_md < Infinity)
            this.stations = [...this.obj.last_plan.stations.filter(s => s.md < start_md), ...this.stations]
        this.corrections = this.obj.runs.filter(r => r.correction?.result).map(r => {
            const qa = new QaVm(r.correction.result.qa)
            return {
                name: r.name,
                c: r.correction.result,
                qa
            }
        })
        this.corrections.forEach(r => {
            r.c.stations = r.c.stations.map((s, i) => ({
                ...s, 
                ...r.c.surveys[i],
            }))
        })
        tvd(this.stations, this.user.us.dls_interval)
    }
}