

import React from 'react';
import DragableWrapper from './dragableWrapper';
import Button from '../Button';
import classnames from 'classnames';
import style from './scenarioList.scss';
import CollapsibleStep from './collapsibleStep';
import CollapsibleItem from '../../../components/CollapsibleItem/CollapsibleItem';

const actions = ['Delete', 'Duplicate'];
const Section = CollapsibleItem.Section

const sections = [

    <Section key={2} borderLeft icon='fa-chevron-circle-right' tooltip={<div>asdasd</div>}>
        Hover me!
    </Section>,
    <Section key={3} borderLeft>Section3</Section>,
    <Section key={4} icon='fa-cc-visa' borderLeft>Section4</Section>
]
/*TODO add here drag and drop*/
export default class StepsList extends React.Component {
    constructor(props) {
        super(props);
    }

    render(){

            return ( <div style={{width:'100%',display:'flex',alignItems:'center',flexDirection:'column',height:'100%',padding:'20px'/*,overflow:'auto'*/}}>

                    {
                        this.props.steps.map((step)=>{

                            return (
                                <div style={{width:'70%'}}>
                                    <CollapsibleStep
                                        step={step}
                                    />
                                </div>
                            )
                    })

                    }
            </div>)

    }

}
