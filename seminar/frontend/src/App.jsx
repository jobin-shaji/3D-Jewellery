import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import {
  ArrowRight,
  Box,
  Boxes,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import './App.css';

const PHOTOGRAMMETRY_API = 'http://localhost:8000';
const HUNYUAN_API = 'http://localhost:8001';

function navigate(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);

  return pathname;
}

function Model({ url }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function PlaceholderMesh({ color = '#cf5c36' }) {
  return (
    <mesh castShadow receiveShadow rotation={[0.4, 0.7, 0]}>
      <icosahedronGeometry args={[1.1, 1]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.15} />
    </mesh>
  );
}

function ViewerPanel({ modelUrl, isProcessing, accent, statusLabel, emptyLabel }) {
  return (
    <div className="viewer-shell">
      <div className="viewer-status">
        <span className="viewer-dot" style={{ backgroundColor: isProcessing ? '#f4a261' : accent }} />
        {statusLabel}
      </div>

      <Canvas camera={{ position: [2.8, 2.3, 4.6], fov: 45 }}>
        <color attach="background" args={['#f4efe7']} />
        <fog attach="fog" args={['#f4efe7', 6, 16]} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[4, 6, 5]} intensity={1.35} />
        <directionalLight position={[-4, 3, -5]} intensity={0.55} />

        <Suspense fallback={null}>
          {modelUrl ? <Model url={modelUrl} /> : <PlaceholderMesh color={accent} />}
          <Environment preset="studio" />
          <ContactShadows position={[0, -1.4, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </Suspense>

        <OrbitControls makeDefault autoRotate={!modelUrl} autoRotateSpeed={0.8} />
      </Canvas>

      {!modelUrl && <div className="viewer-empty">{emptyLabel}</div>}
    </div>
  );
}

function Shell({ title, subtitle, accent, modeLabel, children, viewer }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark" style={{ backgroundColor: accent }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="mode-switch">
          <button
            className={`mode-tab ${modeLabel === 'photogrammetry' ? 'active' : ''}`}
            onClick={() => navigate('/')}
            type="button"
          >
            <Boxes size={16} />
            Multi-Image
          </button>
          <button
            className={`mode-tab ${modeLabel === 'image-to-3d' ? 'active' : ''}`}
            onClick={() => navigate('/image-to-3d')}
            type="button"
          >
            <ImageIcon size={16} />
            Single Image
          </button>
        </div>

        {children}
      </aside>

      <main className="main-panel">{viewer}</main>
    </div>
  );
}

function PhotogrammetryPage() {
  const [modelUrl, setModelUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState([]);
  const [quality, setQuality] = useState(1);
  const [recentModels, setRecentModels] = useState([]);

  const loadRecentModels = async () => {
    try {
      const res = await fetch(`${PHOTOGRAMMETRY_API}/models`);
      const data = await res.json();
      setRecentModels(data.models ?? []);
    } catch {
      setRecentModels([]);
    }
  };

  useEffect(() => {
    loadRecentModels();
  }, []);

  const uploadLabel = images.length > 0 ? `${images.length} images selected` : 'Drop a photo set or click to browse';

  const upload = async () => {
    if (!images.length) return;

    setIsProcessing(true);
    const formData = new FormData();
    images.forEach((img) => formData.append('files', img));

    let endpoint = `${PHOTOGRAMMETRY_API}/upload_fast`;
    if (quality === 2) endpoint = `${PHOTOGRAMMETRY_API}/upload_fast2`;
    else if (quality === 3) endpoint = `${PHOTOGRAMMETRY_API}/upload_fast3`;
    else if (quality === 4) endpoint = `${PHOTOGRAMMETRY_API}/upload`;
    else if (quality === 5) endpoint = `${PHOTOGRAMMETRY_API}/test_upload`;

    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await response.json();
      const jobId = data.job_id;

      const interval = window.setInterval(async () => {
        const statusRes = await fetch(`${PHOTOGRAMMETRY_API}/status/${jobId}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'completed') {
          window.clearInterval(interval);
          setModelUrl(statusData.model_url);
          setIsProcessing(false);
        } else if (statusData.status === 'failed') {
          window.clearInterval(interval);
          setIsProcessing(false);
          window.alert('Reconstruction failed.');
        }
      }, 2000);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      window.alert('Could not connect to the photogrammetry backend.');
    }
  };

  return (
    <Shell
      title="3D Reconstruction"
      subtitle="Photogrammetry pipeline for multi-view image sets."
      accent="#2a9d8f"
      modeLabel="photogrammetry"
      viewer={
        <ViewerPanel
          modelUrl={modelUrl}
          isProcessing={isProcessing}
          accent="#2a9d8f"
          statusLabel={isProcessing ? 'Reconstruction in progress' : 'Photogrammetry ready'}
          emptyLabel="A reconstructed mesh will appear here after processing."
        />
      }
    >
      <label className="upload-panel">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => setImages(Array.from(event.target.files ?? []))}
          hidden
        />
        <UploadCloud className="upload-icon" size={30} />
        <span>{uploadLabel}</span>
      </label>

      <button className="primary-button" disabled={!images.length || isProcessing} onClick={upload} type="button">
        {isProcessing ? <Loader2 size={18} className="spin" /> : <Boxes size={18} />}
        {isProcessing ? 'Processing set...' : 'Generate From Image Set'}
      </button>

      <section className="control-card">
        <div className="section-header">
          <span>Quality</span>
          <strong>
            {quality === 1
              ? 'Fast'
              : quality === 2
                ? 'Medium'
                : quality === 3
                  ? 'Normal'
                  : quality === 4
                    ? 'Slow'
                    : 'Test'}
          </strong>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={quality}
          disabled={isProcessing}
          onChange={(event) => setQuality(Number(event.target.value))}
        />
        <div className="quality-scale">
          <span>Fast</span>
          <span>Med</span>
          <span>Norm</span>
          <span>Slow</span>
          <span>Test</span>
        </div>
      </section>

      <section className="control-card">
        <div className="section-header">
          <span>Recent Meshes</span>
          <button className="ghost-button" type="button" onClick={() => navigate('/')}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="model-list">
          {recentModels.length ? (
            recentModels.map((model) => (
              <button key={model.id} className="model-item" onClick={() => setModelUrl(model.url)} type="button">
                <Box size={16} />
                <span>{model.name}</span>
              </button>
            ))
          ) : (
            <p className="muted-copy">No saved reconstructions yet.</p>
          )}
        </div>
      </section>
    </Shell>
  );
}

function SingleImagePage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [texture, setTexture] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [job, setJob] = useState(null);
  const [recentModels, setRecentModels] = useState([]);

  const fileLabel = file ? file.name : 'Select one PNG, JPG, or WEBP image';

  const pollModels = async () => {
    try {
      const response = await fetch(`${HUNYUAN_API}/models`);
      const data = await response.json();
      setRecentModels(data.models ?? []);
    } catch {
      setRecentModels([]);
    }
  };

  useEffect(() => {
    pollModels();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const statusText = useMemo(() => {
    if (job?.status === 'failed') return `Failed: ${job.error ?? 'unknown error'}`;
    if (isProcessing) return `Job ${job?.job_id ?? ''} is processing`;
    if (job?.status === 'completed') return 'Model ready to preview and download';
    return 'Ready for single-image Hunyuan3D generation';
  }, [isProcessing, job]);

  const submit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setModelUrl(null);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('texture', String(texture));
    formData.append('remove_background', String(removeBackground));

    try {
      const response = await fetch(`${HUNYUAN_API}/jobs`, { method: 'POST', body: formData });
      const data = await response.json();
      setJob(data);

      const interval = window.setInterval(async () => {
        const statusRes = await fetch(`${HUNYUAN_API}/status/${data.job_id}`);
        const statusData = await statusRes.json();
        setJob(statusData);

        if (statusData.status === 'completed') {
          window.clearInterval(interval);
          setModelUrl(statusData.download_url);
          setDownloadUrl(statusData.download_url);
          setIsProcessing(false);
          pollModels();
        } else if (statusData.status === 'failed') {
          window.clearInterval(interval);
          setIsProcessing(false);
        }
      }, 3000);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      window.alert('Could not connect to the Hunyuan3D backend.');
    }
  };

  return (
    <Shell
      title="Single Image to 3D"
      subtitle="Hunyuan3D pipeline for one reference image and a downloadable GLB."
      accent="#cf5c36"
      modeLabel="image-to-3d"
      viewer={
        <div className="single-image-layout">
          <div className="reference-card">
            <div className="section-header">
              <span>Reference Image</span>
              <strong>{file ? 'Loaded' : 'Waiting'}</strong>
            </div>
            <div className="reference-frame">
              {previewUrl ? <img src={previewUrl} alt="Selected reference" /> : <div className="reference-placeholder">Your uploaded image preview will appear here.</div>}
            </div>
          </div>

          <ViewerPanel
            modelUrl={modelUrl}
            isProcessing={isProcessing}
            accent="#cf5c36"
            statusLabel={statusText}
            emptyLabel="The generated GLB will appear here when the job finishes."
          />
        </div>
      }
    >
      <label className="upload-panel hero-upload">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <UploadCloud className="upload-icon" size={30} />
        <span>{fileLabel}</span>
      </label>

      <button className="primary-button warm" disabled={!file || isProcessing} onClick={submit} type="button">
        {isProcessing ? <Loader2 size={18} className="spin" /> : <ImageIcon size={18} />}
        {isProcessing ? 'Generating 3D...' : 'Generate 3D From Image'}
      </button>

      <section className="control-card warm-card">
        <div className="section-header">
          <span>Generation Options</span>
          <strong>Hunyuan3D</strong>
        </div>

        <label className="toggle-row">
          <span>Remove background</span>
          <input type="checkbox" checked={removeBackground} onChange={() => setRemoveBackground((value) => !value)} />
        </label>

        <label className="toggle-row">
          <span>Generate texture</span>
          <input type="checkbox" checked={texture} onChange={() => setTexture((value) => !value)} />
        </label>

        {job && (
          <div className="job-card">
            <div><span>Job ID</span><strong>{job.job_id}</strong></div>
            <div><span>Status</span><strong>{job.status}</strong></div>
          </div>
        )}

        {downloadUrl && (
          <a className="download-button" href={downloadUrl} target="_blank" rel="noreferrer">
            <Download size={16} />
            Download GLB
          </a>
        )}
      </section>

      <section className="control-card warm-card">
        <div className="section-header">
          <span>Generated Models</span>
          <button className="ghost-button" type="button" onClick={pollModels}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="model-list">
          {recentModels.length ? (
            recentModels.map((model) => (
              <button
                key={model.id}
                className="model-item warm-item"
                onClick={() => {
                  setModelUrl(model.url);
                  setDownloadUrl(model.url);
                }}
                type="button"
              >
                <ArrowRight size={16} />
                <span>{model.name}</span>
              </button>
            ))
          ) : (
            <p className="muted-copy">No generated Hunyuan models yet.</p>
          )}
        </div>
      </section>
    </Shell>
  );
}

function App() {
  const pathname = usePathname();
  const page = pathname === '/image-to-3d' ? <SingleImagePage /> : <PhotogrammetryPage />;
  return page;
}

export default App;
