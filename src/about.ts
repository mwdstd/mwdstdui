import m from 'mithril'
import { FlatButton, ModalPanel } from 'mithril-materialized'
import { Model } from './models';
import * as appVersionJson from './version.json';

export interface AppInfo {
    /** application name as specified in package.json */
    readonly name: string;

    /** application description as specified in package.json */
    readonly description: string;

    /** application homepage as specified in package.json */
    readonly homepage: string;

    /** build timestamp in milliseconds since the epoch */
    readonly buildDate: number;

    /** application version as specified in package.json */
    readonly version: string;
}

export const appVersion= <AppInfo>appVersionJson;

const versionsModel = new Model('versions');
versionsModel.loadList().then(l => components = [...components, ...<AppInfo[]>l])
var components : AppInfo[] = [appVersion]

const refBtn = (label: string, url: string) =>
    m('.col.m4.s12.center-align', m(FlatButton, {
        label, 
        href: url,
        style: 'text-align: center;', 
        iconClass: 'right', 
        iconName: 'launch', 
        target: '_blank', 
    }))

export const AboutModal = {
    view: () =>  m(ModalPanel, {
        id: 'aboutModal',
        title: 'MWD STD Basic',
        description: m('', 
            m('', 'The automatic platform for basic measurement-while-drilling corrections'),
            m('hr'),
            m('.row',
                refBtn('Features', 'https://mwdstd.com/mwd-std-basic/'),
                refBtn('Installation', 'https://github.com/mwdstd/mwdstdbasic/blob/master/INSTALL.md'),
                refBtn('User manual', 'https://mwdstd.com/content/'),
            ),
            m('h6', 'Components'),
            m('table',
                m('tr', 
                    m('th', 'Name'),
                    m('th', 'Version'),
                    m('th', 'Description'),
                ),
                components.map(c => 
                    m('tr', 
                        m('td', m('a', {href: c.homepage, target: '_blank'}, c.name, m('i.material-icons.tiny', 'launch'))),
                        m('td', c.version),
                        m('td', c.description),
                    )
                )
            ),
            m('hr'),
            m('', 'Copyright (C) 2022 ', m('a', {target: '_blank', href: 'https://mwdstd.com'}, 'MWD STD Inc.')),
            m('', 'This project can be used under the terms of ', m('a', {target: '_blank', href: 'https://www.gnu.org/licenses/agpl-3.0.en.html'}, 'the GNU Affero General Public License, version 3')),           
        ),
    }),
}