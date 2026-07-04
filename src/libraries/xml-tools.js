/*
 *  X M L   T O O L S.
 *
 *  Collection of methods to get XML content.
 *
 */

export default {
    /*
     * Gets an attribute.
     */
    getAttribute(node, attr) {
        if (node.hasAttribute(attr)) {
            return node.getAttribute(attr)
        }
    },

    /*
     * Gets an array of attributes.
     */
    getListAttribute(node, attr) {
        let attribute = this.getAttribute(node, attr)
        if (attribute != null) {
            return attribute.split(/[,\s]+/)
        }
        return []
    },

    /*
     * Find attribute on this or the parent node.
     */
    findAttribute(node, attr) {
        do {
            let attribute = this.getAttribute(node, attr)
            if (attribute != null) {
                return attribute
            }
            node = node.parentNode
        } while (node)
    },

    /*
     * Gets all attributes.
     */
    getAllAttributes(node) {
        let attributes = {}
        Array.from(node.attributes).forEach((attr) => {
            attributes[attr.name] = attr.value
        })
        return attributes
    },

    /*
     * Gets a numerical attribute value.
     */
    getAttributeValue(node, attr, def) {
        let attribute = this.getAttribute(node, attr)
        if (attribute != null) {
            const value = Number(attribute)
            if (!isNaN(value)) {
                return value
            }
        }
        return def
    },

    /*
     * Gets an array of numerical attribute values.
     */
    getAttributeValues(node, attr) {
        let list = this.getListAttribute(node, attr)
        return list.map((value) => {
            return +value
        })
    },

    /*
     * Get the text content without white space.
     */
    getTextContent(node) {
        return node.textContent.trim()
    },

    /*
     * Get the text content as a number.
     */
    getNumContent(node) {
        return +this.getTextContent(node)
    },

    /*
     * Looks for a child node.
     */
    findChildNode(node, name) {
        if (node.hasChildNodes()) {
            return Array.from(node.childNodes).find((child) => {
                return child.nodeName === name
            })
        }
    },
}
