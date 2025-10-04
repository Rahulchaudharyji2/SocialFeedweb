require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const upload = multer({ dest: 'uploads/' });
const app = express();
const PORT = process.env.PORT || 4000;

app.post('/upload-pinata', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const resp = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_API_SECRET
        }
      }
    );

    // cleanup temporary file
    fs.unlinkSync(filePath);

    // resp.data.IpfsHash etc
    return res.json({
      ok: true,
      ipfsHash: resp.data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${resp.data.IpfsHash}`
    });
  } catch (e) {
    console.error(e.response?.data || e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

app.listen(PORT, () => console.log(`Pinata upload server running on ${PORT}`));
