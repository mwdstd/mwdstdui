import m from 'mithril'
import conf from './config'
import { PasswordInput, TextInput } from "mithril-materialized"

const TOKEN_KEY = 'auth-token'

class AuthModel {
    getToken = () => JSON.parse(localStorage.getItem(TOKEN_KEY))
    signUp = async (user) => {
        try {
            await m.request({
                method: 'POST', 
                url: `${(await conf).apiUrl}/auth/signup`, 
                body: user, 
                serialize: JSON.stringify,
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            await this.signIn('mwdstd', user)
        } catch (e) {
            //console.log(e)
        }
    }
    signIn = async (provider, params) => {
        try {
            var token = await m.request({
                method: 'POST', 
                url: `${(await conf).apiUrl}/auth/signin`, 
                body: {provider, args: params}, 
                serialize: JSON.stringify, 
                background: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
            document.dispatchEvent(this.ontokenchange)
            m.route.set('/')
        } catch (e) {
            console.log(e)
        }
    }
    signOut = () => {
        var token = this.getToken()
        if(!token) return
        var provider = authProviders[token.provider]
        if(provider) provider.signOut()
        localStorage.removeItem(TOKEN_KEY)
        document.dispatchEvent(this.ontokenchange)
        m.route.set('/')
    }
    ontokenchange = new Event('tokenchange')
}

export var Auth = new AuthModel()

var authProviders = {
}

for(var p in authProviders)
    authProviders[p]?.load();


    
export var Login = () => {
    var user = {}
    var signin = async () => {
        await Auth.signIn('mwdstd', user)
    }

    return {
        oncreate: (vnode) => {
            for(var p in authProviders)
                authProviders[p]?.init();
        },
        view: (vnode) => 
        m('[style=background-color:lightblue;height:100%]',
            m('div.login.card',
                m('h1', 'MWD STD'),
                m('.row.valign-wrapper',
                    m('',
                        m('h2', 'Sign in'),
                        m(TextInput, {
                            label: 'Username',
                            iconName: 'account_circle',
                            required: true,
                            onchange: (v) => {user.login = v}
                        }),
                        m(PasswordInput, {
                            label: 'Password',
                            required: true,
                            iconName: 'lock',
                            onchange: (v) => {user.password = v}
                        }),
                            m('button.waves-effect.waves-dark.btn', {onclick: signin},'Sign in'),
                    ),
                ),
            )
        )
    }
}

