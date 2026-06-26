import './style.css'
import Konva from 'konva'

const DEFAULT_LINE_PARAMS = {
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
    strokeWidth: 0,
    rotation: 0,
  },
} as const

type ChartEntry = {
  date: string
  points: {
    first: number
    second: number
  }
}

const CHART_CONFIG: Record<string, { type: string }> = {
  first: {
    type: 'line',
  },
  second: {
    type: 'line',
  },
}

const CHART_DATA: ChartEntry[] = [
  { date: '2024-01-01', points: { first: 68, second: 72 } },
  { date: '2024-02-01', points: { first: 42, second: 58 } },
  { date: '2024-03-01', points: { first: 35, second: 49 } },
  { date: '2024-04-01', points: { first: 64, second: 67 } },
  { date: '2024-05-01', points: { first: 51, second: 61 } },
  { date: '2024-06-01', points: { first: 78, second: 84 } },
  { date: '2024-07-01', points: { first: 69, second: 76 } },
  { date: '2024-08-01', points: { first: 91, second: 87 } },
  { date: '2024-09-01', points: { first: 74, second: 79 } },
  { date: '2024-10-01', points: { first: 103, second: 96 } },
  { date: '2024-11-01', points: { first: 88, second: 92 } },
  { date: '2024-12-01', points: { first: 116, second: 109 } },
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
  }
  const allValues = [...seriesValues.first, ...seriesValues.second]
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

  Object.entries(seriesValues).forEach(([seriesName, values]) => {
    const points = buildPoints(values)
    const seriesConfig = CHART_CONFIG[seriesName]

    const lineParams = seriesConfig?.type === 'line' ? LINE_PARAMS.line : DEFAULT_LINE_PARAMS.line
    const pointParams = seriesConfig?.type === 'line' ? LINE_PARAMS.point : DEFAULT_LINE_PARAMS.point

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
