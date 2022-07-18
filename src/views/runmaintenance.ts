import m from 'mithril'
import { Button, Collapsible, Select, Tabs } from 'mithril-materialized'
import { ChartCmp, IChartSeries, IChartType } from '../chart'
import { BhaView } from '../components/bha'
import { BoolEdit, EnumEdit, FloatEdit } from '../components/common'
import { breadcrumbs } from './common'
import { azChartOptions, bChartOptions, ChartsTab, colors, dipChartOptions, gChartOptions, incChartOptions } from './run/charts'
import { CiTab } from './run/ci'
import { GeometryTab } from './run/geometry'
import { PlanView } from './run/plan'
import { SurveysTab } from './run/surveys'
import { qc_flags, qc_group_tiles } from './qc'
import { fh, fu, fv, fvn } from '../units'
import { NorthTypeValues } from '../enums'
import { qcColors } from '../components/stations'
import { RunMaintenanceVm } from '../viewmodels/runmaintenance'
import { modeIndicator } from './properties'

const htileSel = '.col.s2.red.center-align.lighten-4.black-text'

const term_row = (model: RunMaintenanceVm, term: string, unit: string = null) =>
    m('tr', 
        m('td', fh(term, unit)),
        model.status_msa ? 
        [
            m('td.right-align', fvn(model.opts.dni_cs?.[term], unit)),
            m('td.right-align', fvn(model.obj.correction?.result?.apst_unc?.[term], unit)),
        ] : [
            m('td.right-align[colspan=2]', 
                model.maintenance_mode ?
                m(FloatEdit, {
                    item: model.opts.dni_cs,
                    field: term,
                    onchange: async (v) => {
                        model.invalidate()
                        model.manualCorrection()
                    },
                    format: fu(unit),
                    className: 'strip-input',
                }) : fvn(model.opts.dni_cs?.[term], unit)
            )
        ]
    )

const ref_term_row = (model: RunMaintenanceVm, term: string, unit: string = null) =>
    model.status_msa ? m('tr', 
        m('td', fh(term.toUpperCase(), unit)),
        [
            m('td.right-align', fvn(model.obj?.correction?.result?.ref_cs?.[term], unit)),
            m('td.right-align', fvn(model.obj?.correction?.result?.ref_unc?.[term], unit)),
        ]
    ) : ''

const corr_table = (model: RunMaintenanceVm) => m('',
    m('table', 
        m('colgroup',
            m('col'),
            m('col', {style: 'width: 23.75%'}),
            m('col', {style: 'width: 23.75%'}),
        ),
        m('thead', 
            m('th', 'Term'),
            m('th.right-align', model.status_msa ? 'Value' : ''),
            m('th.right-align', model.status_msa ? 'Uncertainty' : 'Value'),
        ),
        m('tbody', 
            term_row(model, 'ABX', model.user.us.acceleration),
            term_row(model, 'ABY', model.user.us.acceleration),
            term_row(model, 'ABZ', model.user.us.acceleration),
            term_row(model, 'ASX', model.user.us.ratio_fine),
            term_row(model, 'ASY', model.user.us.ratio_fine),
            term_row(model, 'ASZ', model.user.us.ratio_fine),
            term_row(model, 'MBX', model.user.us.magind),
            term_row(model, 'MBY', model.user.us.magind),
            term_row(model, 'MBZ', model.user.us.magind),
            term_row(model, 'MSX', model.user.us.ratio_fine),
            term_row(model, 'MSY', model.user.us.ratio_fine),
            term_row(model, 'MSZ', model.user.us.ratio_fine),
            term_row(model, 'MXY', model.user.us.angle),
            term_row(model, 'MXZ', model.user.us.angle),
            term_row(model, 'MYZ', model.user.us.angle),
            ref_term_row(model, 'g', model.user.us.acceleration),
            ref_term_row(model, 'b', model.user.us.magind),
            ref_term_row(model, 'dip', model.user.us.angle),
        )
    )
)

