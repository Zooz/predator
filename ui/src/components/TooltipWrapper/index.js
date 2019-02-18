import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import css from './style.scss';
import BodyPortal from '../BodyPortal'
import classnames from 'classnames'
import Tooltip from 'react-tooltip';

export const DIRECTION = {
  left: 'left',
  top: 'top',
  right: 'right',
  bottom: 'bottom'
};

const TooltipWrapper = ({ children, dataId, className, content, place, effect, shouldShow, disable, ...rest }) => {
  const isValidElement = React.isValidElement(children);
  return (shouldShow
    ? <Fragment>
      {isValidElement
        ? React.cloneElement(children, { 'data-tip': true, 'data-for': dataId })
        : <span data-tip data-for={dataId}>{children}</span>
      }
      <BodyPortal>
        <Tooltip
          place={place}
          id={dataId}
          type='light'
          effect={effect}
          className={classnames(css[ 'tooltip' ], className)}
          disable={disable}
          {...rest}
        >
          {content}
        </Tooltip>
      </BodyPortal>
    </Fragment>
    : <Fragment>{children}</Fragment>
  );
}
TooltipWrapper.propTypes = {
  dataId: PropTypes.string.isRequired,
  className: PropTypes.string,
  place: PropTypes.oneOf(Object.values(DIRECTION)),
  effect: PropTypes.oneOf([ 'float', 'solid' ]),
  shouldShow: PropTypes.bool
}

TooltipWrapper.defaultProps = {
  place: DIRECTION.left,
  effect: 'solid',
  shouldShow: true
}

export default TooltipWrapper;
