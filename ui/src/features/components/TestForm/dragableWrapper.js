import * as React from 'react'
import {findDOMNode} from 'react-dom'
import {
    DragSource,
    DropTarget,
    ConnectDropTarget,
    ConnectDragSource,
    DropTargetMonitor,
    DropTargetConnector,
    DragSourceConnector,
    DragSourceMonitor
} from 'react-dnd'

const style = {
    border: '1px dashed gray',
    padding: '0.5rem 1rem',
    marginBottom: '.5rem',
    backgroundColor: 'white',
    cursor: 'move'
}

const cardSource = {
    beginDrag(props) {
        return {
            id: props.id,
            index: props.index
        }
    }
};

const cardTarget = {
    hover(props, monitor, component) {
        if (!component) {
            return null
        }
        const dragIndex = monitor.getItem().index;
        const hoverIndex = props.index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
            return
        }

        // Determine rectangle on screen
        const hoverBoundingRect = (findDOMNode(component)).getBoundingClientRect();

        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
            return
        }

        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
            return
        }

        // Time to actually perform the action
        props.move(dragIndex, hoverIndex)

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        monitor.getItem().index = hoverIndex
    }
};

class Card extends React.Component {
    render() {
        const {
            isDragging,
            connectDragSource,
            connectDropTarget,
            children
        } = this.props;
        const opacity = isDragging ? 0 : 1;
        return connectDragSource(
            connectDropTarget(<div style={{width:'100%'}}>{children}</div>)
        )
    }
}

export default DropTarget(
    'card',
    cardTarget,
    (connect) => ({
        connectDropTarget: connect.dropTarget()
    })
)(
    DragSource(
        'card',
        cardSource,
        (connect, monitor) => ({
            connectDragSource: connect.dragSource(),
            isDragging: monitor.isDragging()
        })
    )(Card))


