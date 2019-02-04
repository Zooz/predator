let config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    timeout: process.env.SMTP_TIMEOUT || 2000
};

module.exports = config;