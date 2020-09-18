import TooltipWrapper from "../../../components/TooltipWrapper";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";
import React from "react";


const InfoToolTip = ({data})=> {
    if (!data || !data.info) {
        return null;
    }
    return (<TooltipWrapper
        content={
            <div>
                {data.info}
            </div>}
        dataId={`tooltipKey_${data.key}`}
        place='top'
        offset={{top: 1}}
    >
            <div data-tip data-for={`tooltipKey_${data.info}`} style={{cursor: 'pointer'}}>
            <FontAwesomeIcon style={{color: '#557eff', fontSize: '13px'}} icon={faQuestionCircle}/>
        </div>

    </TooltipWrapper>);
}

export default InfoToolTip
