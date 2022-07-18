import m from 'mithril'
import { Button, Collection, CollectionMode, Select, SmallButton, Tabs } from 'mithril-materialized'
import { latlon, alt, breadcrumbs, actButton, actButtonSm } from './common'
import { fieldClass, descriptionSelector } from './common'
import { NorthTypeValues, GravityValues, GridValues } from '../enums'
import { Stepper } from '../stepper'
import { TextEdit, FloatEdit, EnumEdit } from '../components/common'
import { WellPropertiesCard, addPropertiesColumn } from './properties'
import { GeomagManualValues, GeomagModeValues, isNew, WellEditVm, WellNewVm, WellViewVm } from '../viewmodels/well'
import { UserRole, WellInfo } from '../types'
import { fh } from '../units'


var WellWorkflowView = {
    view: function (vnode: m.Vnode<{ model: WellViewVm }>) {
        var model = vnode.attrs.model
        var obj = model.obj;
        return [
            breadcrumbs(model),
            addPropertiesColumn(
                m('.row',
                    m(Tabs, {
                        tabs: [
                            {
                                title: 'Boreholes', vnode:
                                    m(Collection, {
                                        header: model.newBorehole.hide?.() ? '' : m('.left-align', [
                                            actButton(model.newBorehole),
                                        ]) as unknown as string,
                                        mode: CollectionMode.LINKS,
                                        items: obj.boreholes.map(o => ({ title: o.name + (o.active ? ' (active)' : ''), href: model.child_path(o.id), active: o.active }))
                                    }),

                            },
                        ]
                    }),
                ), WellPropertiesCard(model, obj), obj)
        ]
    }
}

var WellManualView = {
    view: function (vnode: m.Vnode<{ model: WellViewVm }>) {
        var model = vnode.attrs.model
        var obj = model.obj;
        return [
            breadcrumbs(model),
            addPropertiesColumn(
                m(Tabs, {
                    tabs: [
                        {
                            title: 'Boreholes',
                            vnode: m(Collection, {
                                header: model.newBorehole.hide?.() ? '' : m('.right-align', [
                                    actButton(model.importBorehole),
                                    actButton(model.newBorehole, {className: 'left'})
                                ]) as unknown as string,
                                mode: CollectionMode.LINKS,
                                items: obj.boreholes.map((o, i) => ({
                                    title: m('',
                                        m('span', o.name + (o.active ? ' (active)' : '')),
                                        i == obj.boreholes.length - 1 ?
                                            actButtonSm(model.toggleActiveBorehole(o), {style: 'margin-top:-6px', className: 'right blue black-text lighten-4'})
                                            : ''
                                    ),
                                    href: model.child_path(o.id),
                                    active: o.active,
                                }))
                            }),

                        },
                    ]
                }), WellPropertiesCard(model, obj), obj)
        ]
    }
}

export var WellView = {
    view: function (vnode: m.Vnode<{ model: WellViewVm }>) {
        return !vnode.attrs.model?.obj ? [] : m(vnode.attrs.model.obj?.data_mode == 'manual' ? WellManualView : WellWorkflowView, vnode.attrs)
    }
}

