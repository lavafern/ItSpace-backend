require("dotenv").config()
const ImageKit = require("imagekit");
const {IMAGEKIT_PUBLIC_KEY,IMAGEKIT_PRIVATE_KEY} = process.env
// SDK initialization

const imagekit = new ImageKit({
    publicKey : IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : "https://ik.imagekit.io/itspace"
    
});

module.exports = imagekit