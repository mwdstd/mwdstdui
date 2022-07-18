import { XMLParser } from "fast-xml-parser"
import {cunit} from "./common"

const elTypes = {
    "bit core diamond": "bit",
    "bit core PDC": "bit",
    "bit diamond fixed cut": "bit",
    "bit hole opener": "bit",
    "bit insert roller cone": "bit",
    "bit mill tooth roller cone": "bit",
    "bit PDC fixed cutter": "bit",
    "bit under reamer": "bit",
    "casing cutter": "bit",
    "core barrel": "bit",
    "pipe cutter": "bit",
    "sub-jetting": "bit",
    "directional guidance system": "motor",
    "motor": "motor",
    "motor instrumented": "motor",
    "motor steerable": "motor",
    "turbine": "motor",
    "rotary steering tool": "rss",
    "sub-bent": "bend_sub",
    "casing crossover": "sub",
    "MWD hang off sub": "sub",
    "sub-bar catcher": "sub",
    "sub-circulation": "sub",
    "sub-cone": "sub",
    "sub-crossover": "sub",
    "sub-dart": "sub",
    "sub-filter": "sub",
    "sub-float": "sub",
    "sub-junk": "sub",
    "sub-orienting": "sub",
    "sub-ported": "sub",
    "sub-pressure relief": "sub",
    "sub-pump out": "sub",
    "sub-restrictor": "sub",
    "sub-saver": "sub",
    "sub-shock": "sub",
    "sub-side entry": "sub",
    "sub-stop": "sub",
    "non-magnetic stabilizer": "string_stabilizer",
    "stabilizer": "string_stabilizer",
    "stabilizer inline": "string_stabilizer",
    "stabilizer near bit": "string_stabilizer",
    "stabilizer near bit roller reamer": "string_stabilizer",
    "stabilizer non-rotating": "string_stabilizer",
    "stabilizer steerable": "string_stabilizer",
    "stabilizer string": "string_stabilizer",
    "stabilizer string roller reamer": "string_stabilizer",
    "stabilizer turbo back": "string_stabilizer",
    "stabilizer variable blade": "string_stabilizer",
    "reamer": "reamer",
    "MWD pulser": "mwd",
    "logging while drilling tool": "lwd",
    "heavy weight drill pipe": "hwdp",
    "heavy weight drill pipe LH": "hwdp",
    "non-magnetic collar": "nmdc",
    "casing": "drill_pipe",
    "coiled tubing in hole": "drill_pipe",
    "coiled tubing on coil": "drill_pipe",
    "drill pipe": "drill_pipe",
    "drill pipe compressive": "drill_pipe",
    "drill pipe LH": "drill_pipe",
    "drive pipe": "drill_pipe",
    "liner": "drill_pipe",
    "slotted liner": "drill_pipe",
    "accelerator": "collar",
    "core orientation barrel": "collar",
    "die collar": "collar",
    "die collar LH": "collar",
    "drill collar": "collar",
    "drill collar short": "collar",
    "landing float collar": "collar",
    "float collar": "collar",
    "jar": "jar",
    "other": "other"
}

function convertBhaElementType(src) {
    return elTypes[src]
}

const materials = {
    "aluminum": "aluminum",
    "beryllium copper": "beryllium_copper",
    "chrome alloy": "chrome_alloy",
    "composite": "composite",
    "other": "other",
    "non-magnetic steel": "nmsteel",
    "plastic": "plastic",
    "steel": "steel",
    "steel alloy": "steel_alloy",
    "titanium": "titanium"
}

function convertMaterial(src) {
    return materials[src]
}

