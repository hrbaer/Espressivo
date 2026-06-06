const cssVariables = ['--col-1', '--col-2', '--col-3', '--col-4']
const sizeOn = '1fr'
const sizeOff = '0fr'

function moveBack() {
    const values = cssVariables.map((name) => {
        return getRootProperty(name)
    })
    values.shift()
    values.push(sizeOff)
    cssVariables.forEach((property, index) => {
        setRootProperty(property, values[index])
    })
}

function moveForward() {
    getNumPanels()

    const values = getCssVariables()
    values.pop()
    values.unshift(sizeOff)
    cssVariables.forEach((property, index) => {
        setRootProperty(property, values[index])
    })
    if (countOnVariables() == 0) {
        moveToBegin()
    }
}

function moveToBegin() {
    setRootIndexOn(1)
    setRootIndexOff(2)
    setRootIndexOff(3)
    setRootIndexOff(4)
}

function getCssVariables() {
    return cssVariables.map((name) => {
        return getRootProperty(name)
    })
}

function countOnVariables() {
    const values = getCssVariables()
    return values.filter((value) => {
        return value == sizeOn
    }).length
}

function setRootProperty(name, value) {
    document.documentElement.style.setProperty(name, value)
}

function setRootIndex(index, value) {
    setRootProperty(cssVariables[index - 1], value)
}

function setRootIndexOn(index) {
    setRootIndex(index, sizeOn)
}

function setRootIndexOff(index) {
    setRootIndex(index, sizeOff)
}

function getRootProperty(name) {
    const prop = document.documentElement.style.getPropertyValue(name)
    return prop.length > 0 ? prop : sizeOff
}

function setLayout(columnWidth) {
    if (columnWidth >= 600) {
        setRootProperty('--column-width', '100%')
        setRootProperty('--column-position', 'relative')
    } else {
        setRootProperty('--column-width', columnWidth + 'px')
        setRootProperty('--column-position', 'absolute')
    }
}

function setViewLayout(col2val, col3val, col4val) {
    setRootProperty('--col-2-view', col2val)
    setRootProperty('--col-3-view', col3val)
    setRootProperty('--col-4-view', col4val)
}

function getNumPanels() {
    const navigationPanel = document.querySelector('div.navigation-panel')
    console.log(navigationPanel)
}

export default {
    moveBack,
    moveForward,
    setRootProperty,
    setRootIndex,
    setRootIndexOn,
    setRootIndexOff,
    getRootProperty,
    setLayout,
    setViewLayout,
}
