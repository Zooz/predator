
console.log("process.env.BUCKET_PATH",process.env.BUCKET_PATH);
module.exports = {
    PREDATOR_URL: process.env.PREDATOR_URL || `${process.env.BUCKET_PATH ? process.env.BUCKET_PATH+'/' : '/'}v1`,
    BUCKET_PATH: process.env.BUCKET_PATH ? process.env.BUCKET_PATH+'/predator/' : '/predator/'
};
