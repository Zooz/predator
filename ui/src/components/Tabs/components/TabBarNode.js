import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import styles from './TabBarNode.scss'
import Label from '../../Label/Label.export.tsx'

const TabBarNode = React.forwardRef(({tabName, onTabClick, isActive}, ref) => (
    <Label
        ref={ref}
        onClick={onTabClick}
        className={styles['tab-bar-node']}
        data-test={isActive ? 'active' : 'inactive'}
        style={{width: '71px', ...(isActive ? {borderBottom: '3px solid #557eff'} : {})}}
    >
        {tabName}
    </Label>
))

TabBarNode.propTypes = {
    tabName: PropTypes.string.isRequired,
    onTabClick: PropTypes.func,
    isActive: PropTypes.bool
}

TabBarNode.defaultProps = {
    onTabClick: _.noop
}

export default TabBarNode
