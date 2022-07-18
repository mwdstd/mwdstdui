
interface IConfig {
    apiUrl: string
}

const default_config = {
    apiUrl: "/api"
}

var config: Promise<IConfig> = fetch('/config.json').then(x => x.json()).catch(() => default_config)

export default config;