const filter_table = (model: RunMaintenanceVm) => m('',
    m(Button, {label: 'All', style: 'margin: 10px 5px; width: 90px', onclick: () => model.selectAll(), disabled: !model.maintenance_mode}),
    m(Button, {label: 'Good', style: 'margin: 10px 5px; width: 90px', onclick: () => model.selectGood(), disabled: !model.maintenance_mode}),
    m('table', 
        m('colgroup',
            m('col', {style: 'width: 5%'}),
            m('col', {style: 'width: 23.75%'}),
            m('col', {style: 'width: 23.75%'}),
            m('col', {style: 'width: 23.75%'}),
            m('col', {style: 'width: 23.75%'}),
        ),
        m('thead', m('tr', 
            m('th', ''),
            m('th.right-align', fh('MD', model.user.us.length)),
            m('th.right-align', fh('G', model.user.us.acceleration)),
            m('th.right-align', fh('B', model.user.us.magind)),
            m('th.right-align', fh('Dip', model.user.us.angle)),
        )),
        m('tbody',
            model.raw_stations.map((s, i) => m('tr.lighten-4', 
                {className: qcColors[s.qc] || ''},
                m('td', m(BoolEdit, {
                    item: model.opts.filter, 
                    field: i, 
                    label: m('span'), 
                    checked: true, 
                    onchange: ()=> model.invalidate(),
                    disabled: !model.maintenance_mode
                })),
                m('td.right-align', fvn(s.md, model.user.us.length)),
                m('td.right-align', fvn(s.tg, model.user.us.acceleration)),
                m('td.right-align', fvn(s.tb, model.user.us.magind)),
                m('td.right-align', fvn(s.dip, model.user.us.angle)),
            ))
        )
    )
)

export const getChartSeries = (model: RunMaintenanceVm, yfield: string, flt: (s, i) => boolean = () => true) : IChartSeries[] => [
    ...model.obj?.stations ?[
    {
        label: 'Raw',
        type: <IChartType>'dots',
        color: colors.raw,
        data: [
            ...model.runs.map(r => r.stations).filter(ss => ss.length > 0), 
            model.obj.stations.filter(flt)
        ].slice(-model.show_runs_count).flat().map((s: any) => ({x: <Number>s.md, y: <Number>s[yfield]}))
    },
    ]:[], 
    ...true ?[{
        label: 'Corrected',
        type: <IChartType>'dots',
        color: colors.corrected,
        data: [
            ...model.runs.filter(r => r.stations.length > 0), 
            model.obj
        ].slice(-model.show_runs_count).filter(r => r.correction?.result).map(r => r.correction.result?.stations).flat().filter((s: any) => s[yfield] !== undefined).map((s: any) => ({x: s.md, y: s[yfield]}))
    }]:[], 
]

const getFac = (model: RunMaintenanceVm, yfield: string) : IChartSeries[] => {
    return [{
        label: 'QC',
        type: <IChartType>'band',
        color: colors.fac,
        data: [...model.runs.filter(r => r.stations.length > 0), model.obj].slice(-model.show_runs_count).map(r => {
            if(!r.correction?.result?.surveys?.[0]?.max)
                return []
            return r.correction.result.surveys.map((s, i) => ({
                x: s.md,
                l: s.min[yfield],
                u: s.max[yfield],
            }))
        }).flat()
    }]
}

const getQc = (model: RunMaintenanceVm, yfield: string) : IChartSeries[] => {
    return [{
        label: 'QC',
        type: <IChartType>'band',
        color: colors.fac,
        data: [...model.runs.filter(r => r.stations.length > 0), model.obj].slice(-model.show_runs_count).map(r => {
            return r.correction?.result ? r.correction.result.surveys.filter(s => s?.min?.az !== null).map((s, i) => ({
                    x: s.md,
                    l: Math.max(s.min[yfield], 0),
                    u: Math.min(s.max[yfield], 360),
                })) : []
        }).flat()
    }]

}

