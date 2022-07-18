import { Station } from "./types"

const d2r = Math.PI / 180

export function tvd(stations: Station[], dls_interval: number) {
    if (stations.length > 0)
        stations[0].dls = stations[0].tvd = stations[0].ns = stations[0].ew = 0.0
    for(let i = 0; i < stations.length - 1; i++) {
        let s1 = stations[i]
        let s2 = stations[i+1]
        let dmd = (s2.md - s1.md)
        let sinI1 = Math.sin(s1.inc*d2r)
        let sinI2 = Math.sin(s2.inc*d2r)
        let cosI1 = Math.cos(s1.inc*d2r)
        let cosI2 = Math.cos(s2.inc*d2r)
        let cosA1 = Math.cos(s1.az*d2r)
        let cosA2 = Math.cos(s2.az*d2r)
        let sinA1 = Math.sin(s1.az*d2r)
        let sinA2 = Math.sin(s2.az*d2r)
        let cosdI = Math.cos((s2.inc - s1.inc)*d2r)
        let cosdA = Math.cos((s2.az - s1.az)*d2r)
        let DL = Math.acos(cosdI - sinI1 * sinI2 * (1 - cosdA))

        let DL2 = DL * .5
        DL2 = DL2 < 1e-10 ? 1e-10 : DL2
        let RF = Math.tan(DL2) / DL2

        s2.dls = DL * dls_interval / d2r / dmd 
        let dMD2RF = dmd * RF * .5
        s2.ns = s1.ns + dMD2RF * (sinI1 * cosA1 + sinI2 * cosA2)
        s2.ew = s1.ew + dMD2RF * (sinI1 * sinA1 + sinI2 * sinA2)
        s2.tvd = s1.tvd + dMD2RF * (cosI1 + cosI2)
    }
}

export function dls(st: Station, prev: Station, dls_interval: number) {
    if (!st || !prev) return null
    let dl = Math.acos(Math.cos(d2r * (st.inc - prev.inc)) - Math.sin(d2r * prev.inc) * Math.sin(d2r * st.inc) * (1 - Math.cos(d2r*(st.az - prev.az))))
    return dl * dls_interval / d2r / (st.md - prev.md)
}