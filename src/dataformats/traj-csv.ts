import { parse } from "papaparse"
import { Station } from "../types"
import { zip } from "../utils"

export function loadTrajectory(csv: string): Station[] {
    if(!csv) return []
    let records = parse(csv)
    let data = records.data.filter((x: string[]) => x.length >= 3).map((row: string[]) => row.map(parseFloat))
    //check if first row is header
    if (isNaN(data[0][0]))
        data.shift()
    let traj = data.map(row => ({md: row[0], inc: row[1], az: row[2], tf: isNaN(row[3]) ? null : row[3]}))
    validateTraj(traj)
    return traj
}

function validateTraj(traj: Station[]) {
    if(traj.length == 0)
        return
    if(traj.some(s => isNaN(s.md) || isNaN(s.inc) || isNaN(s.az) || isNaN(s.tf)))
        throw Error("Non numeric values in trajectory")
    if(!zip(traj.slice(0, -1), traj.slice(1)).every((p) => p[0].md < p[1].md))
        throw Error("Trajectory is not monotonous")
}
