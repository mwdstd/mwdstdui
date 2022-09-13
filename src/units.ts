import { UnitSystem } from "./types"

const frac0 = {minimumFractionDigits: 0, maximumFractionDigits: 0}
const frac1 = {minimumFractionDigits: 1, maximumFractionDigits: 1}
const frac2 = {minimumFractionDigits: 2, maximumFractionDigits: 2}
const frac3 = {minimumFractionDigits: 3, maximumFractionDigits: 3}
const frac4 = {minimumFractionDigits: 4, maximumFractionDigits: 4}

const unames = {
    'deg': '°',
    'm/s^2': 'm/s²',
    'gn': 'gₙ',
    'mgn': 'mgₙ',
    'gauss': 'G',
    'degC': '°C',
    'degF': '°F',
    'percent': '%',
    'fraction': '-'
}
const skip_space = {
    'deg': true,
    'percent': true
}
const formats = {
    'm': frac2,
    'ft': frac2,
    'mm': frac0,
    'in': frac2,
    'deg': frac2,
    'm/s^2': frac4, 
    'gn': frac4, 
    'mgn': frac1, 
    'nT': frac0,
    'lb': frac0,
    'kg': frac0,
    'ppm': frac0,
    'fraction': frac4,
    'gauss': frac4
}

// unit display name
export function un(uname: string) {
    return unames[uname] ?? uname
}

// header with unit
export function fh(label: string, uname: string) {
    const u = un(uname)
    return u ? `${label}, ${u}` : label
}

// formatted value with unit (with default replacer)
export function fv(value: Number, uname: string, def: string = null) {
    const format = formats[uname] ?? {}
    const val = value?.toLocaleString([], format)
    return val ? `${val}${skip_space[uname] ? '' : ' '}${un(uname)}` : def
}

// formatted value (format depends on unit)
export function fvn(value: Number, uname: string, showSign: boolean = false) {
    const format = formats[uname] ?? {}
    return value?.toLocaleString([], {...format, ...showSign ? {signDisplay: 'always'} : {}})
}

// number format of unit
export function fu(uname: string) {
    return formats[uname] ?? {}
}

// datagrid column shortcut
export function fdg(label: string, uname: string) {
    const format = formats[uname] ?? {}
    return {label: fh(label, uname), format}
}

export function dlsun(us: UnitSystem) {
    return `${un(us.angle)}/${us.dls_interval}${un(us.length)}`
}

// DLS header mockup
export function dlsh(us: UnitSystem) {
    if (us.angle != 'deg') return 'DLS, Unknown'
    return `DLS, °/${us.dls_interval}${un(us.length)}`
}