var editSteps = (item: WellInfo, model: WellEditVm | WellNewVm) => [
    {
        title: 'Basic information',
        content: [
            m('.row.valign-wrapper', [
                m(TextEdit, {
                    autofocus: true,
                    label: 'Well name',
                    item, field: 'name',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Name used for display and search. Must be unique within pad'),
            ]),
            m('.divider'),
            m('.row',
                m('h6.col.s12', 'Data input mode'),
                // m('h6.col.s6', 'Field engineer'),
                m(EnumEdit, {
                    isRadio: true,
                    required: true,
                    item, field: 'data_mode',
                    className: 'col s6',
                    checkboxClass: 'col s3 btn-tg waves-effect waves-dark',
                    values: { workflow: 'Workflow', manual: 'Manual' }
                }),
                isNew(model) ? 
                m(Select, {
                    placeholder: 'Select field engineer',
                    className: 'col s6',
                    required: true,
                    isMandatory: true,
                    initialValue: null,
                    options: model.fes.map(u => ({id: u.id, label: u.name})), 
                    onchange: (cids) => {model.fe = <string>cids[0]}
                }) : '',
            ),
            m('.divider'),
            m('h6', 'Service features level'),
            m('.row.valign-wrapper',
                m(EnumEdit, {
                    isRadio: true,
                    required: true,
                    item: item,
                    field: 'service_level',
                    className: fieldClass,
                    checkboxClass: 'col s3 btn-tg waves-effect waves-dark',
                    values: {
                        1: 'Level 1',
                        2: 'Level 2',
                        3: 'Level 3',
                    }
                }),
                m(descriptionSelector, m.trust(`
                    <div>
                    <b>Level 1</b> &#8212; MSA
                    </div>
                    <div>
                    <b>Level 2</b> &#8212; MSA + Sag
                    </div>
                    <div>
                    <b>Level 3</b> &#8212; MSA + Sag + HDT
                    </div>
                `))
            ),
        ]
    },
    {
        title: 'Location',
        content: [
            m('p', 'Location data is used in automatic reference calculation'),
            latlon(model.user.us, item, 'Wellhead location'),
            alt(model.user.us, item, 'MSL elevation of wellhead'),
        ]
    },
    {
        title: 'Geodetic info', /*label: '(Optional)',*/
        content: [
            m('.row.valign-wrapper', [
                m(EnumEdit, {
                    label: 'North type',
                    item, field: 'north_type',
                    isRadio: true,
                    required: true,
                    values: NorthTypeValues,
                    className: fieldClass,
                    checkboxClass: 'col s3 btn-tg waves-effect waves-dark',
                }),
                m(descriptionSelector, 'Type of north used in planning and station azimuth representation'),
            ]),
            item.north_type == 'grid' ? m('.row.valign-wrapper', m('.col.m6.s12', [
                m(EnumEdit, {
                    label: 'Grid convergence',
                    item, field: 'grid',
                    isRadio: true,
                    required: true,
                    values: GridValues,
                    className: 'col s6',
                    checkboxClass: 'col s6 btn-tg waves-effect waves-dark',
                }),
                item.grid == 'manual' ?
                    m(FloatEdit, {
                        label: fh('Grid convergence value', model.user.us.angle),
                        item, field: 'grid_value',
                        required: true,
                        className: 'col s6',
                    }) : m('.col.s6')]),
                m(descriptionSelector, 'Automatically calculate grid convergence by location using WGS 84 ellipsoid or specify value manually'),
            ) : '',
        ]
    },
    {
        title: 'Geomag reference',
        content: [
            m('.row.valign-wrapper', [
                m(EnumEdit, {
                    label: 'Gravity reference',
                    item, field: 'grav',
                    isRadio: true,
                    required: true,
                    values: GravityValues,
                    className: 'col s6 m3',
                    checkboxClass: 'col s6 btn-tg waves-effect waves-dark',
                }),
                item.grav == 'manual' ?
                    m(FloatEdit, {
                        label: fh('Gravity value', model.user.us.acceleration),
                        item, field: 'grav_value',
                        required: true,
                        className: 'col s6 m3',
                    }) : m('.col.s6.m3'),

                m(descriptionSelector,
                    'Automatically calculate gravity by latitude using ',
                    m('a', {
                        href: 'https://en.wikipedia.org/wiki/Theoretical_gravity#International_gravity_formula_1980',
                        target: "_blank"
                    }, 'IGF80'),
                    ' or specify value manually'),
            ]),
            m('.row.valign-wrapper', [
                m(EnumEdit, {
                    label: 'Geomagnetic reference model',
                    item: model, field: 'geomode',
                    isRadio: true,
                    required: true,
                    values: GeomagModeValues,
                    className: 'col s6 m3',
                    checkboxClass: 'col s6 btn-tg waves-effect waves-dark',
                }),
                model.geomode == 'manual' ?
                m(EnumEdit, {
                    label: 'Geomagnetic reference model',
                    item: model, field: 'geoval',
                    isRadio: true,
                    required: true,
                    values: GeomagManualValues,
                    className: 'col s6 m3',
                    checkboxClass: 'col s4 btn-tg waves-effect waves-dark',
                }) : m('.col.s6.m3'),
                m(descriptionSelector, m.trust(`
                    <p>
                    <b>Global</b> &#8212; Automatically calculate wellhead reference using WMM model
                    </p>
                    <p>
                    <b>BGGM, HDGM</b> &#8212; Manually provide wellhead reference along trajectory from external model
                    </p>
                    <p>
                    <b>IFR</b> &#8212; Manually provide reference along trajectory from external model
                    </p>
                `)),
            ]),
        ]
    },
]

export var WellNew = {
    view: (vnode: m.Vnode<{ model: WellNewVm }>) => [
        m(Stepper, {
            linear: true,
            steps: [...editSteps(vnode.attrs.model.obj, vnode.attrs.model),
            // {
            //     title: 'Submit',
            //     content: [m('.row.valign-wrapper')
            //         //brief well info, enabled services, question to 
            //     ]
            // },
            ]
        })
    ]
}

export var WellEdit = {
    view: (vnode: m.Vnode<{ model: WellEditVm }>) => !vnode.attrs.model?.obj ? [] : [
        m(Stepper, {
            editMode: true,
            steps: editSteps(vnode.attrs.model.obj, vnode.attrs.model)
        })
    ]
}
