import React from 'react'
import { storiesOf } from '@storybook/react'
import {text, number} from '@storybook/addon-knobs'
import docDecorator from '../../../../.storybook/doc/decorator'
import {SearchResults} from './../../index'
import readme from './SearchResults.md'

const stories = storiesOf('Table/SearchResults', module)
stories.addDecorator(docDecorator(readme))

stories.add('SearchResults', () => (
  <SearchResults
    prefix={text('prefix')}
    suffix={text('suffix')}
  >
    {number('results', 0)}
  </SearchResults>
))
