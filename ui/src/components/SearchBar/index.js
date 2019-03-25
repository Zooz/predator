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
                <TitleInput title={'Search'} className={style.input}>
                    <Input className={style.input} onChange={(event) => this.setState({value: event.target.value})}/>
                </TitleInput>
                <Button hover onClick={()=>{onSearch(this.state.value)}}>Search</Button>
            </div>
        )
    }
}

export default SearchBar;
