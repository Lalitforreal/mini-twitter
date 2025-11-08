const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
//diskstorage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function(err,data){
        fn = data.toString("hex") + path.extname(file.originalname);
        cb(null, fn)
    })
  }
})

//upload var to export it
const upload = multer({ storage: storage })
module.exports = upload;