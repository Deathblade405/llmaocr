import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { HfInference } from "@huggingface/inference";

const OCR = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Initialize Hugging Face inference client
    setClient(new HfInference("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"));
  }, []);

  // Function to start video streaming
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // Function to capture image and process it
  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (blob) {
            // Upload the Blob to your server
            const formData = new FormData();
            formData.append('image', blob, 'image.png');

            try {
              const uploadResponse = await axios.post('https://auth.scinovas.com:5004/ocr', formData);
              const publicImageUrl = 'https://auth.scinovas.com:5004/ocrImage/' + uploadResponse.data.url;

              // Use Hugging Face model for OCR or image analysis (ensure model is capable)
              const imageProcessingResponse = await client.imageClassification({
                model: "google/vit-base-patch16-224-in21k", // Replace with a suitable model for OCR or vision task
                inputs: publicImageUrl,
              });

              console.log("OCR Result:", imageProcessingResponse);
              const detectedText = imageProcessingResponse[0]?.label || 'No text detected';

              alert(`Detected Text: ${detectedText}`);
            } catch (error) {
              console.error("Error uploading or processing image:", error);
            }
          }
        }, 'image/png');
      }
    }
  };

  return (
    <div>
      <h1>Capture Image and Process OCR</h1>
      <video ref={videoRef} style={{ width: "100%" }}></video>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <button onClick={startVideo}>Start Camera</button>
      <button onClick={captureImage}>Capture Image</button>
    </div>
  );
};

export default OCR;
