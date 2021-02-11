/**
 * Data class
 */
export default class Data {
  /**
   * Loads frame data
   * @returns {{urls: string[], titles: string[], layout: string}}
   */
  load () {
    return JSON.parse(localStorage.getItem('multiflow') || '{}')
  }

  /**
   * Save visible frames
   * @param {Frame[]} frames
   * @param {string}  layout
   */
  save (frames, layout) {
    // input data
    const input = frames
      .filter(frame => frame.isVisible())
      .map(frame => frame.getData())

    // output data
    const urls = input.map(d => d.url)
    const titles = input.map(d => d.title)
    const data = { urls, titles, layout }

    // save
    document.title = 'MultiFlow: ' + titles.join(' + ')
    localStorage.setItem('multiflow', JSON.stringify(data))

    // return
    return data
  }
}
