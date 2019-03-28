import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import style from '../style/pagination.scss'

const POSITION = {
  BOTTOM: 'bottom',
  TOP: 'top'
}

const getFirstPageIndex = (page, pageSize, dataLength) => {
  if (page === 0 && !dataLength) {
    return 0
  }
  return (page * pageSize) + 1
}

const getLastPageIndex = (page, pageSize, dataLength) => {
  if (page === 0 && !dataLength) {
    return 0
  }
  const startingIndex = getFirstPageIndex(page, pageSize, dataLength)
  return startingIndex + pageSize > dataLength ? dataLength : startingIndex + pageSize - 1
}

export default class PaginationComponent extends Component {
  static propTypes = {
    canNext: PropTypes.bool,
    canPrevious: PropTypes.bool,
    onPageChange: PropTypes.func,
    page: PropTypes.number,
    pages: PropTypes.number,
    pageSize: PropTypes.number,
    totalDataCount: PropTypes.number,
    data: PropTypes.array
  }
  static defaultProps = {
    data: [],
    canNext: true,
    canPrevious: true
  }

  constructor (props) {
    super(props)
    this.pageSwitcher = React.createRef()
    this.pageSwitcherReference = React.createRef()
    this.state = {
      position: POSITION.TOP,
      show: false
    }
  }

  descriptionMouseLeave = () => {
    this.setState({
      show: false
    })
  }

  adjustSwitcherPosition = () => {
    const windowHeight = window.innerHeight
    const pageSwitcher = this.pageSwitcher.current
    const pageSwitcherReference = this.pageSwitcherReference.current
    if (pageSwitcher && pageSwitcherReference) {
      const clientHeight = pageSwitcher.clientHeight
      const boundingClientRect = pageSwitcherReference.getBoundingClientRect()

      if (clientHeight + boundingClientRect.y > windowHeight) {
        this.setState({
          position: POSITION.TOP,
          show: true
        })
      } else {
        this.setState({
          position: POSITION.BOTTOM,
          show: true
        })
      }
    }
  }

  render () {
    const {canNext, canPrevious, onPageChange, page, pages, pageSize, totalDataCount, data} = this.props
    const dataLength = totalDataCount || data.length
    const currentStartingIndex = getFirstPageIndex(page, pageSize, dataLength)
    const currentEndingIndex = getLastPageIndex(page, pageSize, dataLength)

    const pagesOptions = []
    for (let i = 0; i < pages; i++) {
      const currentStartingIndex = getFirstPageIndex(i, pageSize, dataLength)
      const currentEndingIndex = getLastPageIndex(i, pageSize, dataLength)
      pagesOptions.push(`${currentStartingIndex}-${currentEndingIndex} of ${dataLength}`)
    }
    return (
      <div className={style.pagination}>
        <span className={style.description} onMouseEnter={this.adjustSwitcherPosition}>
          <label>{currentStartingIndex}-{currentEndingIndex} of {dataLength}</label>
          {pages > 1 && (
            <Fragment>
              <span className={style['switcher-reference']} ref={this.pageSwitcherReference} />
              <div position={this.state.position} ref={this.pageSwitcher}
                onMouseLeave={this.descriptionMouseLeave}
                className={[style['page-switcher'], this.state.show ? style['hover'] : undefined].join(' ')}>
                {pagesOptions
                  .map((pageText, i) => (
                    <div key={pageText} onClick={onPageChange.bind(null, i)}
                      currentpage={(i === page).toString()}>{pageText}</div>)
                  )
                }
              </div>
            </Fragment>
          )
          }
        </span>
        <div className={style.arrows}>
          <i enabled={canPrevious.toString()} onClick={() => canPrevious && onPageChange(page - 1)}
            className='fa fa-angle-left' />
          <i enabled={canNext.toString()} onClick={() => canNext && onPageChange(page + 1)}
            className='fa fa-angle-right' />
        </div>
      </div>
    )
  }
}
