import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBars,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faMoon,
  faSun,
  faComments
} from '@fortawesome/free-solid-svg-icons'

import style from './style.scss'
import history from '../../../store/history'
import logo from '../../../images/logo.png'
import { VERSION } from '../../../App/common/env'

const THEME_KEY = 'predator-theme'
const COLLAPSE_KEY = 'predator-rail-collapsed'
const MOBILE_QUERY = '(max-width: 900px)'
const FEEDBACK_URL = 'https://docs.google.com/forms/d/15dozkkA2xBUV7T7ls5XMyBj-JDg5Tj-TXNMp9PkdFsM/viewform?edit_requested=true'

const readStored = (key) => {
  try {
    return window.localStorage.getItem(key)
  } catch (e) {
    return null // private browsing
  }
}

const writeStored = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch (e) { /* non-fatal */ }
}

// Resolve what the user is actually looking at: an explicit choice wins, otherwise
// the OS preference decides.
const resolveTheme = () => {
  const stored = readStored(THEME_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

class DrawerE extends Component {
  constructor (props) {
    super(props)
    this.state = {
      theme: resolveTheme(),
      collapsed: readStored(COLLAPSE_KEY) === 'true',
      mobileOpen: false,
      isMobile: window.matchMedia ? window.matchMedia(MOBILE_QUERY).matches : false,
      expanded: {}
    }
  }

  componentDidMount () {
    if (window.matchMedia) {
      this.mobileMq = window.matchMedia(MOBILE_QUERY)
      this.onViewportChange = (e) => this.setState({ isMobile: e.matches, mobileOpen: false })
      this.mobileMq.addEventListener('change', this.onViewportChange)
    }
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount () {
    if (this.mobileMq) {
      this.mobileMq.removeEventListener('change', this.onViewportChange)
    }
    document.removeEventListener('keydown', this.onKeyDown)
  }

  // Escape closes the overlay rail — a sheet always needs a way out.
  onKeyDown = (e) => {
    if (e.key === 'Escape' && this.state.mobileOpen) {
      this.setState({ mobileOpen: false })
    }
  }

  toggleTheme = () => {
    const theme = this.state.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    writeStored(THEME_KEY, theme)
    this.setState({ theme })
  }

  toggleCollapsed = () => {
    const collapsed = !this.state.collapsed
    writeStored(COLLAPSE_KEY, String(collapsed))
    this.setState({ collapsed })
  }

  navigate = (navigateTo) => {
    history.push(`/${navigateTo}`)
    if (this.state.isMobile) {
      this.setState({ mobileOpen: false })
    }
  }

  toggleGroup = (key) => {
    this.setState(prev => ({ expanded: { ...prev.expanded, [key]: !prev.expanded[key] } }))
  }

  isCurrent = (navigateTo) => {
    const { url } = this.props
    return Boolean(navigateTo) && url.includes(navigateTo)
  }

  renderItem = (item) => {
    const hasChildren = Boolean(item.nestedItems && item.nestedItems.length)
    const isOpen = Boolean(this.state.expanded[item.key])
    const current = this.isCurrent(item.navigateTo)
    // Collapsed rail hides labels, so the accessible name has to come from title/aria.
    const iconOnly = this.state.collapsed && !this.state.isMobile

    return (
      <React.Fragment key={item.key}>
        <button
          type='button'
          className={classnames(style.item, { [style['item--active']]: current })}
          aria-current={current ? 'page' : undefined}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-label={iconOnly ? item.primaryText : undefined}
          title={iconOnly ? item.primaryText : undefined}
          onClick={() => hasChildren ? this.toggleGroup(item.key) : this.navigate(item.navigateTo)}
        >
          <span className={style.item__icon}>
            <FontAwesomeIcon icon={item.icon} />
          </span>
          <span className={style.item__label}>{item.primaryText}</span>
          {hasChildren && !iconOnly && (
            <span className={style.item__icon} style={{ marginLeft: 'auto' }}>
              <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />
            </span>
          )}
        </button>

        {hasChildren && isOpen && (
          <div className={style.sub}>
            {item.nestedItems.map(child => (
              <button
                type='button'
                key={child.key}
                className={classnames(style.item, { [style['item--active']]: this.isCurrent(child.navigateTo) })}
                aria-label={iconOnly ? child.primaryText : undefined}
                title={iconOnly ? child.primaryText : undefined}
                onClick={() => child.linkUrl
                  ? window.open(child.linkUrl, '_blank', 'noopener,noreferrer')
                  : this.navigate(child.navigateTo)}
              >
                {child.icon && (
                  <span className={style.item__icon}>
                    <FontAwesomeIcon icon={child.icon} />
                  </span>
                )}
                <span className={style.item__label}>{child.primaryText}</span>
              </button>
            ))}
          </div>
        )}
      </React.Fragment>
    )
  }

  render () {
    const { listItemData, children } = this.props
    const { theme, collapsed, mobileOpen, isMobile } = this.state
    const dark = theme === 'dark'

    return (
      <div className={style.shell}>
        <nav
          className={classnames(style.rail, {
            [style['rail--collapsed']]: collapsed,
            [style['rail--open']]: mobileOpen
          })}
          aria-label='Main navigation'
          aria-hidden={isMobile && !mobileOpen ? 'true' : undefined}
        >
          <div className={style.brand}>
            <img className={style.brand__mark} src={logo} alt='' />
            <span className={style.brand__name}>predator</span>
          </div>

          <div className={style.nav}>
            {listItemData.map(this.renderItem)}
          </div>

          <div className={style.foot}>
            <span className={style.foot__version}>v{VERSION}</span>
            <button
              type='button'
              className={style['chrome-button']}
              aria-label='Send feedback'
              title='Send feedback'
              onClick={() => window.open(FEEDBACK_URL, '_blank', 'noopener,noreferrer')}
            >
              <FontAwesomeIcon icon={faComments} />
            </button>
            <button
              type='button'
              className={style['chrome-button']}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={this.toggleTheme}
            >
              <FontAwesomeIcon icon={dark ? faSun : faMoon} />
            </button>
            <button
              type='button'
              className={classnames(style['chrome-button'], style['collapse-button'])}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              onClick={this.toggleCollapsed}
            >
              <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
            </button>
          </div>
        </nav>

        {isMobile && mobileOpen && (
          <button
            type='button'
            className={style.scrim}
            aria-label='Close navigation'
            onClick={() => this.setState({ mobileOpen: false })}
          />
        )}

        <div className={style.main}>
          {/* The top bar exists only to carry the hamburger — desktop hides it
              (see .topbar in style.scss) so content runs full height. */}
          <header className={style.topbar}>
            <button
              type='button'
              className={classnames(style['topbar-button'], style['menu-button'])}
              aria-label='Open navigation'
              aria-expanded={mobileOpen}
              onClick={() => this.setState({ mobileOpen: !mobileOpen })}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <span className={style.topbar__spacer} />

            <button
              type='button'
              className={style['topbar-button']}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={this.toggleTheme}
            >
              <FontAwesomeIcon icon={dark ? faSun : faMoon} />
            </button>
          </header>

          <main className={style.content}>
            {children || null}
          </main>
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    url: state.router.location.pathname
  }
}

export default connect(mapStateToProps)(DrawerE)
