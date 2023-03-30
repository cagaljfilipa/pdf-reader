import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [images, setImages] = useState([]);

  async function onDocumentLoadSuccess(pdf) {
    const numPages = pdf.numPages;
    setNumPages(numPages);
  
    const imagePromises = [];
  
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
  
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
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
  
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
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
  
  

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
    }
    console.log(file, 'file')
  }

  function renderPages() {
    return images.map((image, index) => (
      <img key={`page_${index + 1}`} src={image} alt={`Page ${index + 1}`} style={{ width: '500px' }} />
    ));
  }
  
  return (
    <div className="App">
      <input type="file" accept=".pdf" onChange={handleFileUpload} />
      {file && (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {renderPages()}
        </Document>
      )}
    </div>
  );
}

export default App;
