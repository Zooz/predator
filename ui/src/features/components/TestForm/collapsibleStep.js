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
        const {step} = this.props;
        console.log('step', JSON.stringify(step))
        const sections = [
            <Section key={1} icon='fa-warning' tooltip='I am a tooltip'/>,
        ]
        console.log('step', step);
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
        return (
            <div style={{padding: '10px'}}>
                <StepForm step={this.props.step}/>
            </div>


        )
    }

}
