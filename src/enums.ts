export const WellTypeValues = { land: 'Land', offshore: 'Offshore' }
export const NorthTypeValues = { true: 'True', grid: 'Grid' }
export const SlideModeValues = { tangent: 'Tangent', curve: 'Curve' }
export const CasingTypeValues = { casing: 'Casing', liner: 'Liner' }
export const TfModeValues = { gtf: 'GTF', mtf: 'MTF' }
export const GeomagValues = { wmm: 'WMM', emm: 'EMM', bggm: 'BGGM', hdgm: 'HDGM', ifr1: 'IFR1', /*ifr2: 'IFR2'*/ }
export const GravityValues = { igf80: 'IGF80', manual: 'Manual' }
export const GridValues = { wgs84: 'WGS 84', manual: 'Manual' }
export const BhaComponentTypeValues = {
    bit: 'Bit', motor: 'Motor', rss: 'RSS', bend_sub: 'BSUB',
    sub: 'SUB', string_stabilizer: 'SS', reamer: 'Reamer/HO', mwd: 'MWD',
    lwd: 'LWD', hwdc: 'HWDC', hwdp: 'HWDP', nmdc: 'NMDC',
    drill_pipe: 'DP', collar: 'DC', jar: 'Jar', other: 'Other'
}
export const MaterialValues = { 
    aluminum: "Aluminum", beryllium_copper: "BeCu",
    chrome_alloy: "Chrome alloy", composite: "Composite",
    other: "Other", nmsteel: "Non-mag steel",
    plastic: "Plastic", steel: 'Steel', 
    steel_alloy: "Steel alloy", titanium: "Titanium"
}
export const RoleValues = {
    null: 'Non-Active User',
    su: 'Supervisor',
    de: 'Drilling Engineer',
    fe: 'Field Engineer',
    cr: 'Client Representative'
}