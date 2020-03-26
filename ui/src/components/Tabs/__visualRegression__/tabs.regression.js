import React from 'react'
import { storiesOf } from '@storybook/react'
import Tabs from '../Tabs.export'

export const storyKind = 'Tabs'
export const storyName = 'default'

const stories = storiesOf(storyKind, module)
const { TabPane } = Tabs

stories.add(storyName, () => (
  <Tabs>
    {
      Array.from(Array(3).keys()).map((idx) => {
        const tabName = `Tab-${idx}`
        const key = idx.toString()
        return (
          <TabPane tab={tabName} key={key}>
            {`Tab content ${idx}`}
          </TabPane>
        )
      })
    }
  </Tabs>
))
