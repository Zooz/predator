import React from 'react'
import { storiesOf } from '@storybook/react'
import { number, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import docDecorator from '../../../../.storybook/doc/decorator'
import NumericPagination from '../../NumericPagination/NumericPagination'
import readme from './USAGE_NUMERIC.md'

const stories = storiesOf('Pagination', module)
stories.addDecorator(docDecorator(readme))

stories
  .add('NumericPagination', () => (
    <NumericPagination
      value={number('value', 1)}
      pages={number('num of pages', 10)}
      onPageChange={action('page')}
      canNext={boolean('canNext', true)}
      canPrevious={boolean('canPrevious', true)}
    />
  ))
