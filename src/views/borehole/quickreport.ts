import m from 'mithril'
import { Collapsible } from 'mithril-materialized'
import { Card } from '../../components/common'
import { zip } from '../../utils'
import { BoreholeViewVm } from '../../viewmodels/borehole'
import { messageCard, TrajectoryLegsCard } from '../common'


export var QuickReportView = {
    view: function (vnode: m.Vnode<{model: BoreholeViewVm}>) {
        var model = vnode.attrs.model
        var obj = model.obj;
        if (!obj) return []
        return m('.row', [
            m('.row.col.s12',
                obj.runs.filter(r => r.correction?.result).length < 1 ? 
                messageCard('Please, run correction to see results') : [
                m('.col.s6',
                    TrajectoryLegsCard(
                        model.user.us, 'Trajectory', 
                        [
                            ...obj.runs.filter(r => r.correction?.result).map(r => ({
                                name: r.name, 
                                stations: r.correction.result.stations.filter((s, i) => r.correction.result.surveys[i].qc == 0),
                            }))
                        ]
                    ),
                ),
                m('.col.s6',
                    m(Card, {
                        className: 'z-depth-0',
                        title: 'Issues',
                        body: model.issues.filter(iss => iss.length > 0).length > 0 ? m(Collapsible, {
                            accordion: false,
                            items: zip(obj.runs, model.issues).filter(([r, iss]) => iss.length > 0).map(([r, issues]) => {
                                return {
                                    header: m.fragment({}, [m('i.material-icons.orange-text', 'warning'), r.name, m('span.badge.new[data-badge-caption=""]', issues.length)]),
                                    body: m('ul.browser-default', issues.map(is => m('li', is)))
                                }
                            })
                        }) : m('.card-panel.valign-wrapper', 
                            {style: 'height:100px;justify-content:center;'}, 
                            m('.center-align', 'No issues detected')
                        ),
                    })
                )
                ]
            ),
        ])
    }
}