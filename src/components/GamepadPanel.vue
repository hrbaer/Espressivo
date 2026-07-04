<script setup>
import SimpleMeter from './SimpleMeter.vue'
import { inject } from 'vue'
import navigation from '../libraries/navigation'

const gamepads = inject('gamepads')

const buttons = []
const axes = []
const sensors = []

function handleButton(gamepad, button, index) {
    if (buttons[index] == null) {
        buttons[index] = 0
    }
    if (button.value != buttons[index]) {
        buttons[index] = button.value
    }
    return button.value
}

function handleAxis(gamepad, axis, index) {
    if (axes[index] == null) {
        axes[index] = 0
    }
    if (axis != axes[index]) {
        axes[index] = axis
    }
    return axis
}

function handleSensor(gamepad, sensor, index) {
    if (sensors[index] == null) {
        sensors[index] = 0
    }
    if (sensor != sensors[index]) {
        sensors[index] = sensor
    }
    return sensor
}

function format(value) {
    return value?.toFixed(3)
}

function getValue(x) {
    return x.value == null ? x : x.value
}

function d2hex4(d) {
    return d.toString(16).padStart(4, '0')
}

function getProductId(gamepad) {
    return d2hex4(gamepad.productId)
}

function getVendorId(gamepad) {
    return d2hex4(gamepad.vendorId)
}

function showLivePanel() {
    console.log('showLivePanel')
    navigation.setRootIndexOff(2)
    navigation.setRootIndexOn(4)
}
</script>

<template>
    <div class="gamepad-panel">
        <div class="gamepad-view" @click="showLivePanel">
            <template v-if="gamepads.length == 0">
                <p>
                    There is currently no gamepad connected.<br />
                    Proceed as listed below:
                </p>
                <ol>
                    <li>Attach a gamepad</li>
                    <li>Press any button or stick of the gamepad</li>
                    <li>Select the gamepad from the menu above</li>
                </ol>
            </template>
            <div v-for="gamepad in gamepads" :key="gamepad.index">
                <h2>
                    {{ gamepad.id }}
                </h2>
                <div v-if="gamepad.productId != null">
                    Vendor Id: {{ getVendorId(gamepad) }}, Product Id:
                    {{ getProductId(gamepad) }}
                </div>
                <div v-if="gamepad.buttons.length > 0">
                    <h3>Buttons</h3>
                    <div class="row">
                        <div class="field" v-for="(button, index) in gamepad.buttons" :key="index">
                            <div class="label">{{ button.label ?? index }}</div>
                            <SimpleMeter
                                :min="0"
                                :max="1"
                                :value="handleButton(gamepad, button, index)"
                            />
                        </div>
                    </div>
                </div>
                <div v-if="gamepad.axes.length > 0">
                    <h3>Axes</h3>
                    <div class="row">
                        <div class="field" v-for="(axis, index) in gamepad.axes" :key="index">
                            <div class="label">{{ axis.label ?? index }}</div>
                            <SimpleMeter
                                :min="-1"
                                :max="1"
                                :value="handleAxis(gamepad, getValue(axis), index)"
                            />
                            <div class="number">{{ format(getValue(axis)) }}</div>
                        </div>
                    </div>
                </div>
                <div v-if="gamepad.sensors?.length > 0">
                    <h3>Sensors</h3>
                    <div class="row">
                        <div class="field" v-for="(sensor, index) in gamepad.sensors" :key="index">
                            <div class="label">{{ sensor.label ?? index }}</div>
                            <SimpleMeter
                                :min="-1"
                                :max="1"
                                :value="handleSensor(gamepad, sensor.value, index)"
                            />
                            <div class="number">{{ format(sensor.value) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
div.gamepad-panel {
    position: var(--column-position);
    height: 100%;
    overflow: scroll;
    width: var(--column-width);
    background-color: var(--color-background);
}

div.gamepad-view {
    padding: 1em;
}

div.row {
    border: 1px solid rgba(128, 128, 128, 0.189);
    border-radius: 7px;
}

div.field {
    display: inline-block;
    width: 70px;
    padding: 5px 7px 5px 7px;
    margin: 5px;
    background-color: rgba(128, 128, 128, 0.1);
    border-radius: 7px;
}

div.label {
    display: flex;
    justify-content: center;
    font-size: 9pt;
    font-weight: 500;
    font-stretch: 50%;
}

div.number {
    display: flex;
    justify-content: center;
    font-size: 8pt;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    margin-right: 5px;
}

meter {
    width: 100%;
}

:deep() div.meter {
    background: rgb(48, 129, 55);
}
</style>
