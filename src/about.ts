import m from 'mithril'
import { FlatButton, ModalPanel } from 'mithril-materialized'
import * as appVersionJson from './version.json';

export const appVersion: AppVersion = <any>appVersionJson;

export interface AppVersion {
    /** application name as specified in package.json */
    readonly name: string;

    /** build timestamp in milliseconds since the epoch */
    readonly buildDate: number;

    /** application version as specified in package.json */
    readonly version: string;
}
const components = [
    {name: appVersion.name, version: appVersion.version, description: 'Web frontend', src: 'https://github.com/mwdstd/mwdstdui'},
    {name: 'mwdstdb', version: '0.5.0', description: 'Data storage and automation backend', src: 'https://github.com/mwdstd/mwdstdb'},
    {name: 'mwdstcore', version: '0.5.0', description: 'Calculation server', src: 'https://github.com/mwdstd/mwdstdcore'},
    {name: 'mwdstdwits', version: '0.5.0', description: 'WITS Service', src: 'https://github.com/mwdstd/mwdstdwits'},
]

export const AboutModal = {
    view: () =>  m(ModalPanel, {
        id: 'aboutModal',
        title: 'MWD STD Basic',
        description: m('', 
            m('', 'The automatic platform for basic measurement-while-drilling corrections'),
            m('hr'),
            m('.row',
                m(FlatButton, {style: 'text-align: center;', className: 'col m4 s12', label: 'Features', target: '_blank', href: 'https://mwdstd.com/mwd-std-basic/'}),
                m(FlatButton, {style: 'text-align: center;', className: 'col m4 s12', label: 'Installation', target: '_blank', href: 'https://github.com/mwdstd/mwdstdbasic/blob/master/INSTALL.md'}),
                m(FlatButton, {style: 'text-align: center;', className: 'col m4 s12', label: 'User manual', target: '_blank', href: 'https://mwdstd.com/content/'}),
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
                        m('td', m('a', {href: c.src, target: '_blank'}, c.name)),
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