function parseBhaXml14(text) {
    const parser = new XMLParser({
        ignoreAttributes: false, 
        textNodeName : "value",
        isArray: (tag) => ['tubular', 'tubularComponent', 'sensor', 'bend'].includes(tag)
    })
    var jsonObj = parser.parse(text)
    console.log(jsonObj)
    var components = jsonObj.tubulars.tubular[0].tubularComponent
    var cumLength = 0
    for (let c of components) {
        c.cumLength = cumLength
        cumLength += cunit(c.len, 'm')
    }
    let bitmap = components.map(c => c.bitRecord)
    let bend = components.find(c => c.bend)
    let mwdcomp = components.find(c => c.mwdTool && c.mwdTool.sensor.find(s => s.typeMeasurement == 'azimuth'))
    let sensor = mwdcomp?.mwdTool.sensor.find(s => s.typeMeasurement == 'azimuth')
    return {
        structure: components.map((c, i) => ({
            type: convertBhaElementType(c.typeTubularComp),
            description: c.description,
            // sn: c.customData.numSerial,
            sn: c.nameTag?.name,
            od: cunit(bitmap[i] ? bitmap[i].diaBit : c.od, 'mm'),
            id: cunit(c.id, 'mm'),
            weight: cunit(c.wtPerLen, 'kg/m') * cunit(c.len, 'm'),
            length: cunit(c.len, 'm'),
            material: convertMaterial(c.typeMaterial)
        })),
        blades: components.filter(c => c.stabilizer).map(c => ({
            od: cunit(c.stabilizer.odBladeMx, 'mm'),
            center_to_bit: cunit(c.stabilizer.distBladeBot, 'm') + cunit(c.stabilizer.lenBlade, 'm') / 2 + c.cumLength,
            length: cunit(c.stabilizer.lenBlade, 'm'),
        })),
        bend_angle: cunit(bend?.bend[0].angle, 'deg'),
        bend_to_bit: cunit(bend?.bend[0].distBendBot, 'm') + bend?.cumLength,
        dni_to_bit: sensor ? cunit(sensor.offsetBot, 'm') + mwdcomp?.cumLength : undefined,    
    }
}

function parseBhaXml20(text) {
    const parser = new XMLParser({
        ignoreAttributes: false, 
        textNodeName : "value",
        isArray: (tag) => ['TubularComponent', 'Sensor', 'Bend'].includes(tag)
    })
    var jsonObj = parser.parse(text, )
    var components = jsonObj.Tubular.TubularComponent
    var cumLength = 0
    for (let c of components) {
        c.cumLength = cumLength
        cumLength += cunit(c.Len, 'm')
    }
    let bitmap = components.map(c => c.BitRecord)
    let bend = components.find(c => c.Bend)
    let mwdcomp = components.find(c => c.MwdTool && c.MwdTool.Sensor.find(s => s.TypeMeasurement == 'azimuth'))
    let sensor = mwdcomp?.MwdTool.Sensor.find(s => s.TypeMeasurement == 'azimuth')
    return {
        structure: components.map((c, i) => ({
            type: convertBhaElementType(c.TypeTubularComponent),
            description: c.Description,
            // sn: c.customData.numSerial,
            sn: c.NameTag?.Name,
            od: cunit(bitmap[i] ? bitmap[i].DiaBit : c.Od, 'mm'),
            id: cunit(c.Id, 'mm'),
            weight: cunit(c.WtPerLen, 'kg/m') * cunit(c.Len, 'm'),
            length: cunit(c.Len, 'm'),
            material: convertMaterial(c.TypeMaterial)
        })),
        blades: components.filter(c => c.Stabilizer).map(c => ({
            od: cunit(c.Stabilizer.OdBladeMx, 'mm'),
            center_to_bit: cunit(c.Stabilizer.DistBladeBot, 'm') + cunit(c.Stabilizer.LenBlade, 'm') / 2 + c.cumLength,
            length: cunit(c.Stabilizer.LenBlade, 'm'),
        })),
        bend_angle: cunit(bend?.Bend[0].Angle, 'deg'),
        bend_to_bit: cunit(bend?.Bend[0].DistBendBot, 'm') + bend?.cumLength,
        dni_to_bit: sensor ? cunit(sensor.OffsetBot, 'm') + mwdcomp?.cumLength : undefined,
    }
}

export function parseBhaXml(text) {
    try {
        return parseBhaXml14(text)
    } catch (e) {
        return parseBhaXml20(text)
    }
}