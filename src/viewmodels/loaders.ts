import m from 'mithril'
import { readTextFileAsync } from "../utils"
import { AnyConstructor, BaseModelVm } from "./common"
import {parseBhaXml, parseGeometryXml} from '../dataformats/witsml.js'
import { parseCiLas } from '../dataformats/ci-convert'
import { CiStation, SlideInterval, Station, SurveyInfo } from '../types'
import { loadTrajectory } from '../dataformats/traj-csv'
import { parse } from 'papaparse'
import { loadSixAxis } from '../dataformats/sixaxis-csv'

export const LoadSlidesheetMixin = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends c {
    async loadSlidesheet(file: File): Promise<SlideInterval[]> {
        var str_data = await readTextFileAsync(file)
        var data: SlideInterval[]
        if(file.type == 'application/json') {
            data = JSON.parse(str_data)
        } else {
            let records = parse(str_data)
            data = records.data.filter((x: string[]) => x.length >=6).map(row => ({
                md_start: Number(row[0]),
                md_stop: Number(row[1]),
                mode: row[2],
                tf_mode: row[3],
                tf_value: Number(row[4]),
                steer_ratio: Number(row[5])
            }))
            //check if first row is header
            if (isNaN(data[0].md_start))
                data.shift()
            
        }
        return data
    }
}

export const Load6AxisMixin = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends c {
    async load6Axis(file: File): Promise<SurveyInfo[]> {
        var str_data = await readTextFileAsync(file)
        var data: SurveyInfo[]
        if(file.type == 'application/json') {
            data = JSON.parse(str_data)
        } else {
            data = loadSixAxis(str_data)
        }
        return data
    }
}
export const LoadCiMixin = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends c {
    async loadCi(file: File): Promise<CiStation[]> {
        var data: CiStation[]
        if(file.type == 'application/json') {
            var json = await readTextFileAsync(file)
            data = JSON.parse(json)
        } else {
            data = parseCiLas(file)
        }
        return data
    }
}

export const LoadTrajMixin = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends c {
    async loadTraj(file: File): Promise<Station[]> {
        if(!file) return []
        var data: Station[]
        var text = await readTextFileAsync(file)
        if(file.type == 'application/json') {
            data = JSON.parse(text)
        } else {
            data = loadTrajectory(text)
        }
        return data
    }
}

export const LoadBhaMixin = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends c {
    obj: {bha: any}
    async loadBha(file) {
        var bha;
        try {
            var text = await readTextFileAsync(file)
            if(file.type == 'application/json') {
                bha = JSON.parse(text)
            } else if(file.type == 'text/xml') {
                bha = parseBhaXml(text)
            }
        } catch (e){
            console.log(e)
            return
        }
        this.obj.bha = bha
        m.redraw()
    }
}

export const LoadGeometryMixin = <T extends AnyConstructor<BaseModelVm>>(c: T) => class extends c {
    obj: {geometry: any}
    async loadGeometry(file) {
        var data;
        try {
            var text = await readTextFileAsync(file)
            if(file.type == 'application/json') {
                data = JSON.parse(text)
            } else if(file.type == 'text/xml') {
                data = parseGeometryXml(text)
            }
        } catch (e){
            console.log(e)
            return
        }        
        this.obj.geometry = data
        m.redraw()
    }
}