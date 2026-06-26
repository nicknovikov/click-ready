import './style.css'
import Konva from 'konva'

type PointStyle = {
  size: number
  fill: string
  stroke?: string
  strokeWidth: number
  rotation: number
}

const DEFAULT_PARAMS = {
  line: {
    color: '#333',
    width: 1.5,
    tension: 0,
    cap: 'round' as const,
    join: 'round' as const,
  },
  point: {
    size: 10,
    fill: '#333',
    stroke: undefined,
    strokeWidth: 0,
    rotation: 0,
  },
}

const LINE_PARAMS = {
  line: {
    color: '#b601fc',
    width: 1.5,
    tension: 0,
    cap: 'round' as const,
    join: 'round' as const,
  },
  point: {
    size: 10,
    fill: '#b601fc',
    stroke: undefined,
    strokeWidth: 0,
    rotation: 0,
  },
} as const

const SPLINE_PARAMS = {
  line: {
    color: '#118603',
    width: 1.5,
    tension: 0.5,
    cap: 'round' as const,
    join: 'round' as const,
  },
  point: {
    size: 5,
    fill: '#fff',
    stroke: '#118603',
    strokeWidth: 2,
    rotation: 45,
  },
} as const

const AREA_PARAMS = {
  fill: '#fcecbb',
  stroke: '#fde498',
  strokeWidth: 1.5,
} as const

type ChartEntry = {
  date: string
  points: {
    first: number
    second: number
    third: number
  }
}

const CHART_CONFIG: Record<string, { type: string }> = {
  first: {
    type: 'line',
  },
  second: {
    type: 'spline',
  },
  third: {
    type: 'area',
  },
}

const CHART_DATA: ChartEntry[] = [
  { date: '2024-01-01', points: { first: 68, second: 72, third: 80 } },
  { date: '2024-02-01', points: { first: 42, second: 58, third: 57 } },
  { date: '2024-03-01', points: { first: 35, second: 49, third: 63 } },
  { date: '2024-04-01', points: { first: 64, second: 67, third: 70 } },
  { date: '2024-05-01', points: { first: 51, second: 61, third: 74 } },
  { date: '2024-06-01', points: { first: 78, second: 84, third: 79 } },
  { date: '2024-07-01', points: { first: 69, second: 76, third: 83 } },
  { date: '2024-08-01', points: { first: 91, second: 87, third: 88 } },
  { date: '2024-09-01', points: { first: 74, second: 79, third: 92 } },
  { date: '2024-10-01', points: { first: 103, second: 96, third: 97 } },
  { date: '2024-11-01', points: { first: 88, second: 92, third: 101 } },
  { date: '2024-12-01', points: { first: 116, second: 109, third: 106 } },
]
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div id="chart"></div>
`

const chart = document.querySelector<HTMLDivElement>('#chart')!

const stage = new Konva.Stage({
  container: chart,
  width: chart.clientWidth,
  height: chart.clientHeight,
})

const layer = new Konva.Layer()
stage.add(layer)

function renderChart(data: ChartEntry[]) {
  const width = chart.clientWidth
  const height = chart.clientHeight

  stage.size({ width, height })
  layer.destroyChildren()

  if (width === 0 || height === 0 || data.length === 0) {
    return
  }

  const seriesValues = {
    first: data.map(({ points }) => points.first),
    second: data.map(({ points }) => points.second),
    third: data.map(({ points }) => points.third),
  }
  const allValues = [...seriesValues.first, ...seriesValues.second, ...seriesValues.third]
  const padding = {
    top: 24,
    right: 24,
    bottom: 24,
    left: 24,
  }
  const plotWidth = Math.max(1, width - padding.left - padding.right)
  const plotHeight = Math.max(1, height - padding.top - padding.bottom)
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const valueRange = maxValue - minValue || 1
  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0
  const yForValue = (value: number) =>
    padding.top + plotHeight - ((value - minValue) / valueRange) * plotHeight

  const buildPoints = (values: number[]) =>
    values.flatMap((value, index) => [padding.left + index * xStep, yForValue(value)])

  const seriesEntries = Object.entries(seriesValues)
  const areaSeriesName = seriesEntries.find(([seriesName]) => CHART_CONFIG[seriesName]?.type === 'area')?.[0]

  const orderedSeriesEntries = areaSeriesName
    ? [
        ...seriesEntries.filter(([seriesName]) => seriesName === areaSeriesName),
        ...seriesEntries.filter(([seriesName]) => seriesName !== areaSeriesName),
      ]
    : seriesEntries

  orderedSeriesEntries.forEach(([seriesName, values]) => {
    const points = buildPoints(values)
    const seriesConfig = CHART_CONFIG[seriesName]

    const lineParams = seriesConfig?.type === 'spline'
      ? SPLINE_PARAMS.line
      : seriesConfig?.type === 'line'
        ? LINE_PARAMS.line
        : DEFAULT_PARAMS.line
    const pointParams: PointStyle = seriesConfig?.type === 'line' || seriesConfig?.type === 'spline'
      ? (seriesConfig?.type === 'spline' ? SPLINE_PARAMS.point : LINE_PARAMS.point)
      : DEFAULT_PARAMS.point

    if (seriesConfig?.type === 'area') {
      const areaPoints = [...points, padding.left + plotWidth, padding.top + plotHeight, padding.left, padding.top + plotHeight]

      layer.add(
        new Konva.Line({
          points: areaPoints,
          closed: true,
          fill: AREA_PARAMS.fill,
        }),
      )

      layer.add(
        new Konva.Line({
          points,
          stroke: AREA_PARAMS.stroke,
          strokeWidth: AREA_PARAMS.strokeWidth,
          lineCap: 'round',
          lineJoin: 'round',
        }),
      )
      return
    }

    layer.add(
      new Konva.Line({
        points,
        stroke: lineParams.color,
        strokeWidth: lineParams.width,
        tension: lineParams.tension,
        lineCap: lineParams.cap,
        lineJoin: lineParams.join,
      }),
    )

    points.forEach((point, index) => {
      if (index % 2 !== 0) {
        return
      }

      layer.add(
        new Konva.Rect({
          x: point - pointParams.size / 2,
          y: points[index + 1] - pointParams.size / 2,
          width: pointParams.size,
          height: pointParams.size,
          fill: pointParams.fill,
          stroke: pointParams.stroke,
          strokeWidth: pointParams.strokeWidth,
          rotation: pointParams.rotation,
        }),
      )
    })
  })

  layer.draw()
}

renderChart(CHART_DATA)

const resizeObserver = new ResizeObserver(() => {
  renderChart(CHART_DATA)
})

resizeObserver.observe(chart)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    resizeObserver.disconnect()
    stage.destroy()
  })
}
