import TitleInput from "../../../components/TitleInput";
import Input from "../../../components/Input";
import RectangleAlignChildrenLeft from "../../../components/RectangleAlign/RectangleAlignChildrenLeft";
import React, {useState} from "react";
import {EVENTS, WEBHOOK_TYPES} from "./constatns";
import SimpleTable from "../SimpleTable";
import RadioOptions from "../../../components/RadioOptions";
import UiSwitcher from "../../../components/UiSwitcher";
import SubmitBar from '../SubmitBar'
import InfoToolTip from '../InfoToolTip';

const WebhookForm = ({loading, onSubmit, onCancel, onChangeWebhook, webhook}) => {

    const onChangeProps = (props) => {
        const newWebhook = {...webhook, ...props};
        onChangeWebhook(newWebhook)
    };

    const rows = EVENTS.map((event, index) => {
        return [
            <div key={'header' + index}>{event}</div>,
            <UiSwitcher
                key={index}
                onChange={(value) => {
                    const newWebhook = {...webhook};
                    newWebhook.events[event] = value;
                    onChangeWebhook(newWebhook)
                }}
                disabledInp={loading}
                activeState={webhook.events[event]}
                height={12}
                width={22}
            />,
        ]
    });

    return (
        <div style={{padding: '10px', display: 'flex', flexDirection: 'column'}}>
            <RectangleAlignChildrenLeft style={{marginBottom: '10px'}}>
                <TitleInput style={{marginRight: '10px', flexGrow: 2}} title={'Name'}>
                    <Input disabled={loading} value={webhook.name} onChange={(evt) => {
                        onChangeProps({name: evt.target.value})
                    }}/>
                </TitleInput>
                <TitleInput style={{marginRight: '10px', flexGrow: 2}} title={'Url'}>
                    <Input disabled={loading} value={webhook.url} onChange={(evt) => {
                        onChangeProps({url: evt.target.value})
                    }}/>
                </TitleInput>

            </RectangleAlignChildrenLeft>
            <SimpleTable style={{paddingLeft: '40px', paddingRight: '40px', marginBottom: '5px'}}
                         headers={['Event', 'On/Off']} rows={rows}/>
            <TitleInput style={{marginRight: '10px', marginBottom: '5px', flexGrow: 1}} title={'Type'}>
                <RadioOptions value={webhook.format_type} list={WEBHOOK_TYPES}
                              onChange={(value) => {
                                  onChangeProps({format_type: value})
                              }}/>
            </TitleInput>
            <TitleInput labelStyle={{marginBottom: 0}} style={{marginRight: '10px'}} width={'96px'} title={'Global'}
                        rightComponent={
                            <div style={{
                                display: 'flex', width: '45px',
                                justifyContent: 'space-between'
                            }}>
                                <UiSwitcher
                                    onChange={(value) => {
                                        const newWebhook = {...webhook};
                                        newWebhook.global = value;
                                        onChangeWebhook(newWebhook)
                                    }}
                                    disabledInp={loading}
                                    activeState={webhook.global}
                                    height={12}
                                    width={22}
                                />
                                <InfoToolTip data={{key: 'global_info', info: 'Is this webhook configured on all system tests'}}/>
                            </div>
                        }
            />
            <SubmitBar onCancel={onCancel} onSubmit={onSubmit} loading={loading}/>
        </div>
    )

};

export default WebhookForm;
