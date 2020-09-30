const { readFileSync, writeFileSync } = require('fs');
const { networkInterfaces } = require('os');
const envFileName = '.env';
const defaultPort = 3000;
let port, ipAddress;

extractIpAndPort();
setupEnvFile();

function extractIpAndPort() {
    if (!process.env.IP_ADDRESS) {
        console.log('IP_ADDRESS not provided, going to evaluate network interfaces for first ip which is not localhost');
        ipAddress = getFirstIpAddress();
        console.log('Found ip: ' + ipAddress);
    } else {
        console.log(`IP_ADDRESS provided ${process.env.IP_ADDRESS}`);
        ipAddress = process.env.IP_ADDRESS;
    }

    if (!process.env.PORT) {
        console.log(`PORT not provided, setting default port to ${defaultPort}`);
        port = defaultPort;
    } else {
        console.log(`PORT provided ${process.env.PORT}`);
        port = process.env.PORT;
    }
}
function setupEnvFile() {
    let envFile = '';
    try {
        envFile = readFileSync(envFileName, 'utf8');
    } catch (error) {
        console.log(`${envFileName} does not exists, will create one`);
    }
    let newEnv = envFile;
    newEnv = newEnv.replace(/^DATABASE_TYPE.*\n?/m, '');
    newEnv = newEnv.replace(/^INTERNAL_ADDRESS.*\n?/m, '');
    newEnv = newEnv.replace(/^JOB_PLATFORM.*\n?/m, '');
    newEnv = newEnv.replace(/^PORT.*\n?/m, '');

    newEnv += 'JOB_PLATFORM=DOCKER\n';
    newEnv += 'DATABASE_TYPE=SQLITE\n';
    newEnv += `INTERNAL_ADDRESS=http://${ipAddress}:${port}/v1\n`;
    newEnv += `PORT=${port}\n`;
    console.log(`Updating ${envFileName} file with:\n${newEnv}`);
    writeFileSync(envFileName, newEnv);
}
function getFirstIpAddress() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
}
