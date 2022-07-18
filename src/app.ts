import './material-icons.css'
import './materialize.css'
import '../node_modules/mithril-materialized/dist/index.css'
import './styles.css'

import m from 'mithril'
import { HomeVm } from './viewmodels/home'
import { ErrorVm } from './viewmodels/error'
import { ClientNewVm, ClientEditVm, ClientViewVm } from './viewmodels/client'
import { OilfieldNewVm, OilfieldEditVm, OilfieldViewVm } from './viewmodels/oilfield'
import { PadNewVm, PadEditVm, PadViewVm } from './viewmodels/pad'
import { WellNewVm, WellEditVm, WellViewVm } from './viewmodels/well'
import { BoreholeNewVm, BoreholeViewVm, BoreholeEditVm } from './viewmodels/borehole'
import { ReportVm } from './viewmodels/report'
import { RunNewVm, RunEditVm, RunViewVm } from './viewmodels/run'
import { SurveyNewVm, SurveyEditVm } from './viewmodels/survey'
import { DashboardVm } from './viewmodels/dashboard'
import { RunMaintenanceVm } from './viewmodels/runmaintenance'
import { TasksVm } from './viewmodels/tasks'
import { UserNewVm, UserViewVm } from './viewmodels/user'
import { UserSettingsVm } from './viewmodels/usersettings'

import { EditComponent } from './views/common'
import { Home } from './views/home'
import { ErrorView } from './views/error'
import { ClientEdit, ClientNew, ClientView } from './views/client'
import { OilfieldEdit, OilfieldNew, OilfieldView } from './views/oilfield'
import { PadEdit, PadNew, PadView } from './views/pad'
import { WellEdit, WellNew, WellView } from './views/well'
import { BoreholeNew, BoreholeView, BoreholeEdit } from './views/borehole'
import { RunEdit, RunNew, RunView } from './views/run'
import { SurveyNew, SurveyEdit } from './views/survey'
import { RunMaintenanceView } from './views/runmaintenance'
import { DashboardPage } from './views/dashboard'
import { ReportView } from './views/report'
import { TasksView } from './views/tasks'
import { UserNew, UserView } from './views/user'
import { UserSettings } from './views/usersettings'

import { Auth, Login } from './auth'
import { UserRole } from './types'
import { Layout } from './layout'

import * as net from './net'
import { setToken } from './events'
import { BaseEditVm, BaseVm } from './viewmodels/common'

net.errorHandlers['401'] = () => {
    m.route.set('/login')
}

document.addEventListener('tokenchange', () => {
    console.log("Token change")
    net.setToken(Auth.getToken()?.token)
    setToken(Auth.getToken()?.token)
})
document.dispatchEvent(Auth.ontokenchange)

var r : {vm: BaseVm} = {vm: new BaseVm()}
var navwrap = (model) => (async (args) => { 
    r.vm.destroy?.()
    if (!Auth.getToken()) { m.route.set("/login"); return }
    r.vm = new model(args?.id); 
    try {
        await r.vm.init;
    } catch (e) {
        console.dir(e)
    }
    
})

var editRoute = (vm, view) => {
    return {onmatch: navwrap(vm), render: (vnode) => m(Layout, {path: r.vm.path, control: [UserRole.SU, UserRole.DE].includes(r.vm.user.role), debug: r.vm.user.role == UserRole.SU}, m(EditComponent, {model: <BaseEditVm>r.vm, component: view}))}
}
var viewRoute = (vm, view) => {
    return {onmatch: navwrap(vm), render: (vnode) => m(Layout, {path: r.vm.path, control: [UserRole.SU, UserRole.DE].includes(r.vm.user.role), debug: r.vm.user.role == UserRole.SU}, m(view, {model: r.vm}))}
}

var viewSimple = (vm, view) => {
    return {onmatch: navwrap(vm), render: (vnode) => m('.container', m('main', m(view, {model: r.vm})))}
}

m.route(document.body, "/", {
    "/": viewRoute(HomeVm, Home),
    "/control": viewRoute(DashboardVm, DashboardPage),
    "/control/:id": viewRoute(RunMaintenanceVm, RunMaintenanceView),
    "/create_client": editRoute(ClientNewVm, ClientNew),
    "/client/:id": viewRoute(ClientViewVm, ClientView), 
    "/client/:id/edit": editRoute(ClientEditVm, ClientEdit), 
    "/client/:id/create_field": editRoute(OilfieldNewVm, OilfieldNew),
    "/field/:id": viewRoute(OilfieldViewVm, OilfieldView),
    "/field/:id/edit": editRoute(OilfieldEditVm, OilfieldEdit),
    "/field/:id/create_pad": editRoute(PadNewVm, PadNew),
    "/pad/:id": viewRoute(PadViewVm, PadView),
    "/pad/:id/edit": editRoute(PadEditVm, PadEdit),
    "/pad/:id/create_well": editRoute(WellNewVm, WellNew),
    "/well/:id": viewRoute(WellViewVm, WellView),
    "/well/:id/edit": editRoute(WellEditVm, WellEdit),
    "/well/:id/create_borehole": editRoute(BoreholeNewVm, BoreholeNew),
    "/borehole/:id": viewRoute(BoreholeViewVm, BoreholeView),
    "/borehole/:id/edit": editRoute(BoreholeEditVm, BoreholeEdit),
    "/borehole/:id/create_run": editRoute(RunNewVm, RunNew),
    "/borehole/:id/report": viewSimple(ReportVm, ReportView),
    "/run/:id": viewRoute(RunViewVm, RunView),
    "/run/:id/create_survey": editRoute(SurveyNewVm, SurveyNew),
    "/run/:id/edit": editRoute(RunEditVm, RunEdit),
    "/survey/:id/edit": editRoute(SurveyEditVm, SurveyEdit),
    "/user/:id": viewRoute(UserViewVm, UserView),
    "/create_user": editRoute(UserNewVm, UserNew),
    "/settings": viewRoute(UserSettingsVm, UserSettings),
    "/debug": viewRoute(TasksVm, TasksView),
    "/login": Login,
    "/:id...": viewRoute(ErrorVm, ErrorView)
})
