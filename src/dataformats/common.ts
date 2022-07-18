import {create, createUnitDependencies, unitDependencies} from 'mathjs'
const {createUnit, unit} = create({createUnitDependencies, unitDependencies} )

createUnit('dega', '1 deg')


export function cunit(tag: any, target: string) {
    if(!tag) return undefined
    return unit(tag.value, tag["@_uom"]).toNumber(target)
}

export function convertArray(arr: number[], uFrom: string, uTo: string) {
    return arr.map(v => unit(v, uFrom).toNumber(uTo))
}

export function convertibleTo(uFrom: string, uTo: string) {
    return unit(uFrom).equalBase(unit(uTo))
}
