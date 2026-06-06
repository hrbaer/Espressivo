<script setup>
import { computed, inject } from 'vue'

const progress = inject('progress')

const d = computed(() => {
    const arc = describeArc(0, 0, 100, 0, progress.value * 3.6)
    return arc
})

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0

    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    }
}

function describeArc(x, y, radius, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, endAngle)
    var end = polarToCartesian(x, y, radius, startAngle)
    var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    var d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ')
    return d
}
</script>

<template>
    <!-- progress id="file" max="100" :value="progress"></progress>
    <div>{{ progress }}<span> %</span></div -->
    <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        width="100%"
        height="100%"
        viewBox="-150 -150 300 300"
    >
        <g fill="none" stroke="var(--accent-color)" stroke-width="40">
            <circle r="100" opacity="0.2" />
            <path :d="d" />
        </g>
    </svg>
</template>
