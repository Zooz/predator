import React from 'react';
import DragableWrapper from './dragableWrapper';
import Button from '../Button';
import classnames from 'classnames';
import style from './scenarioList.scss';
import CollapsibleItem from '../../../components/CollapsibleItem/CollapsibleItem';
import StepForm from './StepForm';
import AddScenarioForm from "./addScenarioForm";

const actions = ['Delete', 'Duplicate'];
const Section = CollapsibleItem.Section

const sections = [

    <Section key={2} borderLeft icon='fa-chevron-circle-right' tooltip={<div>asdasd</div>}>
        Hover me!
    </Section>,
    <Section key={3} borderLeft>Section3</Section>,
    <Section key={4} icon='fa-cc-visa' borderLeft>Section4</Section>
]
export default class CollapsibleScenarioConfig extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        }
    }

    render() {

        // this.props.step;
        const {
            onDeleteScenario,
            onDuplicateScenario
        } = this.props;
        const sections = [
            <Section key={1} onClick={(evt) => {
                evt.stopPropagation();
                onDuplicateScenario()
            }} icon='fa-copy' tooltip='Duplicate scenario'/>
        ]

        if(onDeleteScenario){
            sections.push( <Section key={2} onClick={(evt) => {
                evt.stopPropagation();
                onDeleteScenario()
            }} icon='fa-trash' tooltip='Delete scenario' borderLeft/>)
        }

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
            icon={'fa-cog'}
            title={`Scenario Configuration`}
            body={this.generateBody()}
            sections={sections}
        />)

    }

    generateBody = () => {
        const {processorsExportedFunctions,currentScenarioIndex,scenario,onChangeValueOfScenario,allowedWeight } = this.props;
        return (
            <div style={{padding: '10px'}}>
                <AddScenarioForm allowedWeight={allowedWeight}
                                 key={currentScenarioIndex}
                                 scenario={scenario} onChangeValue={onChangeValueOfScenario}
                                 processorsExportedFunctions={processorsExportedFunctions}/>
            </div>


        )
    }

}
