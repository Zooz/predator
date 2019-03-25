import React from 'react'
import { storiesOf } from '@storybook/react'
import { text, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import docDecorator from '../../../../.storybook/doc/decorator'
import { TableHeader } from './../../index'
import readme from './TableHeader.md'

const stories = storiesOf('Table/Header', module)
stories.addDecorator(docDecorator(readme))

stories.add('TableHeader', () => (
  <TableHeader
    sortable={boolean('sortable', true)}
    up={boolean('up', true)}
    down={boolean('down', false)}
    onClick={action('header click')}
  >
    {text('header text', 'Text')}
  </TableHeader>
))
