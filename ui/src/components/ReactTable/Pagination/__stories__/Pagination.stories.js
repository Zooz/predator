import React from 'react'
import { storiesOf } from '@storybook/react'
import { boolean, number } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import docDecorator from '../../../../.storybook/doc/decorator'
import { Pagination } from './../../../index'
import readme from './USAGE_PAGINATION.md'

const stories = storiesOf('Pagination', module)
stories.addDecorator(docDecorator(readme))

stories
  .add('Default', () => (
    <Pagination
      canNext={boolean('can next', true)}
      canPrevious={boolean('can previous', true)}
      onPageChange={action('page change')}
      page={number('page', 1)}
      pages={number('pages', 2)}
      pageSize={number('page size', 5)}
      totalDataCount={number('total data count', 10)}
    />
  ))
