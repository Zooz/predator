import React from 'react';
import DragableWrapper from './dragableWrapper';
import Button from '../Button';
import classnames from 'classnames';
import style from './scenarioList.scss';
import CollapsibleItem from '../../../components/CollapsibleItem/CollapsibleItem';
import StepForm from './StepForm';

const actions = ['Delete', 'Duplicate'];
const Section = CollapsibleItem.Section

const sections = [

    <Section key={2} borderLeft icon='fa-chevron-circle-right' tooltip={<div>asdasd</div>}>
        Hover me!
    </Section>,
    <Section key={3} borderLeft>Section3</Section>,
    <Section key={4} icon='fa-cc-visa' borderLeft>Section4</Section>
]
export default class CollapsibleStep extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        }
    }

    /*TODO
    * generate icons for duplicate / delete
    *
    * */
    render() {

        // this.props.step;
        const {
            step, onDuplicateStep,
            onDeleteStep, index
        } = this.props;
        const sections = [
            <Section key={1} onClick={(evt) => {
                evt.stopPropagation();
                onDuplicateStep(index)
            }} icon='fa-copy' tooltip='Duplicate step'/>,
            <Section key={2} onClick={(evt) => {
                evt.stopPropagation();
                onDeleteStep(index)
            }} icon='fa-trash' tooltip='Delete step' borderLeft/>,
        ]
        const {expanded} = this.state;
        return (<CollapsibleItem
            onClick={() => {
                this.setState({expanded: !this.state.expanded})
            }}
            editable={true}
            expanded={expanded}
            toggleable={true}
            type={CollapsibleItem.TYPES.CLICKER}
            disabled={false}
            icon={'fa-flash'}
            title={`${step.method} ${step.url}`}
            body={this.generateBody()}
            sections={sections}
        />)

    }

    generateBody = () => {
        const {index, onChangeValueOfStep, processorsExportedFunctions} = this.props;
        return (
            <div style={{padding: '10px'}}>
                <StepForm step={this.props.step}
                          index={index}
                          onChangeValue={onChangeValueOfStep}
                          processorsExportedFunctions={processorsExportedFunctions}/>
            </div>


        )
    }

}
