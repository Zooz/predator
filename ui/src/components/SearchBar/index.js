import React from 'react'
import style from './style.scss'
import Button from '../Button'
import TitleInput from '../TitleInput'
import Input from '../Input'

class SearchBar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: ''
        }
    }

    render() {
        const {onSearch, searchSections, description, children} = this.props;
        return (
            <div className={style.wrapper}>
                <div className={style['title-wrapper']}>
                    {searchSections}
                    <TitleInput title={'Search'}>
                        <Input className={style.input} onKeyDown={this.handleEnter}
                               onChange={(event) => this.setState({value: event.target.value})}/>
                    </TitleInput>
                </div>
                <Button hover className={style['button']} onClick={() => {
                    onSearch(this.state.value)
                }}>Search</Button>
            </div>
        )
    }

    handleEnter = (e) => {
        if (e.key === 'Enter') {
            this.props.onSearch(this.state.value)
        }
    }
}

export default SearchBar;
