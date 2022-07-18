import m from 'mithril'
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { FlatButton } from 'mithril-materialized';
Chart.register(...registerables);
Chart.register(zoomPlugin);

interface SeriesDataRegistry {
    band: { x: Number, l: Number, u: Number },
    line: { x: Number, y: Number },
    dots: { x: Number, y: Number },
}

export type IChartType = keyof SeriesDataRegistry

export interface IChartSeries<TType extends IChartType = IChartType> {
    type: TType
    label: string
    data: SeriesDataRegistry[TType][]
    color?: string
}

export interface IChartOptions {
    title: { text: string, align: 'left' | 'center' | 'right' }
    series: IChartSeries[]
    className?: string
}

const alignConv: any = { 'left': 'start', 'center': 'center', 'right': 'end' }
const getData = (s: IChartSeries): any[] => {
    if(s.type == 'band')
        return [
            {
                label: s.label,
                type: 'line',
                data: s.data.sort((a: any, b: any) => (a.x - b.x)).map((pt: any) => ({x: pt.x, y: .5 * (pt.l + pt.u)})),
                backgroundColor: s.color,
                borderWidth: 0,
                pointRadius: 0,
                borderColor: "transparent",
            },
            {
                label: `~${s.label}u`,
                type: 'line',
                data: s.data.sort((a: any, b: any) => (a.x - b.x)).map((pt: any) => ({x: pt.x, y: pt.u})),
                backgroundColor: s.color,
                borderColor: "transparent",
                pointRadius: 0,
                fill: 0,
            },
            {
                label: `~${s.label}l`,
                type: 'line',
                data: s.data.sort((a: any, b: any) => (a.x - b.x)).map((pt: any) => ({x: pt.x, y: pt.l})),
                backgroundColor: s.color,
                borderColor: "transparent",
                pointRadius: 0,
                fill: 0,
            },
        ]
    return [{
        label: s.label,
        type: 'line',
        data: s.data.sort((a: any, b: any) => (a.x - b.x)),
        backgroundColor: s.color,
        borderColor: s.color,
        borderWidth: s.type == 'dots' ? 0.5 : 2,
        pointRadius: s.type == 'dots' ? undefined : 0,
        pointHitRadius: 4
    }]
}

export var ChartCmp = () => {
    var chartInstance
    var data
    return {
        oncreate: (vnode: m.VnodeDOM<IChartOptions, any>) => {
            let cnv = document.createElement('canvas');
            vnode.dom.appendChild(cnv)
            chartInstance = new Chart(cnv, {
                type: 'line',
                data: { datasets: data },
                options: {
                    aspectRatio: 2.4,
                    plugins: {
                        title: {
                            align: alignConv[vnode.attrs.title.align],
                            display: true,
                            text: vnode.attrs.title.text,
                        },
                        legend: {
                            labels: {
                                filter: (li) => li.text[0] != "~"
                            }
                        },
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'xy',
                                modifierKey: 'ctrl',
                            },
                            zoom: {
                                mode: 'xy',
                                drag: {
                                    enabled: true,
                                    borderColor: 'rgb(54, 162, 235)',
                                    borderWidth: 1,
                                    backgroundColor: 'rgba(54, 162, 235, 0.3)'
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 0, // general animation time
                    },
                    scales: {
                        x: {
                            type: 'linear'
                        },
                        y: {
                            type: 'linear'
                        },
                    }
                }
            });
        },
        view: (vnode: m.Vnode<IChartOptions, any>) => {
            data = vnode.attrs.series.map(getData).reduce((p, c) => 
                [...p, ...c.map(o => o.fill === false ? o : {...o, fill: o.fill + p.length} )], [])
            if (chartInstance) {
                chartInstance.data = { datasets: data }
                chartInstance.update()
            }
            return m('', 
                { className: vnode.attrs.className },
                m(FlatButton, {
                    iconName: 'refresh', 
                    iconClass: 'center', 
                    className: 'right', 
                    style: 'margin-bottom: -36px', 
                    onclick: () => {chartInstance.resetZoom()}
                })
            )
        }
    }
}