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

              // Use Hugging Face model for image description or analysis (Vision + Text)
              const imageProcessingResponse = await client.chatCompletion({
                model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: "Describe this image in one sentence." },
                      { type: "image_url", image_url: { url: publicImageUrl } }
                    ]
                  }
                ],
                max_tokens: 500
              });

              console.log("Image Description:", imageProcessingResponse);
              const resultText = imageProcessingResponse.choices[0]?.message?.content || 'No description available';

              alert(`Image Description: ${resultText}`);
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
