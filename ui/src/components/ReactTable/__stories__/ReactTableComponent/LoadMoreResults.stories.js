import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { text } from '@storybook/addon-knobs'
import docDecorator from '../../../../.storybook/doc/decorator'
import { LoadMoreResults } from './../../index'
import readme from './LoadMoreResults.md'

const stories = storiesOf('Table/LoadMoreResults', module)
stories.addDecorator(docDecorator(readme))

stories.add('LoadMoreResults', () => (
  <LoadMoreResults
    onClick={action('load more results')}
    text={text('text')}
  />
))
