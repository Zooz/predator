import React from 'react'
import { storiesOf } from '@storybook/react'
import { text } from '@storybook/addon-knobs'
import docDecorator from '../../../../.storybook/doc/decorator'
import { NoMoreResults } from './../../index'
import readme from './NoMoreResults.md'

const stories = storiesOf('Table/NoMoreResults', module)
stories.addDecorator(docDecorator(readme))

stories.add('SearchResults', () => (
  <NoMoreResults
    text={text('text')}
  />
))
