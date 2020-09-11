import TitleInput from "../../../components/TitleInput";
import Input from "../../../components/Input";
import RectangleAlignChildrenLeft from "../../../components/RectangleAlign/RectangleAlignChildrenLeft";
import React from "react";
import {EVENTS, WEBHOOK_TYPES} from "./constatns";
import SimpleTable from "../SimpleTable";
import RadioOptions from "../../../components/RadioOptions";
import ErrorWrapper from "../../../components/ErrorWrapper";
import Button from "../../../components/Button";
import UiSwitcher from "../../../components/UiSwitcher";


const WebhookForm = ({webhook}) => {

    const rows = EVENTS.map((event) => {

        return [
            <div>{event}</div>,
            <UiSwitcher
                onChange={(value) => {
                    // onGzipToggleChanged(value)
                }}
                disabledInp={false}
                activeState={true}
                height={12}
                width={22}
            />,
        ]
    });

    return (
        <div style={{padding: '10px', display: 'flex', flexDirection: 'column'}}>
            <RectangleAlignChildrenLeft style={{marginBottom: '10px'}}>
                <TitleInput style={{marginRight: '10px', flexGrow: 2}} title={'Name'}>
                    <Input value={webhook.name} onChange={(evt) => {
                        // onInputChange({url: evt.target.value})
                    }}/>
                </TitleInput>
                <TitleInput style={{marginRight: '10px', flexGrow: 2}} title={'Url'}>
                    <Input value={webhook.url} onChange={(evt) => {
                        // onInputChange({url: evt.target.value})
                    }}/>
                </TitleInput>

            </RectangleAlignChildrenLeft>
            <SimpleTable style={{paddingLeft: '40px', paddingRight: '40px'}} headers={['Event', 'On/Off']} rows={rows}/>
            <TitleInput style={{marginRight: '10px', flexGrow: 1}} title={'Type'}>
                <RadioOptions value={WEBHOOK_TYPES[0]} list={WEBHOOK_TYPES}
                              onChange={(value) => {
                              }}/>
            </TitleInput>
            <div style={{alignSelf: 'flex-end'}}>
                <Button spinner={false} hover disabled={false}
                        onClick={() => {
                        }}>Submit</Button>
            </div>
        </div>
    )

};

export default WebhookForm;
