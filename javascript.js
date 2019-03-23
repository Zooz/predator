let dateFormat = require("dateformat");

const startTime = new Date('2019-03-21T04:49:43.000Z').getTime();
for (let i=0; i< 500; i++) {
    const time = new Date(startTime + (i*30 * 1000));
    console.log(dateFormat(time, 'h:MM:ss'));
}