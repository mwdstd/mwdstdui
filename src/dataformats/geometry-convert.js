import * as parser from 'fast-xml-parser'
import {cunit} from "./common"

function parseGeometryXml14(text) {
    var jsonObj = parser.parse(text, {
        ignoreAttributes: false, 
        textNodeName : "value",
        arrayMode: (tag) => ['wbGeometry', 'wbGeometrySection'].includes(tag)
    })
    var sections = jsonObj.wbGeometrys.wbGeometry[0].wbGeometrySection
    return sections.map(s => ({
        hole_diameter: cunit(s.odSection, 'mm'),
        casing_inner_diameter: cunit(s.idSection, 'mm'),
        casing_start: cunit(s.mdTop, 'm'),
        casing_stop: cunit(s.mdBottom, 'm'),
        description: s.typeHoleCasing
    }))

}

function parseGeometryXml20(text) {
    var jsonObj = parser.parse(text, {
        ignoreAttributes: false, 
        textNodeName : "value",
        arrayMode: (tag) => tag === 'WellboreGeometrySection'
    })
    var sections = jsonObj.WellboreGeometry.WellboreGeometrySection
    return sections.map(s => ({
        hole_diameter: cunit(s.OdSection, 'mm'),
        casing_inner_diameter: cunit(s.IdSection, 'mm'),
        casing_start: cunit(s.SectionMdInterval['eml:MdTop'], 'm'),
        casing_stop: cunit(s.SectionMdInterval['eml:MdBase'], 'm'),
        description: s.TypeHoleCasing
    }))

}

export function parseGeometryXml(text) {
    try {
        return parseGeometryXml14(text)
    } catch (e) {
        return parseGeometryXml20(text)
    }
}