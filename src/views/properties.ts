import m from 'mithril'
import { Button, IMaterialButton } from 'mithril-materialized'
import {Card} from '../components/common'
import {GeomagValues, RoleValues} from '../enums'
import { bhaType } from '../typehelpers'
import { Borehole, Client, OilfieldInfo, PadInfo, Run, UnitSystem, User, Well, WellInfo } from '../types'
import { fv } from '../units'
import { BoreholeViewVm } from '../viewmodels/borehole'
import { ClientViewVm } from '../viewmodels/client'
import { BaseViewVm } from '../viewmodels/common'
import { OilfieldViewVm } from '../viewmodels/oilfield'
import { PadViewVm } from '../viewmodels/pad'
import { RunViewVm } from '../viewmodels/run'
import { TaskVm } from '../viewmodels/tasks'
import { WellViewVm } from '../viewmodels/well'
import { spinner } from './common'

const btnOpts : IMaterialButton = {
    tooltipPostion: "bottom",
    oncreate: ({dom}) => M.Tooltip.init(dom),
    onremove: ({dom}) => M.Tooltip.getInstance(dom)?.destroy(),
    iconClass: 'center',
    style: 'margin: 10px 5px',
}

const operations = (model: BaseViewVm) => m('', model.operations.filter(o => !o.hide?.()).map(
    op => m(Button, {
        ...btnOpts,
        tooltip: op.name, 
        iconName: op.icon, 
        className: op.dangerous ? 'red' : '', 
        disabled: op.disabled?.(),
        onclick: (e) => {op.action(e)},
    })))

const taskButton = (model: TaskVm) => {
    if(!model.authorized) return ''
    let task_running = ['running', 'scheduled'].includes(model.status)
    let status_success = model.status == 'completed'
    let status_error =  ['canceled', 'faulted'].includes(model.status)
    return m(Button, {
            label: model.task_type,
            className: status_success ? 'green' : status_error ? 'red' : '',
            iconName: task_running ? spinner('width: 19.5px;height: 19.5px;margin-top:.5em') as unknown as string : status_success ? 'check' : status_error ? 'error_outline' : 'play_arrow',
            style: 'margin: 10px 5px; width: 100%',
            disabled: task_running,
            onclick: async () => { await model.start() }
        })
} 

const title = (title: string, model: BaseViewVm) => [
    m(m.route.Link, {href: model.path[model.path.length - 2]?.ref ?? '/'}, m('i.material-icons.left', 'arrow_upward')),
    title, 
]

export const UserProperitesCard = (obj: User) => 
    m(Card, {
        className: 'center-align',
        title: '',
        body: [
            m('i.large.material-icons.card-image', 'group'),
            m('br'),
            m('b', obj.name),
            m('br'),
            m('i', RoleValues[obj.role]),
            m('br'),
            m('span', obj.login),
        ],
    })

export const ClientProperitesCard = (model: ClientViewVm, obj: Client) => 
    m(Card, {
        title: title(`${obj.name}`, model),
        body: [
            operations(model),
        ] 
    })


export var OilfieldProperitesCard = (model: OilfieldViewVm, obj: OilfieldInfo) => 
    m(Card, {
        title: title(`Oilfield ${obj.name}`, model),
        body: [
            operations(model),
            m("table", [
                m("tr", [
                    m("th", m("", "Location")),
                    m("td", m("a", { href: `https://www.google.com/maps/search/?api=1&query=${obj.lat},${obj.lon}`, target: "_blank" }, `${fv(obj.lat, model.user.us.angle)}, ${fv(obj.lon, model.user.us.angle)}`)),
                ])
            ])
        ] 
    })

export var PadProperitesCard = (model: PadViewVm, obj: PadInfo) => 
    m(Card, {
        title: title(`Pad ${obj.name}`, model),
        body: [
            operations(model),
            m("table", [
                m("tr", [
                    m("th", m("", "Location")),
                    m("td", m("a", { href: `https://www.google.com/maps/search/?api=1&query=${obj.lat},${obj.lon}`, target: "_blank" }, `${fv(obj.lat, model.user.us.angle)}, ${fv(obj.lon, model.user.us.angle)}`)),
                ]),
                m("tr", [
                    m("th", m("", "Type")),
                    m("td", m("", `${obj.type}`)),
                ]),
                m("tr", [
                    m("th", m("", "Period of operation")),
                    m("td", m("", `${new Date(obj.date_start).toLocaleDateString()} - ${new Date(obj.date_finish).toLocaleDateString()}`)),
                ]),
            ])
        ]
    })

const wellProps = (obj: WellInfo, us: UnitSystem) => [
    m("tr", [
        m("th", m("", "Location")),
        m("td", m("a", { href: `https://www.google.com/maps/search/?api=1&query=${obj.lat},${obj.lon}`, target: "_blank" }, `${fv(obj.lat, us.angle)}, ${fv(obj.lon, us.angle)}`)),
    ]),
    m("tr", [
        m("th", m("", "Ground MSL elevation")),
        m("td", m("", fv(obj.alt, us.length))),
    ]),
    m("tr", [
        m("th", m("", "North type")),
        m("td", m("", `${obj.north_type}`)),
    ]),
    m("tr", [
        m("th", m("", "Geomagnetic reference model")),
        m("td", m("", `${GeomagValues[obj.geomag] ?? 'N/A'}`)),
    ]),
    obj.fes?.length > 0 ? 
        m("tr", [
            m("th", m("", "Assigned Field Engineers")),
            m("td", obj.fes.map(u => m('', u.name))),
        ]) : '',
]

