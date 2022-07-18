import {convertArray, convertibleTo} from './common'

export async function parseCiLas(file) {
    let las = new Las(file)
    let cdata
    try {
        cdata = await las.dataStripped()
    } catch {
        return []
    }
    let headers = await las.curveParams()
    headers = Object.keys(headers).map(k => ({name: k, ...headers[k]}))
    cdata = cdata.filter(row => row.length == headers.length)
    let mds
    try {
        mds = convertArray(cdata.map(row => row[0]), headers[0].unit.toLowerCase(), 'm')
    } catch(e) {
        console.error("Cannot convert first column to depth")
        return
    }
    headers.shift()
    cdata.forEach(element => {element.shift()});
    let angularColumnsIndices = headers.map((c, i) => convertibleTo(headers[i].unit.toLowerCase(), 'deg') ? i : -1).filter(i => i > -1)
    if (angularColumnsIndices.length == 0) {
        console.error("No angular columns")
        return
    }
    let incColumnIndex = angularColumnsIndices[0]
    if (angularColumnsIndices.length > 1) {
        //select inclination column
    }
    return mds.map((md, i) => ({md, inc: cdata[i][incColumnIndex]}))
}