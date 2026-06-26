import './style.css'
import Konva from 'konva'

const CHART_DATA = [68, 42, 35, 64, 51, 78, 69, 91, 74, 103, 88, 116]
const CHART_COLOR = '#b601fc'

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

function renderChart(data: number[]) {
  const width = chart.clientWidth
  const height = chart.clientHeight

  stage.size({ width, height })
  layer.destroyChildren()

  if (width === 0 || height === 0 || data.length === 0) {
    return
  }

  const padding = {
    top: 24,
    right: 24,
    bottom: 24,
    left: 24,
  }
  const plotWidth = Math.max(1, width - padding.left - padding.right)
  const plotHeight = Math.max(1, height - padding.top - padding.bottom)
  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const valueRange = maxValue - minValue || 1
  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0
  const yForValue = (value: number) =>
    padding.top + plotHeight - ((value - minValue) / valueRange) * plotHeight

  const points = data.flatMap((value, index) => [
    padding.left + index * xStep,
    yForValue(value),
  ])

  layer.add(
    new Konva.Line({
      points,
      stroke: CHART_COLOR,
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
        fill: CHART_COLOR,
      }),
    )
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
