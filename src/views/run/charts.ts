import m from 'mithril'
import { ChartCmp, IChartSeries, IChartType } from '../../chart'
import { Run, UnitSystem } from '../../types'
import { fh } from '../../units'

export const colors = {
    raw: 'red',
    corrected: 'green',
    ci: 'blue',
    hd: '#006363',
    fac: 'rgba(54, 162, 235, 0.5)'
}

const getChartOptions = (title: string) => ({
    title: {text: title, align: 'left' as 'left'},
})

export const gChartOptions = (us: UnitSystem) => getChartOptions(fh('G', us.acceleration))
export const bChartOptions = (us: UnitSystem) => getChartOptions(fh('B', us.magind))
export const dipChartOptions = (us: UnitSystem) => getChartOptions(fh('Dip', us.angle))
export const incChartOptions = (us: UnitSystem) => getChartOptions(fh('Inc', us.angle))
export const azChartOptions = (us: UnitSystem) => getChartOptions(fh('Az', us.angle))

const getFac = (run: Run, yfield: string) : IChartSeries[] => {
    if (!run.stations || 
        run.stations.length == 0 || 
        !run.correction?.result || 
        !run.correction.result.surveys?.[0]?.max) return []
    return [{
        label: 'QC',
        type: <IChartType>'band',
        color: colors.fac,
        data: run.correction.result.surveys.map((s, i) => ({
            x: s.md,
            l: s.min[yfield],
            u: s.max[yfield],
        }))
    }]
}

const getQc = (run: Run, yfield: string) : IChartSeries[] => {
    if (!run.stations || 
        run.stations.length == 0 || 
        !run.correction?.result) return []
    return [{
        label: 'QC',
        type: <IChartType>'band',
        color: colors.fac,
        data: run.correction.result.surveys.filter(s => s?.min?.az !== null).map((s, i) => ({
            x: s.md,
            l: Math.max(s.min[yfield], 0),
            u: Math.min(s.max[yfield], 360),
        }))
    }]
}

const getChartSeries = (run: Run, yfield: string, flt: (s, i) => boolean = () => true) : IChartSeries[] => [
    ...run.stations ?[
    {
        label: 'Raw',
        type: <IChartType>'dots',
        color: colors.raw,
        data: run.stations.filter(flt).map((s: any) => ({x: <Number>s.md, y: <Number>s[yfield]}))
    },
    ]:[], 
    ...run.correction?.result?.stations ?[{
        label: 'Corrected',
        type: <IChartType>'dots',
        color: colors.corrected,
        data: run.correction.result.stations.filter(flt).filter((s: any) => s[yfield] !== undefined).map((s: any) => ({x: s.md, y: s[yfield]}))
    }]:[], 
]

export var ChartsTab = (run: Run, us: UnitSystem) => m('.row',
    m(ChartCmp, { className:'col s12', ...gChartOptions(us), series: [...getChartSeries(run, 'tg'), ...getFac(run, 'g')]}),
    m(ChartCmp, { className:'col s12', ...bChartOptions(us), series: [...getChartSeries(run, 'tb'), ...getFac(run, 'b')]}),
    m(ChartCmp, { className:'col s12', ...dipChartOptions(us), series: [...getChartSeries(run, 'dip'), ...getFac(run, 'dip')]}),
    m(ChartCmp, { className:'col s12', ...incChartOptions(us), 
        series: [...getChartSeries(run, 'inc'), 
        ...run.correction?.result?.stations_hd ?[{
            label: 'HD',
            type: <IChartType>'line',
            color: colors.hd,
            data: run.correction.result.stations_hd.map((s: any) => ({x: <Number>s.md, y: <Number>s.inc}))
        }]:[],
        ...run.ci ?[{
            label: 'CI',
            type: <IChartType>'line',
            color: colors.ci,
            data: run.ci.map(s => ({x: <Number>s.md, y: <Number>s.inc}))
        }]:[], 
        ...getQc(run, 'inc')
    ]
    }),
    m(ChartCmp, { className:'col s12', ...azChartOptions(us), series: [
        ...getChartSeries(run, 'az'),
        ...run.correction?.result?.stations_hd ?[{
            label: 'HD',
            type: <IChartType>'line',
            color: colors.hd,
            data: run.correction.result.stations_hd.map((s: any) => ({x: s.md, y: s.az}))
        }]:[],
        ...getQc(run, 'az')
    ]}),
)
