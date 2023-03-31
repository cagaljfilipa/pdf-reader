import React, { useState, useEffect } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  async function onDocumentLoadSuccess(pdf) {
    const numPages = pdf.numPages;
    setNumPages(numPages);

    const imagePromises = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const renderTask = page.render(renderContext);
      imagePromises.push(renderTask.promise);
    }

    await Promise.all(imagePromises);
    const imagesArray = imagePromises.map(async (_, i) => {
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 1 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL();
    });

    setImages(await Promise.all(imagesArray));
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
    }
  }

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  async function sendImages(images) {
    const formData = new FormData();
    images.forEach((image, index) => {
      const blob = dataURLtoBlob(image);
      formData.append(`file[]`, blob, `image${index}.png`);
    });
    const response = await fetch(
      "http://localhost:8080/comic-book-reader/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    return data;
  }

  useEffect(() => {
    if (images.length > 0) {
      setLoading(true); // Postavljanje učitavanja na true prije slanja slika na server
      sendImages(images)
        .then((results) => {
          setLoading(false); // Postavljanje učitavanja na false kada dobijete rezultate
          setResults(results);
        })
        .catch((error) => {
          setLoading(false); // Postavljanje učitavanja na false kada se dogodi pogreška
          console.error("Error:", error.message);
        });
    }
  }, [images]);
  

  return (
    <div className="App">
      <input type="file" accept=".pdf" onChange={handleFileUpload} />
      {file && (
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess} />
      )}
      {loading && <p>Loading...</p>}{" "}
      {/* Dodano: prikazivanje poruke o učitavanju */}
      {results.length > 0 &&
        !loading && ( // Provjera da li se ne učitavaju rezultati
          <div>
            <h2>Results:</h2>
            {results.map((result, index) => (
              <p key={index}>{JSON.stringify(result)}</p>
            ))}
          </div>
        )}
    </div>
  );
}

export default App;
