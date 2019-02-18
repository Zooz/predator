
const replace = require('replace-in-file');
const config = require('./config/serviceConfig');

module.exports = () => {
    const options = {
        files: __dirname + '/../ui/dist/*.js',
        from: /CHANGE_ME_TO_EXTERNAL_ADDRESS/g,
        to: config.externalAddress
    };

    return replace(options)
        .then(changes => {
            console.log('Modified files:', changes.join(', '));
        }).catch(error => {
            console.error('Error when init external api on the portal occurred:', error);
        });
};
