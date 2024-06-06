import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      // it is not good to upload file as file.originalname because
      // maybe user upload 5 file with same name
      // do console.log(file)
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ storage }) 
// In ES6 if both are same we write like this 
// export const upload = multer({storage }) 