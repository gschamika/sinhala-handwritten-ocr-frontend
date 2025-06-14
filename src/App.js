import React, { useState, useRef } from 'react';
import { Upload, X, Copy, Download, FileText, ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import './App.css';

const SinhalaOCRApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [convertedText, setConvertedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef(null);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
      ? 'https://web-production-3f77.up.railway.app/api'
      : 'http://localhost:5000/api';

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file format. Only JPG and PNG files are allowed.');
        return;
      }

      // Validate file size (8MB max)
      if (file.size > 8 * 1024 * 1024) {
        setError('File size too large. Maximum size is 8MB.');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setConvertedText('');
      setSuccess('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a synthetic event to reuse handleFileSelect logic
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const deleteFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setConvertedText('');
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertDocument = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/convert`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setConvertedText(data.converted_text);
        setSuccess('Document converted successfully!');
      } else {
        setError(data.error || 'Failed to convert document');
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Network error. Please make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (convertedText) {
      try {
        await navigator.clipboard.writeText(convertedText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        setError('Failed to copy text to clipboard');
      }
    }
  };

  const downloadAsPDF = async () => {
    if (!convertedText) {
      setError('No text to download');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: convertedText }),
      });

      const data = await response.json();

      if (data.success) {
        // Convert base64 to blob and download
        const byteCharacters = atob(data.pdf_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename || 'converted_sinhala_text.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSuccess('PDF downloaded successfully!');
      } else {
        setError(data.error || 'Failed to generate PDF');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to download PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="app-container">
        <div className="max-width-container">
          {/* Header */}
          <div className="header">
            <h1 className="title">
              Sinhala Handwritten Document Converter
            </h1>
            <p className="subtitle">
              Convert your handwritten Sinhala documents to digital text
            </p>
          </div>

          {/* Mobile App Download Section */}
          <div className="mobile-download-banner">
            <div className="mobile-banner-left">
              <div className="mobile-icon-circle">
                📱
              </div>
              <div className="mobile-banner-text">
                <h3>Mobile App Available!</h3>
                <p>Download our mobile app for easier document convert • Size: 8.0 MB</p>
              </div>
            </div>
            <a
                href="/sinhala-ocr-v1.0.apk"
                download
                className="mobile-download-button"
            >
              ⬇️ Download APK
            </a>
          </div>


          <div className="main-grid">
            {/* Upload Section */}
            <div className="card">
              <h2 className="card-title">
                <Upload className="icon" size={24}/>
                Upload Document
              </h2>

              {/* File Upload Area */}
              <div
                  className={`upload-area ${selectedFile ? 'has-file' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
              >
                {previewUrl ? (
                    <div className="preview-container">
                      <img
                          src={previewUrl}
                          alt="Preview"
                          className="preview-image"
                      />
                      <div className="file-actions">
                    <span className="file-name">
                      <CheckCircle className="success-icon" size={20}/>
                      {selectedFile.name}
                    </span>
                        <button
                            onClick={deleteFile}
                            className="delete-button"
                        >
                          <X className="icon" size={16}/>
                          Delete
                        </button>
                      </div>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                      <ImageIcon className="upload-icon" size={48}/>
                      <p className="upload-text">
                        Drag and drop your image here, or click to select
                      </p>
                      <p className="upload-subtext">
                        Supports JPG and PNG files (max 8MB)
                      </p>
                      <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={handleFileSelect}
                          className="file-input"
                      />
                      <button
                          onClick={() => fileInputRef.current?.click()}
                          className="upload-button"
                      >
                        Choose File
                      </button>
                    </div>
                )}
              </div>

              {/* Convert Button */}
              <div className="convert-section">
                <button
                    onClick={convertDocument}
                    disabled={!selectedFile || isLoading}
                    className={`convert-button ${!selectedFile || isLoading ? 'disabled' : ''}`}
                >
                  {isLoading ? (
                      <>
                        <Loader2 className="loading-icon" size={20}/>
                        Converting...
                      </>
                  ) : (
                      <>
                        <FileText className="icon" size={20}/>
                        Convert to Text
                      </>
                  )}
                </button>
              </div>

              {/* Status Messages */}
              {error && (
                  <div className="error-message">
                    <AlertCircle className="message-icon" size={20}/>
                    <span>{error}</span>
                  </div>
              )}

              {success && (
                  <div className="success-message">
                    <CheckCircle className="message-icon" size={20}/>
                    <span>{success}</span>
                  </div>
              )}
            </div>

            {/* Results Section */}
            <div className="card">
              <h2 className="card-title">
                <FileText className="icon" size={24}/>
                Converted Text
              </h2>

              {convertedText ? (
                  <div className="results-container">
                    {/* Text Display */}
                    <div className="text-display">
                  <pre className="converted-text">
                    {convertedText}
                  </pre>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button
                          onClick={copyToClipboard}
                          className="action-button copy-button"
                      >
                        <Copy className="icon" size={18}/>
                        {copySuccess ? 'Copied!' : 'Copy Text'}
                      </button>
                      <button
                          onClick={downloadAsPDF}
                          disabled={isLoading}
                          className="action-button download-button"
                      >
                        {isLoading ? (
                            <Loader2 className="loading-icon" size={18}/>
                        ) : (
                            <Download className="icon" size={18}/>
                        )}
                        Download PDF
                      </button>
                    </div>
                  </div>
              ) : (
                  <div className="empty-results">
                    <FileText className="empty-icon" size={64}/>
                    <p>Upload and convert a document to see the text here</p>
                  </div>
              )}
            </div>
          </div>

          {/* Guidelines Section - CSS Version */}
          <div className="guidelines-section">
            <div className="guidelines-header">
              <h2 className="guidelines-title">
                📋 Guidelines for Best Results
              </h2>
              <button
                  onClick={() => setShowGuidelines(!showGuidelines)}
                  className="guidelines-toggle-btn"
              >
                {showGuidelines ? 'Hide' : 'Show'}
              </button>
            </div>

            {showGuidelines && (
                <div className="guidelines-content">
                  <div className="guidelines-list">
                    {/* Guideline 1 */}
                    <div className="guideline-item">
                      <span className="guideline-emoji">📄</span>
                      <p className="guideline-text">
                        Use documents written on blank white paper (avoid ruled or lined pages)
                      </p>
                    </div>

                    {/* Guideline 2 */}
                    <div className="guideline-item">
                      <span className="guideline-emoji">📐</span>
                      <p className="guideline-text">
                        Ensure the document is positioned at the correct angle (not tilted or rotated)
                      </p>
                    </div>

                    {/* Guideline 3 */}
                    <div className="guideline-item">
                      <span className="guideline-emoji">📸</span>
                      <p className="guideline-text">
                        Upload clear, well-lit images with good focus and minimal shadows
                      </p>
                    </div>

                    {/* Guideline 4 */}
                    <div className="guideline-item">
                      <span className="guideline-emoji">⚠️</span>
                      <p className="guideline-text">
                        Avoid uploading blurry, folded, torn, or damaged documents
                      </p>
                    </div>

                    {/* Guideline 5 */}
                    <div className="guideline-item">
                      <span className="guideline-emoji">🔍</span>
                      <p className="guideline-text">
                        Ensure text is clearly visible and not too small in the image
                      </p>
                    </div>

                    {/* Guideline 6 */}
                    <div className="guideline-item">
                      <span className="guideline-emoji">🇱🇰</span>
                      <p className="guideline-text emphasis">
                        This system is designed specifically for Sinhala handwriting only
                      </p>
                    </div>
                  </div>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Powered by CNN+RNN ML Model • Supports Sinhala handwritten documents</p>
          </div>
        </div>
      </div>
  );
};

export default SinhalaOCRApp;