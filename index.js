import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import cors from 'cors';
const app = express();
const port = 3000;
app.use(cors(
    {
        origin: "*",
    }
));
const genAI = new GoogleGenerativeAI("AIzaSyAyxaBagjX2gAkoNlq7KuRelw7scYLdxU4");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send("helo world")
});

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;

    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = "Extract the text from the given image";

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);

    // Determine the MIME type of the image
    const mimeType = mime.lookup(imagePath);

    if (!mimeType || !mimeType.startsWith("image/")) {
      return res.status(400).send("Unsupported image format");
    }

    // Convert the image file to base64
    const imageBase64 = imageBuffer.toString('base64');

    // Generate content using the image
    const result = await model.generateContent([prompt, { inlineData: { data: imageBase64, mimeType } }]);
    const response = await result.response;
    const text = response.text();

    // Send the extracted text as the response
    res.status(200).send(text);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
