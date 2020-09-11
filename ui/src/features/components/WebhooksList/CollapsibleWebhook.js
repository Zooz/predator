import React from 'react';
import CollapsibleItem from '../../../components/CollapsibleItem/CollapsibleItem';
import {EVENTS} from './constatns';
import WebhookForm  from './WebhookForm';
const Section = CollapsibleItem.Section;


export default class CollapsibleWebhook extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: true
        }
    }

    render() {
        const {
            onDuplicateStep,
            onDeleteStep, index
        } = this.props;
        const sections = [
            <Section key={1} borderLeft>
                {/*<Input style={{marginRight: '5px'}} value={this.props.step.name} placeholder={'Name'}*/}
                {/*       onClick={(evt) => {*/}
                {/*           evt.stopPropagation();*/}

                {/*       }} onChange={this.onStepNameChange}/>*/}
            </Section>,
            <Section key={2} onClick={(evt) => {
                evt.stopPropagation();
                onDuplicateStep(index)
            }} icon='fa-copy' tooltip='Duplicate step' borderLeft/>,
            <Section key={3} onClick={(evt) => {
                evt.stopPropagation();
                onDeleteStep(index)
            }} icon='fa-trash' tooltip='Delete step' borderLeft/>,

        ]
        const {expanded} = this.state;
        return (<CollapsibleItem
            onClick={(evt) => {
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
        // const {step} = this.props;
        // if (step.type === SLEEP) {
        //     return 'fa-clock-o'
        // }
        // return 'fa-flash'
    };
    onStepNameChange = (evt) => {
        // evt.stopPropagation();
        // const step = {...this.props.step};
        // step.name = evt.target.value;
        // this.props.onChangeValueOfStep(step, this.props.index)
    };
    generateTitle = () => {
        const {webhook} = this.props;
        return <div style={{
            textOverflow: 'ellipsis',
            maxWidth: '600px',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
        }}>{`${webhook.name} ${webhook.url}`}</div>
    };

    generateBody = () => {
        // const {index, onChangeValueOfStep, processorsExportedFunctions, step} = this.props;

        return (
           <WebhookForm webhook={this.props.webhook}/>
        )
    }

}



