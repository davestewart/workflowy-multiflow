const { ContainerMixin, ElementMixin } = window.VueSlicksort

function create (mixin) {
  return {
    mixins: [mixin],
    props: {
      tag: {
        type: String,
        default: 'div',
      },
    },
    render (h) {
      return h(this.tag, this.props, this.$slots.default)
    },
  }
}

export const SlickList = create(ContainerMixin)
export const SlickItem = create(ElementMixin)
