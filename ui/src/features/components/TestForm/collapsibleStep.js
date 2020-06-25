import React from 'react';
import CollapsibleItem from '../../../components/CollapsibleItem/CollapsibleItem';
import StepForm from './StepForm';
import SleepForm from "./SleepForm";

const Section = CollapsibleItem.Section;
const SLEEP = 'sleep';
export default class CollapsibleStep extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        }
    }

    render() {
        const {
            onDuplicateStep,
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
            icon={this.generateIcon()}
            title={this.generateTitle()}
            body={this.generateBody()}
            sections={sections}
        />)

    }

    generateIcon = () => {
        const {step} = this.props;
        if (step.type === SLEEP) {
            return 'fa-cloock-o'
        }
        return 'fa-flash'
    };

    generateTitle = () => {
        const {step} = this.props;
        if (step.type === SLEEP) {
            return `SLEEP ${step.sleep} SECONDS`
        }
        return `${step.method} ${step.url}`
    };

    generateBody = () => {
        const {index, onChangeValueOfStep, processorsExportedFunctions, step} = this.props;
        return (
            <div style={{padding: '10px'}}>
                {
                    step.type === SLEEP &&
                    <SleepForm step={step}
                               index={index}
                               onChangeValue={onChangeValueOfStep}
                    />
                    || <StepForm step={step}
                                 index={index}
                                 onChangeValue={onChangeValueOfStep}
                                 processorsExportedFunctions={processorsExportedFunctions}
                                 type
                    />

                }


            </div>


        )
    }

}



