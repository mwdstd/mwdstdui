import m from 'mithril'
import { GeometryGrid } from '../../components/geometry';
import { BoreholeViewVm } from "../../viewmodels/borehole";
import { messageCard } from '../common';

export var GeometryTab = (model: BoreholeViewVm) =>
    m('', model.obj.geometry_finished ? 
        GeometryGrid(model.obj.geometry_finished, model.user.us) : 
        messageCard('No geometry data provided')
    )
