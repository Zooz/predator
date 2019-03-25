import React from 'react'
import { storiesOf } from '@storybook/react'
import { number, boolean, text } from '@storybook/addon-knobs'
import docDecorator from '../../../.storybook/doc/decorator'
import { NumericInput } from '../../index'
import { action } from '@storybook/addon-actions'
import readme from './USAGE.md'

const inputStories = storiesOf('Inputs/NumericInput', module)
inputStories.addDecorator(docDecorator(readme))

inputStories
  .add('Regular', () => (
    <NumericInput
      maxValue={number('max value', 5)}
      minValue={number('min value', -2)}
      onChange={action('value:')}
      disabled={boolean('disabled', false)}
      error={boolean('error', false)}
      hideNumber={boolean('hideNumber', false)}
      height={text('height', '26px')}
      width={text('width', '56px')}
    />
  ))
  .add('Formatted', () => (
    <NumericInput
      formatter={(value) => `${value}%`}
      maxValue={number('max value', 100)}
      minValue={number('min value', 0)}
      onChange={action('value:')}
      disabled={boolean('disabled', false)}
      error={boolean('error', false)}
      hideNumber={boolean('hideNumber', false)}
      height={text('height', '26px')}
      width={text('width', '56px')}
    />
  ))