export var WellPropertiesCard = (model: WellViewVm, obj: Well) => 
    m(Card, {
        title: title(`Well ${obj.name}`, model),
        // className: `${obj.data_mode == 'manual' ? 'yellow' : 'green'} lighten-4`,
        body: [
            operations(model),
            // taskButton(model.decunc),
            m("table", [
                m("tr", [
                    m("th", m("", "Client")),
                    m("td", m("", `${obj.client.name}`)),
                ]),
                m("tr", [
                    m("th", m("", "Name")),
                    m("td", m("", `${obj.name}`)),
                ]),
                wellProps(obj, model.user.us)
            ])
        ]
    })

export var BoreholePropertiesCard = (model: BoreholeViewVm, obj: Borehole) => 
    m(Card, {
        title: title(`Borehole ${obj.name}`, model),
        body: [
            operations(model),
            taskButton(model.correction),
            m(m.route.Link, {
                href: `/borehole/${obj.id}/report`, 
                target: '_blank',
                className: 'btn',
                style: 'margin: 10px 5px; width: 100%',
            }, m('', m('i.left.material-icons', 'summarize'), 'Report')),
            m("table", [
                m("tr", [
                    m("th", m("", "Client")),
                    m("td", m("", `${obj.client.name}`)),
                ]),
                m("tr", [
                    m("th", m("", "Name")),
                    m("td", m("", `${obj.name}`)),
                ]),
                wellProps(obj.well, model.user.us),
                m("tr", [
                    m("th", m("", "RKB Elevation")),
                    m("td", m("", fv(obj.rkb_elevation, model.user.us.length))),
                ]),
                m("tr", [
                    m("th", m("", "Start date")),
                    m("td", m("", `${new Date(obj.start_date).toLocaleDateString()}`)),
                ]),
            ])
        ]
    })

export var RunPropertiesCard = (model: RunViewVm, obj: Run, show_buttons: boolean = true) =>
{
    const us = model.user.us
    const hr = obj?.head_ref
    return m(Card, {
        title: title(`Run ${obj.name}`, model),
        body: [
            ...show_buttons ? [
            operations(model),
            taskButton(model.correction)] : [],
            m("table", [
                m("tr", [
                    m("th", m("", "Client")),
                    m("td", m("", `${obj.client.name}`)),
                ]),
                m("tr", [
                    m("th", m("", "Name")),
                    m("td", m("", `${obj.name}`)),
                ]),
                m("tr", [
                    m("th", m("", "North type")),
                    m("td", m("", `${obj.well.north_type}`)),
                ]),        
                m("tr", [
                    m("th", m("", "G")),
                    m("td", m("", fv(hr?.g, us.acceleration))),
                ]),        
                m("tr", [
                    m("th", m("", "B")),
                    m("td", m("", fv(hr?.b, us.magind, 'Calculating...'))),
                ]),        
                m("tr", [
                    m("th", m("", "Dip")),
                    m("td", m("", fv(hr?.dip, us.angle, 'Calculating...'))),
                ]),        
                m("tr", [
                    m("th", m("", "Declination")),
                    m("td", m("", fv(hr?.dec, us.angle, 'Calculating...'))),
                ]),        
                m("tr", [
                    m("th", m("", "Grid")),
                    m("td", m("", fv(hr?.grid, us.angle))),
                ]),        
                obj.geometry ? m("tr", [
                    m("th", m("", "Hole size")),
                    m("td", m("", fv(obj.geometry?.slice(-1)[0]?.hole_diameter, us.diameter))),
                ]) : '',        
                obj.bha.structure?.[0]?.od ? m("tr", [
                    m("th", m("", "Bit OD")),
                    m("td", m("", fv(obj.bha.structure[0]?.od, us.diameter))),
                ]) : '',
                model.checkTag('bha') ? m("tr", [
                    m("th", m("", "BHA type")),
                    m("td", m("", bhaType(obj.bha))),
                ]) : '',        
                model.checkTag('mud_weight') != null ? 
                    m("tr", [
                        m("th", "Mud weight"),
                        m("td", fv(obj.mud_weight, us.density)),
                    ])
                : '',
                ])
            ]

        }
    )
}

export const modeIndicator = (mode?: {data_mode: string, maintenance_mode: boolean}, className?: string) => {
    if (!mode) return null
    let cls = className ? `.${className}` : ''
    if (mode.maintenance_mode)
        return m(`${cls}.imode.red.lighten-4`, m('i.left.material-icons', 'construction'), 'Maintenance mode')
    if (mode.data_mode == 'manual')
        return m(`${cls}.imode.blue.lighten-4`, m('i.left.material-icons', 'engineering'), 'Manual mode')
    return m(`${cls}.imode.green.lighten-4`, m('i.left.material-icons', 'precision_manufacturing'), 'Workflow mode')
}

export const addPropertiesColumn = (tab: m.Children, props: m.Children, mode?: {data_mode: string, maintenance_mode: boolean}) =>
    [
        modeIndicator(mode, 'bcr'),
        m('.row', m('.col.l3', props), m('.row.col.l9', tab))
    ]
    
