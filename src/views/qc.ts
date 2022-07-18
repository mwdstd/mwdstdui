import m from 'mithril'
import { QaFlagVm, QaGroupVm } from '../viewmodels/qc'


const tileOpts = {
    tooltipPostion: "bottom",
    oncreate: ({dom}) => M.Tooltip.init(dom),
    onremove: ({dom}) => M.Tooltip.getInstance(dom)?.destroy(),
}

const colors = {
    0: 'grey lighten-1',
    1: 'green',
    2: 'yellow',
    3: 'red'
}

const colGroup = (group: QaGroupVm) => ({
    ...group.issues.length > 0 ? tileOpts : {}, 
    'data-tooltip': `<ul>${group.issues.map(is => `<li>${is}</li>`).join('')}</ul>`, 
    className: colors[group.result]
})

const gyr = (flag: QaFlagVm) => ({
    ...flag.message_template ? tileOpts : {}, 
    'data-tooltip': flag.message_template, 
    className: colors[flag.result]
})

const tileSel = '.col.s1.center-align.lighten-4'

export const qc_group_tiles = (htileSel: string, qc: QaGroupVm[]) =>
    qc.map(g => m(htileSel, colGroup(g), g.mnemonic))

    
export const qc_flags = (qc: QaGroupVm[], hs: string = 'b.col.s3', ts: string = tileSel) => {
    return m('', qc.map(g => m('.row', 
        m(hs, g.display_name), 
        g.flags.map(f => m(ts, gyr(f), f.mnemonic))
    )))
}
