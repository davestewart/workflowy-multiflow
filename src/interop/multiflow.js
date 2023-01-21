/**
 * Interoperability API for plugin compatibility
 *
 * Feel free to copy/paste verbatim, or pull out functions as required
 */
export const MultiFlow = {
  /**
   * Get the currently focused frame's Window or the main Window if MultiFlow is not active
   *
   * @example MultiFlow.getWindow().document.body.addEventListener( ... )
   * @returns {Window}
   */
  getWindow () {
    const body = document.body
    const mode = body.getAttribute('data-mode')
    if (mode === 'multiflow') {
      const frames = document.querySelectorAll('#multiflow iframe')
      const index = body.getAttribute('data-focused') || '0'
      return frames[Number(index)].contentWindow
    }
    return window
  },

  /**
   * Hook into MultiFlow state changes
   *
   * Available attributes are:
   *
   *  - mode    <string>  : either "workflowy" or "multiflow" depending if columns are visible
   *  - loading <boolean> : whether one or more frames are loading
   *  - frames  <number>  : the number of frames created (note: closed frames may be hidden!)
   *  - focused <number>  : the currently focused frame index
   *
   * @example MultiFlow.onChange((attr, value, oldValue) => if (attr === 'mode') { ... })
   * @param callback
   */
  onChange (callback) {
    const observer = new MutationObserver(function (mutations, observer) {
      for (const mutation of mutations) {
        const { attributeName, target, oldValue } = mutation
        const attr = attributeName.substring(5)
        const value = target.getAttribute(attributeName)
        if (oldValue !== value) {
          callback(attr, parse(value), parse(oldValue))
        }
      }
    })
    observer.observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: 'data-mode data-frames data-loading data-focused'.split(' '),
    })
  },
}

function parse (value) {
  return /\d/.test(value)
    ? parseInt(value)
    : /true|false/.test(value)
      ? value === 'true'
      : value
}
