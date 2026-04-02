import multer from "multer";
import path from "path";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf"];
    const allowedExtensions = [".pdf"];

    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type: only PDFs are allowed"));
    }

    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Invalid file extension: only .pdf is allowed"));
    }

    cb(null, true);
  },
});