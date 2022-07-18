import m from 'mithril'
import { DataGrid } from "../datagrid";
import { GeometrySection, UnitSystem } from "../types";
import { fdg } from "../units";
import { descriptionColumn } from './columns';

//TODO: convert to component?
export var GeometryGrid = (geometry: GeometrySection[], us: UnitSystem, editable: boolean = false) =>
    m(DataGrid, {
        editable,
        columns: [
            { ...fdg('Hole Diameter', us.diameter), name: 'hole_diameter', type: 'float' },
            { ...fdg('Casing Start', us.length), name: 'casing_start', type: 'float' },
            { ...fdg('Casing Stop', us.length), name: 'casing_stop', type: 'float' },
            { ...fdg('Casing ID', us.diameter), name: 'casing_inner_diameter', type: 'float' },
            descriptionColumn,
        ],
        items: geometry
    })
