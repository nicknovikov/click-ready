import './style.css'
import Konva from 'konva'

type ChartEntry = {
  date: string
  points: {
    first: number
    second: number
  }
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
const CHART_COLORS = ['#b601fc', '#19c4ff']

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

  Object.entries(seriesValues).forEach(([_, values], seriesIndex) => {
    const points = buildPoints(values)

    layer.add(
      new Konva.Line({
        points,
        stroke: CHART_COLORS[seriesIndex] ?? '#000000',
        strokeWidth: 1.5,
        lineCap: 'round',
        lineJoin: 'round',
      }),
    )

    points.forEach((point, index) => {
      if (index % 2 !== 0) {
        return
      }

      const size = 8

      layer.add(
        new Konva.Rect({
          x: point - size / 2,
          y: points[index + 1] - size / 2,
          width: size,
          height: size,
          fill: CHART_COLORS[seriesIndex] ?? '#000000',
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
