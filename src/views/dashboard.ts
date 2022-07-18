import m from 'mithril'
import { Tabs } from 'mithril-materialized';
import { TaskStatus, UserRole } from '../types';
import { dlsh, fh, fvn } from '../units';
import { DashboardVm } from '../viewmodels/dashboard';
import { breadcrumbs } from './common';
import { qc_group_tiles } from './qc';


const htileSel = '.col.l1.m2.red.center-align.lighten-4.black-text'

const qcTrueFalseR = {true: 'green', false: 'red'}
const qcTrueFalseY = {true: 'green', false: 'yellow'}

const highlightGR = (qc) => ({
    className: 'lighten-4 ' + qcTrueFalseR[qc] 
})
const highlightGY = (qc) => ({
    className: 'lighten-4 ' + qcTrueFalseY[qc] 
})

function taskStatus(model: DashboardVm, task_id: string) {
    let task = model.bhTasks[task_id]
    if (!task) return ''
    switch(task.status) {
        case TaskStatus.scheduled:
        case TaskStatus.running:
            return m('i.material-icons.orange-text', 'watch_later')
        case TaskStatus.faulted:
            return m('i.material-icons.red-text', 'error')
        case TaskStatus.completed:
            return m('i.material-icons.green-text', 'task_alt')
        }
    return '!!!'
}

function noDataReason(model: DashboardVm, task_id: string) {
    let task = model.bhTasks[task_id]
    var message = 'No correction data'
    if (!task) return message
    switch(task.status) {
        case TaskStatus.scheduled:
        case TaskStatus.running:
            return 'Calculating...'
        case TaskStatus.faulted:
            return 'Correction error'
        }
    return message
}


export const DashboardView = {
    view: function (vnode: m.Vnode<{model: DashboardVm}>) {
        const model = vnode.attrs.model;
        const us = model.user.us
        return m('', model.items.map(o => m('.row.section', {style: 'border: 1px solid #e0e0e0; margin-bottom: 0px'},
        m('.col.s12', 
            m(m.route.Link, {
                href: `/run/${o.run_id}`,
                className: 'col l6',
            }, m('b', o.name)),
            m('.col.s1.center-align', taskStatus(model, o.bh_id)), 
            qc_group_tiles(htileSel, o.qa.groups),
        ),
        o.no_correction ? 
            m('.col.s12.center-align', {style: 'margin-bottom:30px;margin-top:30px;font-size:small'}, 
                noDataReason(model, o.bh_id)
            ) : 
            [
                m('.col.s4.center-align', {style: 'font-size:small'},
                m('b.col.s12', {style: 'border-bottom: 1px solid'}, 'Last survey'),
                m('.col.s3', m('b', fh('MD', us.length)), m('', fvn(o.last?.md, us.length))),
                m('.col.s3', m('b', fh('Inc', us.angle)), m('', fvn(o.last?.inc, us.angle))),
                m('.col.s3', m('b', fh('Az', us.angle)), m('', fvn(o.last?.az, us.angle))),
                m('.col.s3', m('b', dlsh(us)), m('', fvn(o.last?.dls, us.angle))),
                m('.col.s12[style=padding:0px]',
                    m('b.col.s3', 'QC'),
                    m('.col.s3', highlightGR(o.last?.qc_pass?.g), 'Total G'),
                    m('.col.s3', highlightGR(o.last?.qc_pass?.b), 'Total B'),
                    m('.col.s3', highlightGR(o.last?.qc_pass?.dip), 'Dip'),
                ),
            ),
            m('.col.s8.center-align', {style: 'font-size:small'},
                o.deepest ? [
                    m('b.col.s12', {style: 'border-bottom: 1px solid'}, 'Plan deviation at total depth'),
                    m('.col.s6[style=padding:0px]',
                        m('.col.s3', m('b', fh('TD', us.length)), m('', fvn(o.deepest?.md, us.length))),
                        m('.col.s3', m('b', fh('TVD', us.length)), m('', fvn(o.deepest?.tvd, us.length))),
                        m('.col.s3', m('b', fh('NS', us.length)), m('', fvn(o.deepest?.ns, us.length))),
                        m('.col.s3', m('b', fh('EW', us.length)), m('', fvn(o.deepest?.ew, us.length))),
                    ),
                    m('.col.s6[style=padding:0px]',
                        m('.col.s3', m('b', fh('dInc', us.angle)), m('', fvn(o.plan_dev?.inc, us.angle))),
                        m('.col.s3', m('b', fh('dAz', us.angle)), m('', fvn(o.plan_dev?.az, us.angle))),
                        m('.col.s3', m('b', fh('dTVD', us.length)), m('', fvn(o.plan_dev?.tvd, us.length))),
                        m('.col.s3', m('b', fh('dH', us.length)), m('', fvn(o.plan_dev?.dh, us.length))),
                    ),
                    m('.col.s8.left-align', `Plan revison ${o.plan?.revision}${o.plan?.uploaded? ` (${new Date(o.plan?.uploaded).toLocaleString()})`: ''}`),
                ] : 
                m('', {style: 'margin-bottom:30px;margin-top:30px;'}, !o.plan || o.plan?.length < 1 ? 'No plan provided' : 'No good surveys')
            ),
        ],

        m('', {style: 'position:relative; right:10px; bottom: 0px'},
            m(m.route.Link, {
                href: `/borehole/${o.bh_id}/report`, 
                target: '_blank',
                className: 'right',
                // style: 'margin: 10px 0px;',
            }, m('', m('i.right.material-icons', 'summarize'), )), //'Generate report'
            model.user.role != UserRole.CR ? 
            m(m.route.Link, {
                href: `/control/${o.run_id}`, 
                className: 'right',
                // style: 'margin: 10px 0px;',
            }, m('', m(`i.right.material-icons${o.maintenance_mode ? '.red-text' : ''}`, 'construction'), )) //'Troubleshooting'
            : '',
        )
    )))
    }
}

export const DashboardPage = {
    view: function (vnode: m.Vnode<{model: DashboardVm}>) {
        let model = vnode.attrs.model;
        return [
            breadcrumbs(model),
            m(Tabs, {
                tabs: [
                    { 
                        title: 'Active runs', 
                        vnode: m(DashboardView, {model})
                    }
                ]
            }),
        ]
    }
}
