import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Center } from '@react-three/drei';
import { UploadCloud, Box, Image as ImageIcon, Loader2 } from 'lucide-react';
import './App.css';

// Dynamic model component that loads the GLTF
function Model({ url }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

// Fallback cube to show while processing or waiting
function PlaceholderCube() {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState([]);
  const [quality, setQuality] = useState(1); // 1: Fast, 2: Medium(fast2), 3: Normal(fast3), 4: Slow, 5: Test
  const [recentModels, setRecentModels] = useState([]);

  React.useEffect(() => {
    fetch('http://localhost:8000/models')
      .then(res => res.json())
      .then(data => {
        if (data.models) {
          setRecentModels(data.models);
        }
      })
      .catch(err => console.error("Failed to fetch models", err));
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImages(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    images.forEach(img => formData.append('files', img));

    try {
      let endpoint = 'http://localhost:8000/upload_fast';
      
      if (quality === 2) endpoint = 'http://localhost:8000/upload_fast2';
      else if (quality === 3) endpoint = 'http://localhost:8000/upload_fast3';
      else if (quality === 4) endpoint = 'http://localhost:8000/upload';
      else if (quality === 5) endpoint = 'http://localhost:8000/test_upload';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      const jobId = data.job_id;
      
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:8000/status/${jobId}`);
          const statusData = await statusRes.json();
          
          if (statusData.status === 'completed') {
            clearInterval(interval);
            setModelUrl(statusData.model_url);
            setIsProcessing(false);
          } else if (statusData.status === 'failed') {
            clearInterval(interval);
            setIsProcessing(false);
            alert('Reconstruction failed.');
          }
        } catch(e) {
          console.error('Polling error', e);
        }
      }, 2000);

    } catch (error) {
      console.error(error);
      alert('Error connecting to the backend server.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="header">
          <h1><Box size={24} color="#6366f1"/> 3D Reconstruct</h1>
          <span>Image to 3D Pipeline</span>
        </div>

        <div 
          className="upload-zone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <input 
            type="file" 
            id="fileInput" 
            multiple 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleFileInput}
          />
          <UploadCloud className="upload-icon" size={32} />
          <div className="upload-text">
            {images.length > 0 
              ? `${images.length} images selected` 
              : "Drag & drop your images here or click to browse"}
          </div>
        </div>

        <button 
          className="upload-btn"
          onClick={handleUpload}
          disabled={images.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <><Loader2 size={18} className="pulse" /> Processing...</>
          ) : (
            <><ImageIcon size={18} /> Generate 3D Model</>
          )}
        </button>

        <div style={{ marginTop: '1.5rem', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Quality Setting</span>
            <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
              {quality === 1 ? 'Fast' : quality === 2 ? 'Medium' : quality === 3 ? 'Normal' : quality === 4 ? 'Slow (High Res)' : 'Test (Most Images)'}
            </span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            disabled={isProcessing}
            style={{ 
              width: '100%', 
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              accentColor: '#10b981'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            <span>Fast</span>
            <span>Med</span>
            <span>Norm</span>
            <span>Slow</span>
            <span>Test</span>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Recent Models
          </h3>
          <div className="model-list" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            {recentModels.length > 0 ? (
              recentModels.map((model) => (
                <div 
                  key={model.id} 
                  className="model-item" 
                  onClick={() => setModelUrl(model.url)}
                  style={{ cursor: 'pointer', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Box size={16} color="#94a3b8" style={{ minWidth: '16px' }} />
                  <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={model.name}>
                    {model.name}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', padding: '0.5rem' }}>No models found.</div>
            )}
          </div>
        </div>
      </div>

      <div className="canvas-container">
        <div className="overlay-status">
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: isProcessing ? '#f59e0b' : '#10b981' 
          }}></div>
          {isProcessing ? 'Processing Pipeline Active' : 'System Ready'}
        </div>

        <Canvas camera={{ position: [2, 2, 4], fov: 45 }}>
          <color attach="background" args={['#f8fafc']} />
          <fog attach="fog" args={['#f8fafc', 5, 15]} />
          
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <directionalLight position={[-5, 5, -5]} intensity={0.8} />
          
          <Suspense fallback={null}>
            {modelUrl ? (
              <Model url={modelUrl} />
            ) : (
              <PlaceholderCube />
            )}
            <Environment preset="studio" />
          </Suspense>

          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} enablePan={true} enableZoom={true} />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
