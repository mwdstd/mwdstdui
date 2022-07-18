import { parse } from "papaparse"
import { SurveyInfo } from "../types"

export function loadSixAxis(csv: string): SurveyInfo[] {
    if(!csv) return []

    let records = parse(csv)
    let data = records.data.filter((x: string[]) => x.length >= 7).map((row: string[]) => row.map(parseFloat))
    //check if first row is header
    if (isNaN(data[0][0]))
        data.shift()
    let traj = data.map(row => ({
        md: row[0], 
        gx: row[1], gy: row[2], gz: row[3], 
        bx: row[4], by: row[5], bz: row[6],
        time: new Date(),
        pre_qc: true
    }))
    validateSixAxis(traj)
    return traj
}

function validateSixAxis(traj: SurveyInfo[]) {
    if(traj.length == 0)
        return
    if(traj.some(s => Object.keys(s).some(k => isNaN(s[k]))))
        throw Error("Non numeric values in surveys")
}
