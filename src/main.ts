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
  hover: {
    radius: 18,
    size: 6,
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

const HISTOGRAM_PARAMS = {
  fill: '#2563eb',
  stroke: '#fff',
  strokeWidth: 1.5,
  widthRatio: 0.6,
} as const

type ChartEntry = {
  date: string
  points: {
    cost: number
    cpa: number
    roi: number
    conversions: number
  }
}

const CHART_CONFIG: Record<string, { name: string, type: string }> = {
  cost: {
    name: 'Cost',
    type: 'line',
  },
  cpa: {
    name: 'CPA',
    type: 'spline',
  },
  roi: {
    name: 'ROI Confirmed',
    type: 'area',
  },
  conversions: {
    name: 'Conversions',
    type: 'histogram',
  },
}

const CHART_DATA: ChartEntry[] = [
  { date: '2024-01-01', points: { cost: 68, cpa: 72, roi: 80, conversions: 58 } },
  { date: '2024-02-01', points: { cost: 42, cpa: 58, roi: 57, conversions: 63 } },
  { date: '2024-03-01', points: { cost: 35, cpa: 49, roi: 63, conversions: 67 } },
  { date: '2024-04-01', points: { cost: 64, cpa: 67, roi: 70, conversions: 72 } },
  { date: '2024-05-01', points: { cost: 51, cpa: 61, roi: 74, conversions: 69 } },
  { date: '2024-06-01', points: { cost: 78, cpa: 84, roi: 79, conversions: 77 } },
  { date: '2024-07-01', points: { cost: 69, cpa: 76, roi: 83, conversions: 81 } },
  { date: '2024-08-01', points: { cost: 91, cpa: 87, roi: 88, conversions: 85 } },
  { date: '2024-09-01', points: { cost: 74, cpa: 79, roi: 92, conversions: 89 } },
  { date: '2024-10-01', points: { cost: 103, cpa: 96, roi: 97, conversions: 94 } },
  { date: '2024-11-01', points: { cost: 88, cpa: 92, roi: 101, conversions: 98 } },
  { date: '2024-12-01', points: { cost: 116, cpa: 109, roi: 106, conversions: 103 } },
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

let hoverCircle: Konva.Circle | null = null
let costPointMarkers: Konva.Rect[] = []
let costPointCenters: Array<{ x: number; y: number }> = []
let currentPadding = { top: 24, right: 24, bottom: 24, left: 24 }
let currentXStep = 0
let chartMouseMoveHandler: ((event: MouseEvent) => void) | null = null
let chartMouseLeaveHandler: (() => void) | null = null

function renderChart(data: ChartEntry[]) {
  const width = chart.clientWidth
  const height = chart.clientHeight

  stage.size({ width, height })
  layer.destroyChildren()
  costPointMarkers = []
  costPointCenters = []

  if (width === 0 || height === 0 || data.length === 0) {
    return
  }

  const seriesValues = {
    cost: data.map(({ points }) => points.cost),
    cpa: data.map(({ points }) => points.cpa),
    roi: data.map(({ points }) => points.roi),
    conversions: data.map(({ points }) => points.conversions),
  }
  const allValues = [...seriesValues.cost, ...seriesValues.cpa, ...seriesValues.roi, ...seriesValues.conversions]
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

  const orderedSeriesEntries = [
    ...seriesEntries.filter(([seriesName]) => CHART_CONFIG[seriesName]?.type === 'area'),
    ...seriesEntries.filter(([seriesName]) => CHART_CONFIG[seriesName]?.type === 'histogram'),
    ...seriesEntries.filter(
      ([seriesName]) => CHART_CONFIG[seriesName]?.type !== 'area' && CHART_CONFIG[seriesName]?.type !== 'histogram',
    ),
  ]

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

    if (seriesConfig?.type === 'histogram') {
      const barWidth = Math.max(4, xStep * HISTOGRAM_PARAMS.widthRatio || 0)
      const baselineY = padding.top + plotHeight

      values.forEach((value, index) => {
        const x = padding.left + index * xStep - barWidth / 2
        const y = yForValue(value)

        layer.add(
          new Konva.Rect({
            x,
            y,
            width: barWidth,
            height: baselineY - y,
            fill: HISTOGRAM_PARAMS.fill,
            stroke: HISTOGRAM_PARAMS.stroke,
            strokeWidth: HISTOGRAM_PARAMS.strokeWidth,
          }),
        )
      })
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

      const marker = new Konva.Rect({
        x: point - pointParams.size / 2,
        y: points[index + 1] - pointParams.size / 2,
        width: pointParams.size,
        height: pointParams.size,
        fill: pointParams.fill,
        stroke: pointParams.stroke,
        strokeWidth: pointParams.strokeWidth,
        rotation: pointParams.rotation,
      })

      layer.add(marker)

      if (seriesName === 'cost') {
        costPointMarkers.push(marker)
        costPointCenters.push({ x: point, y: points[index + 1] })
      }
    })
  })

  if (hoverCircle) {
    hoverCircle.remove()
    hoverCircle = null
  }

  const costValues = data.map(({ points }) => points.cost)
  const costPoints = costValues.flatMap((value, index) => [padding.left + index * xStep, yForValue(value)])
  currentPadding = padding
  currentXStep = xStep

  const updateHoverCircle = (index: number) => {
    if (hoverCircle) {
      hoverCircle.remove()
    }

    if (index < 0 || index >= data.length) {
      hoverCircle = null
      costPointMarkers.forEach((marker, markerIndex) => {
        const size = LINE_PARAMS.point.size
        const center = costPointCenters[markerIndex]
        marker.setAttrs({
          x: center.x - size / 2,
          y: center.y - size / 2,
          width: size,
          height: size,
        })
      })
      layer.draw()
      return
    }

    costPointMarkers.forEach((marker, markerIndex) => {
      const isHovered = markerIndex === index
      const size = isHovered ? LINE_PARAMS.hover.size : LINE_PARAMS.point.size
      const center = costPointCenters[markerIndex]
      const stroke = isHovered ? '#fff' : LINE_PARAMS.point.stroke
      const strokeWidth = isHovered ? 1 : LINE_PARAMS.point.strokeWidth
      marker.setAttrs({
        x: center.x - size / 2,
        y: center.y - size / 2,
        width: size,
        height: size,
        stroke,
        strokeWidth,
      })
    })

    const x = costPoints[index * 2]
    const y = costPoints[index * 2 + 1]

    hoverCircle = new Konva.Circle({
      x,
      y,
      radius: LINE_PARAMS.hover.radius,
      fill: 'rgba(182, 1, 252, 0.2)',
    })

    layer.add(hoverCircle)
    layer.draw()
  }

  if (chartMouseMoveHandler) {
    chart.removeEventListener('mousemove', chartMouseMoveHandler)
  }

  if (chartMouseLeaveHandler) {
    chart.removeEventListener('mouseleave', chartMouseLeaveHandler)
  }

  chartMouseMoveHandler = (event) => {
    const rect = chart.getBoundingClientRect()
    const x = event.clientX - rect.left
    const relativeX = x - currentPadding.left

    if (relativeX < 0) {
      updateHoverCircle(-1)
      return
    }

    const index = Math.round(relativeX / currentXStep)
    updateHoverCircle(index)
  }

  chartMouseLeaveHandler = () => {
    if (hoverCircle) {
      hoverCircle.remove()
      hoverCircle = null
    }
    costPointMarkers.forEach((marker, markerIndex) => {
      const size = LINE_PARAMS.point.size
      const center = costPointCenters[markerIndex]
      marker.setAttrs({
        x: center.x - size / 2,
        y: center.y - size / 2,
        width: size,
        height: size,
        stroke: LINE_PARAMS.point.stroke,
        strokeWidth: LINE_PARAMS.point.strokeWidth,
      })
    })
    layer.draw()
  }

  chart.addEventListener('mousemove', chartMouseMoveHandler)
  chart.addEventListener('mouseleave', chartMouseLeaveHandler)

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
