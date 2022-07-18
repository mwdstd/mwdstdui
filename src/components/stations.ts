import m from 'mithril'
import { DataGrid } from "../datagrid";
import { CiStation, CorrectedSurvey, Station, UnitSystem } from "../types";
import { fh, fvn } from '../units';
import { azColumn, incColumn, mdColumn } from './columns';

//TODO: convert to component?
export const StationsGrid = (items: Station[], us: UnitSystem, editable: boolean = false) => 
    m(DataGrid, {
        items,
        editable,
        columns: [ mdColumn(us), incColumn(us), azColumn(us)],
    })

export const CiStationsGrid = (items: CiStation[], us: UnitSystem, editable: boolean = false) => 
    m(DataGrid, {
        items,
        editable,
        columns: [ mdColumn(us), incColumn(us) ],
    })

export const qcColors = ['green', 'yellow', 'red']

export const CorStationsGrid = (items: any[], us: UnitSystem) => 
m('table.responsive-table', 
    m('thead', m('tr', 
        m('th.right-align', fh('MD', us.length)),
        m('th.right-align', fh('Inc', us.angle)),
        m('th.right-align', fh('Az', us.angle)),
        m('th.right-align', fh('TF', us.angle)),
        m('th.right-align', fh('G', us.acceleration)),
        m('th.right-align', fh('B', us.magind)),
        m('th.right-align', fh('Dip', us.angle)),
        //m('th', fh('dMD', us.length)),
        m('th.right-align', fh('dInc', us.angle)),
        m('th.right-align', fh('dAz', us.angle)),
    )),
    m('tbody', items.map(s=>m('tr.lighten-4',
        {className: qcColors[s.qc] || ''},
        m('td.right-align', fvn(s.md, us.length)),
        m('td.right-align', fvn(s.inc, us.angle)),
        m('td.right-align', fvn(s.az, us.angle)),
        m('td.right-align', fvn(s.tf, us.angle)),
        m('td.right-align', fvn(s.tg, us.acceleration)),
        m('td.right-align', fvn(s.tb, us.magind)),
        m('td.right-align', fvn(s.dip, us.angle)),
        // m('td', fvn(s.dmd, us.length),
        m('td.right-align.lighten-4', {className: s.inc_pass === false ? 'red' : ''}, fvn(s.dinc, us.angle)),
        m('td.right-align.lighten-4', {className: s.az_pass === false ? 'red' : ''}, fvn(s.daz, us.angle)),
    )))
)