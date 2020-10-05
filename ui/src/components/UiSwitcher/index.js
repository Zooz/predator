import React from 'react'
import PropTypes from 'prop-types'
import css from './UiSwitcher.scss'

const UiSwitcher = (props) => {
    const {disabledInp, height, activeState, onChange, style} = props
    const ballSize = height - 2
    const switcherWidth = Math.ceil(2.333 * height)
    const switcherSpace = switcherWidth - 2 - ballSize

    return (
        <div className={css['switch-container']} data-active={String(activeState)} style={{
            '--switch-space': `${switcherSpace}px`,
            '--ball-size': `${ballSize}px`,
            ...style
        }}>
            <label style={{marginBottom: 0}}>
                <input
                    checked={activeState}
                    onChange={() => onChange(!activeState)}
                    className={css['switch']}
                    disabled={disabledInp}
                    type='checkbox'/>
                <div className={`${css['switch-container']} ${activeState ? css['onColor'] : css['offColor']}`}
                     style={{height: `${height}px`, width: `${switcherWidth}px`}}>
                    <div className={css['switch-ball']}/>
                </div>
            </label>
        </div>
    )
}

UiSwitcher.propTypes = {
    activeState: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    disabledInp: PropTypes.bool,
    css: PropTypes.object,
    height: PropTypes.number
}

UiSwitcher.defaultProps = {
    height: 30,
    activeState: false,
    disabledInp: false
}

export default UiSwitcher
