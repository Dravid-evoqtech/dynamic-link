import multer from "multer";
import path from "path";

const fileFilter = (req, file, cb) => {
  // Define allowed MIME types for image files
  const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  // Define allowed MIME types for CSV files
  const allowedCSVMimeTypes = ["text/csv", "application/vnd.ms-excel"];
  // ⭐ New: Define allowed MIME types for JSON files ⭐
  const allowedJSONMimeTypes = ["application/json"];

  // Handle 'coverImage' or 'avatar' fields (for individual image uploads)
  if (file.fieldname === "coverImage" || file.fieldname === "avatarFile") {
    if (allowedImageMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept image file
    } else {
      cb(new Error("Only .jpeg, .jpg, .png, .webp image files are allowed!"), false);
    }
  }
  // Handle 'csvFile' field (for bulk upload)
  else if (file.fieldname === "csvFile") {
    if (allowedCSVMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept CSV file
    } else {
      cb(new Error("Only .csv files are allowed for bulk upload!"), false);
    }
  }
  // ⭐ New: Handle 'jsonFile' field (for bulk JSON upload) ⭐
  else if (file.fieldname === "jsonFile") {
    if (allowedJSONMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept JSON file
    } else {
      cb(new Error("Only .json files are allowed for bulk upload!"), false);
    }
  }
  // Reject any other fieldnames or unsupported file types
  else {
    cb(new Error("Unsupported file type or field name!"), false);
  }
};

const storage = multer.memoryStorage() 

// Configure upload with limits and file type filter
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});
