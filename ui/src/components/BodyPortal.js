import { Component } from 'react'
import ReactDOM from 'react-dom'

export default class BodyPortal extends Component {
  render () {
    const container = document.getElementsByTagName('body');
    if (container.length) {
      return ReactDOM.createPortal(
        this.props.children,
        container[0]
      )
    } else {
      return null
    }
  }
}
