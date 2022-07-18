import m from 'mithril'
import { Tabs } from 'mithril-materialized'
import { CorStationsGrid } from '../components/stations'
import { GeomagValues, NorthTypeValues } from '../enums'
import { dlsh, fh, fv, fvn } from '../units'
import { ReportVm } from '../viewmodels/report'
import { qc_group_tiles } from './qc'

export const ReportView = { 
    view(vnode: m.Vnode<{model: ReportVm}>) {
        const date = new Date()
        const bh = vnode.attrs.model.obj
        const model = vnode.attrs.model
        const us = model.user.us
        const htile = 'b.col.s6.m4'
        const vtile = '.col.s6.m8'
        return m('', 
            m('h5.center-align', `${bh.well.name} Report`),
            m('h6.center-align', `${bh.field.name} ${bh.pad.name}`),
            m('.row',
                m('.col.l6.m12', m('',
                    m(htile, 'Report date'), 
                    m(vtile, `${date.toLocaleString()}`),
                    m(htile, 'Customer'), 
                    m(vtile, `${bh.client.name}`),
                    m(htile, 'Oilfield'), 
                    m(vtile, `${bh.field.name}`),
                    m(htile, 'Pad'), 
                    m(vtile, `${bh.pad.name}`),
                    m(htile, 'Well'), 
                    m(vtile, `${bh.well.name}`),
                    m(htile, 'Borehole'), 
                    m(vtile, `${bh.name}`),
                    m(htile, 'Plan'), 
                    m(vtile, `${bh.last_plan?.revision}`),
                    m(htile, 'Latitude / Longitude'), 
                    m(vtile, `${fv(bh.well.lat, us.angle)} / ${fv(bh.well.lon, us.angle)}`),
                    m(htile, 'Grid convergence used'), 
                    m(vtile, fv(bh.well.grid_value, us.angle)),
                )), m('.col.l6.m12', m('',
                    m(htile, 'TVD reference elevation'), 
                    m(vtile, fv(bh.rkb_elevation + bh.well.alt, us.length)),
                    m(htile, 'Seabed/ground elevation'), 
                    m(vtile, fv(bh.well.alt, us.length)),
                    m(htile, 'Magnetic declination'), 
                    m(vtile, fv(bh.ref_head.dec, us.angle)),
                    m(htile, 'Magnetic field intensity'), 
                    m(vtile, fv(bh.ref_head.b, us.magind)),
                    m(htile, 'Magnetic dip'), 
                    m(vtile, fv(bh.ref_head.dip, us.angle)),
                    m(htile, 'Magnetic reference date'), 
                    m(vtile, `${new Date(bh.start_date).toLocaleDateString()}`),
                    m(htile, 'Geomagnetic model'), 
                    m(vtile, `${GeomagValues[bh.well.geomag]}`),
                    m(htile, 'North type'), 
                    m(vtile, `${NorthTypeValues[bh.well.north_type]}`),
                    m(htile, `Total north correction (Magnetic -> ${NorthTypeValues[bh.well.north_type]})`), 
                    m(vtile, fv(bh.ref_head.dec - bh.well.grid_value, us.angle)),
                ))
            ),
            m(Tabs, {
                tabs: [
                    {
                        title: 'Trajectory',
                        vnode: m('table',
                            m('thead', m('tr', 
                                m('th.right-align', fh('MD', us.length)),
                                m('th.right-align', fh('Inc', us.angle)),
                                m('th.right-align', fh('Az', us.angle)),
                                m('th.right-align', fh('TVD', us.length)),
                                m('th.right-align', fh('TVDSS', us.length)),
                                m('th.right-align', fh('NS', us.length)),
                                m('th.right-align', fh('EW', us.length)),
                                m('th.right-align', dlsh(us)),
                            )),
                            m('tbody', 
                                model.stations.map(s => m('tr',
                                    m('td.right-align', fvn(s.md, us.length)),
                                    m('td.right-align', fvn(s.inc, us.angle)),
                                    m('td.right-align', fvn(s.az, us.angle)),
                                    m('td.right-align', fvn(s.tvd, us.length)),
                                    m('td.right-align', fvn(s.tvd - (bh.rkb_elevation + bh.well.alt), us.length)),
                                    m('td.right-align', fvn(s.ns, us.length)),
                                    m('td.right-align', fvn(s.ew, us.length)),
                                    m('td.right-align', fvn(s.dls, us.angle)),
                                )),
                            )
                            
                        )
                    },
                    {
                        title: 'Survey QC',
                        vnode: m('', model.corrections.map(r => m('.row',
                            m('h6.col.s12.center-align', r.name),
                            m('.col.s6', CorStationsGrid(r.c.stations, us)),
                            m('.col.s6',
                                m('h6.col.s12.center-align', 'Quality flags'),
                                qc_group_tiles('.col.push-m1.s4.m2.red.center-align.lighten-4.black-text', r.qa.groups),
                                r.qa.issues.length > 0 ?
                                m('.col.s10.push-s1', [
                                    
                                    m('p', 'Issues:'),
                                    m('ul.browser-default', r.qa.issues.map(i => m('li', i)))
                                ]) : m('p.col.s10.push-s1', 'No issues detected')
                            )
                        )))
                    }
                ]
            }),
            
        )
        
    }
}