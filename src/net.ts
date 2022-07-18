import moment from 'moment'

class HttpError extends Error {
    constructor(r: Response, body: any) {
        super(r.statusText)
        this.code = r.status
        this.response = body
    }
    readonly code: number
    readonly response: any
}

var date_replacer = function(key: string, value: any) {
    if (this[key] instanceof Date) {
        return moment(this[key]).format();
    }
    return value;
}
var serializer = (obj: any) => JSON.stringify(obj, date_replacer)

export const errorHandlers = {
    401: null,
    404: null,
    422: null,
}

export const setToken = (t: string) => { token = t }

export var token: string = null

export async function makeRequest<T>(method: string, url: string, body?: any) : Promise<T> {
    try {
        let res = await fetch(url, {
            method, body: body !== undefined ? serializer(body) : undefined,
            headers: {
                ...token ? {'Authorization': `Bearer ${token}`} : {},
                'Content-Type': 'application/json'
            }
        })
        if (res.ok)
            return await res.json()
        throw new HttpError(res, await res.json())
    } catch (e) {
        if (errorHandlers[e.code]) {
            errorHandlers[e.code](e)
            return
        }
        throw e
    }
}
