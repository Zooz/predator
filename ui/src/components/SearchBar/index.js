import React from 'react'
import style from './style.scss'
import Button from '../Button'
import TitleInput from '../TitleInput'
import Input from '../Input'
class SearchBar extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            value:''
        }
    }

    render () {
        const { onSearch, description, children } = this.props;
        return (
            <div className={style.wrapper}>
                <div className={style['title-wrapper']}>
                <TitleInput title={'Search'}>
                    <Input className={style.input} onChange={(event) => this.setState({value: event.target.value})}/>
                </TitleInput>
                </div>
                <Button hover className={style['button']} onClick={()=>{onSearch(this.state.value)}}>Search</Button>
            </div>
        )
    }
}

export default SearchBar;
