import React, {PureComponent} from 'react';
import {
    PieChart, Pie, Legend, Tooltip, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default class Example extends PureComponent {
    render() {
        const {
            data = [], width, height
        } = this.props;

        return (
            <PieChart width={width || 400} height={height || 400}>
                <Pie dataKey="value" isAnimationActive={false} data={data} cx={'50%'} cy={'50%'} innerRadius={0} label>
                    {
                        data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>)
                    }
                </Pie>
                <Tooltip/>
            </PieChart>
        );
    }
}