const CorrectionTab = (model: RunMaintenanceVm) => m('',
    m('.row', {style: "margin-top: 1em"},
        m(BoolEdit, {
            label: 'Correction mode',
            item: model, field: 'status_msa', 
            disabled: !model.maintenance_mode,
            labelFalse: 'Manual', labelTrue: 'MSA', 
            isRadio: true, className: 'col l2 m4', checkboxClass: 'col s6 btn-tg waves-effect waves-dark',
            onchange: () => model.invalidate()
        }),
        m(EnumEdit, {
            label: 'Multi mode',
            item: model, field: 'msa_multi', 
            values: {'off': 'off', 'on': 'on', 'auto': 'auto'}, 
            disabled: !model.maintenance_mode || !model.status_msa,
            isRadio: true, className: 'col l2 m4', 
            checkboxClass: 'col s4 btn-tg waves-effect waves-dark',
            onchange: () => model.invalidate()
        }),
        m('.col.l2.m4', m(Select, {
            label: 'Show last # runs',
            className: '',
            initialValue: model.show_runs_count,
            options: Array.from({length: model.nonempty_runs_count}, (o, i) => ({id: i + 1, label: `${i+1}`})),
            onchange: (value) => {
                model.show_runs_count = Number(value)
                m.redraw()
            },
        })),
        m('.col.l4.m8', {style: 'padding-top: 1em'},
            m(Button, {
                label: 'Calculate', 
                className: 'col s4',
                style: 'margin: 10px 5px; width: 120px', 
                disabled: !model.dirty,
                onclick: () => model.calculate()
            }),
            m(Button, {
                iconName: 'refresh', label: 'Reset', 
                className: 'col s4',
                style: 'margin: 10px 5px; width: 120px', 
                disabled: !model.hasChanges,
                onclick: () => model.reset()
            }),
        ),
        m('.col.l2.m4', ),

    ),
    
    m('.col.s4', m(Collapsible, {
        items: [
            {
                header: 'Correction values',
                body: corr_table(model),
            },
            {
                header: 'Survey filtering',
                body: filter_table(model),
            },
            ...model.obj.correction ? 
            [{
                header: m('', {style: 'width: 100%'}, 
                    m('.col.s1[style=padding:0px]', ''), 
                    // m('.col.s3[style=padding:0px]', 'QC flags'), 
                    qc_group_tiles(htileSel, model.qa.groups)
                ),
                body: qc_flags(model.qa.groups, 'b.col.s12', '.col.s3.center-align.lighten-4')
            }] : []
        ]
    })),
    m('.col.s8',
        m(Tabs, {
            tabs: [
                {
                    title: 'B/Dip/Az',
                    vnode: m('',
                        m(ChartCmp, { className:'col s12', ...bChartOptions(model.user.us), series: [...getChartSeries(model, 'tb', (s, i) => model.opts.filter[i]), ...getFac(model, 'b')]}),
                        m(ChartCmp, { className:'col s12', ...dipChartOptions(model.user.us), series: [...getChartSeries(model, 'dip', (s, i) => model.opts.filter[i]), ...getFac(model, 'dip')]}),
                        m(ChartCmp, { className:'col s12', ...azChartOptions(model.user.us), series: [...getChartSeries(model, 'az', (s, i) => model.opts.filter[i]), ...getQc(model, 'az')]}),
                    )
                },
                {
                    title: 'G/Inc',
                    vnode: m('',
                        m(ChartCmp, { className:'col s12', ...gChartOptions(model.user.us), series: [...getChartSeries(model, 'tg', (s, i) => model.opts.filter[i]), ...getFac(model, 'g')]}),
                        m(ChartCmp, { className:'col s12', ...incChartOptions(model.user.us), series: [...getChartSeries(model, 'inc', (s, i) => model.opts.filter[i]), ...getQc(model, 'inc')]
                    }),
                    )
                }
            ]

        }),
    ),
)

const propsLine = (model: RunMaintenanceVm) => m('.row', 
    m('.col.s2', m('b', 'North type: '), `${NorthTypeValues[model.obj.well.north_type]}`),
    m('.col.s2', m('b', 'G: '), fv(model.obj.well.grav_value, model.user.us.acceleration)),
    m('.col.s2', m('b', 'B: '), fv(model.obj?.head_ref?.b, model.user.us.magind, '-')),
    m('.col.s2', m('b', 'Dip: '), fv(model.obj?.head_ref?.dip, model.user.us.angle, '-')),
    m('.col.s2', m('b', 'Dec: '), fv(model.obj?.head_ref?.dec, model.user.us.angle, '-')),
    m('.col.s2', m('b', 'Grid: '), fv(model.obj.well.grid_value, model.user.us.angle)),
)

export const RunMaintenanceView = {
    view: function (vnode: m.Vnode<{model: RunMaintenanceVm}>) {
        let model = vnode.attrs.model;
        let obj = model.obj;
        return [
            breadcrumbs(model),
            m('.bcr', 
                modeIndicator(model.obj.well),
                model.maintenance_mode ? 
                    m(Button, {label: 'Save & Exit', disabled: model.dirty,  onclick: () => model.submit()}) :
                    m(Button, {label: 'Maintenance', onclick: () => model.setMaintenaceMode()})
            ),
            propsLine(model),
            m(Tabs, {
                tabs: [
                    {
                        title: 'Correction',
                        vnode: CorrectionTab(model)
                    },
                    {
                        title: 'Surveys',
                        vnode: SurveysTab(model.obj, model, false)
                    },
                    ...model.checkTag('ci') ? [
                        {
                        title: 'CI',
                        vnode: CiTab(model, false),
                    },
                    ] : [],
                    {
                        title: 'Charts',
                        vnode: ChartsTab(model.obj, model.user.us),
                    },
                    ...model.checkTag('bha') ? [
                    {
                        title: 'BHA',
                        vnode: m.fragment({}, [
                            m(BhaView, {bha: obj.bha, us: model.user.us})
                        ])
                    }] : [],
                    ...obj.geometry && obj.geometry.length > 0? [
                    {
                        title: 'Wellbore geometry',
                        vnode: GeometryTab(obj, model, false)
                    }] : [],
                    {
                        title: 'Plan',
                        vnode: PlanView(model, false),
                    },
                ]
            }),
        ]
    }
}