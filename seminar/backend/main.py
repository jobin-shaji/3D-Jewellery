from fastapi import FastAPI, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import os
import uuid
import time
import shutil

app = FastAPI(title="3D Reconstruction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("models", exist_ok=True)

jobs = {}

from pipeline import run_colmap_pipeline, run_colmap_pipeline_fast, run_colmap_pipeline_fast2, run_colmap_pipeline_fast3, run_colmap_pipeline_test
import trimesh

def run_reconstruction_pipeline(job_id: str, image_dir: str):
    """
    Real implementation of the 3D Reconstruction Pipeline calling COLMAP.
    """
    jobs[job_id]["status"] = "processing"
    
    try:
        # Run the full COLMAP dense reconstruction pipeline
        meshed_ply = run_colmap_pipeline(job_id, image_dir, image_dir)
        
        if meshed_ply and os.path.exists(meshed_ply):
            print(f"[{job_id}] Converting {meshed_ply} to GLB format...")
            # Load the poisson meshed PLY and export to GLB for THREE.js
            mesh = trimesh.load(meshed_ply)
            glb_path = f"models/{job_id}.glb"
            mesh.export(glb_path, file_type='glb')
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["model_url"] = f"http://localhost:8000/models/{job_id}.glb"
            print(f"[{job_id}] Job completed successfully!")
        else:
            jobs[job_id]["status"] = "failed"
            print(f"[{job_id}] Pipeline failed or returned no mesh.")
            
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        print(f"[{job_id}] Exception during reconstruction: {e}")

def run_reconstruction_pipeline_fast(job_id: str, image_dir: str):
    """
    Fast implementation of the 3D Reconstruction Pipeline calling COLMAP.
    """
    jobs[job_id]["status"] = "processing"
    
    try:
        # Run the fast COLMAP dense reconstruction pipeline
        meshed_ply = run_colmap_pipeline_fast(job_id, image_dir, image_dir)
        
        if meshed_ply and os.path.exists(meshed_ply):
            print(f"[{job_id}] Converting {meshed_ply} to GLB format...")
            mesh = trimesh.load(meshed_ply)
            
            if hasattr(mesh, 'is_empty') and mesh.is_empty:
                raise ValueError("Generated mesh is empty. Insufficient features.")
            # For scenes containing multiple meshes
            if isinstance(mesh, trimesh.Scene) and len(mesh.geometry) == 0:
                raise ValueError("Generated scene is empty. Insufficient features.")
                
            glb_path = f"models/{job_id}.glb"
            mesh.export(glb_path, file_type='glb')
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["model_url"] = f"http://localhost:8000/models/{job_id}.glb"
            print(f"[{job_id}] Job completed successfully in fast mode!")
        else:
            jobs[job_id]["status"] = "failed"
            print(f"[{job_id}] Fast Pipeline failed or returned no mesh.")
            
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        print(f"[{job_id}] Exception during fast reconstruction: {e}")

def run_reconstruction_pipeline_fast2(job_id: str, image_dir: str):
    """
    Medium implementation of the 3D Reconstruction Pipeline calling COLMAP (fast2).
    """
    jobs[job_id]["status"] = "processing"
    
    try:
        # Run the medium COLMAP dense reconstruction pipeline
        meshed_ply = run_colmap_pipeline_fast2(job_id, image_dir, image_dir)
        
        if meshed_ply and os.path.exists(meshed_ply):
            print(f"[{job_id}] Converting {meshed_ply} to GLB format...")
            mesh = trimesh.load(meshed_ply)
            
            if hasattr(mesh, 'is_empty') and mesh.is_empty:
                raise ValueError("Generated mesh is empty. Insufficient features.")
            if isinstance(mesh, trimesh.Scene) and len(mesh.geometry) == 0:
                raise ValueError("Generated scene is empty. Insufficient features.")
                
            glb_path = f"models/{job_id}.glb"
            mesh.export(glb_path, file_type='glb')
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["model_url"] = f"http://localhost:8000/models/{job_id}.glb"
            print(f"[{job_id}] Job completed successfully in medium/fast2 mode!")
        else:
            jobs[job_id]["status"] = "failed"
            print(f"[{job_id}] Medium/Fast2 Pipeline failed or returned no mesh.")
            
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        print(f"[{job_id}] Exception during medium reconstruction: {e}")

def run_reconstruction_pipeline_fast3(job_id: str, image_dir: str):
    """
    Normal implementation of the 3D Reconstruction Pipeline calling COLMAP (fast3).
    """
    jobs[job_id]["status"] = "processing"
    
    try:
        # Run the normal COLMAP dense reconstruction pipeline
        meshed_ply = run_colmap_pipeline_fast3(job_id, image_dir, image_dir)
        
        if meshed_ply and os.path.exists(meshed_ply):
            print(f"[{job_id}] Converting {meshed_ply} to GLB format...")
            mesh = trimesh.load(meshed_ply)
            
            if hasattr(mesh, 'is_empty') and mesh.is_empty:
                raise ValueError("Generated mesh is empty. Insufficient features.")
            if isinstance(mesh, trimesh.Scene) and len(mesh.geometry) == 0:
                raise ValueError("Generated scene is empty. Insufficient features.")
                
            glb_path = f"models/{job_id}.glb"
            mesh.export(glb_path, file_type='glb')
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["model_url"] = f"http://localhost:8000/models/{job_id}.glb"
            print(f"[{job_id}] Job completed successfully in normal mode!")
        else:
            jobs[job_id]["status"] = "failed"
            print(f"[{job_id}] Normal Pipeline failed or returned no mesh.")
            
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        print(f"[{job_id}] Exception during normal reconstruction: {e}")

def run_reconstruction_pipeline_test(job_id: str, image_dir: str):
    """
    Test implementation of the 3D Reconstruction Pipeline calling COLMAP.
    """
    jobs[job_id]["status"] = "processing"
    
    try:
        # Run the test COLMAP dense reconstruction pipeline
        meshed_ply = run_colmap_pipeline_test(job_id, image_dir, image_dir)
        
        if meshed_ply and os.path.exists(meshed_ply):
            print(f"[{job_id}] Converting {meshed_ply} to GLB format...")
            mesh = trimesh.load(meshed_ply)
            
            if hasattr(mesh, 'is_empty') and mesh.is_empty:
                raise ValueError("Generated mesh is empty. Insufficient features.")
            if isinstance(mesh, trimesh.Scene) and len(mesh.geometry) == 0:
                raise ValueError("Generated scene is empty. Insufficient features.")
                
            glb_path = f"models/{job_id}.glb"
            mesh.export(glb_path, file_type='glb')
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["model_url"] = f"http://localhost:8000/models/{job_id}.glb"
            print(f"[{job_id}] Job completed successfully in test mode!")
        else:
            jobs[job_id]["status"] = "failed"
            print(f"[{job_id}] Test Pipeline failed or returned no mesh.")
            
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        print(f"[{job_id}] Exception during test reconstruction: {e}")

@app.get("/")
def read_root():
    return {"status": "3D Reconstruction API is running"}

@app.post("/upload")
async def upload_images(background_tasks: BackgroundTasks, files: list[UploadFile]):
    job_id = str(uuid.uuid4())
    job_dir = f"uploads/{job_id}"
    os.makedirs(job_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        file_location = f"{job_dir}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        saved_files.append(file.filename)
        
    jobs[job_id] = {"status": "queued", "images": len(saved_files)}
    
    background_tasks.add_task(run_reconstruction_pipeline, job_id, job_dir)
    
    return {"info": f"Started job {job_id} with {len(saved_files)} files.", "job_id": job_id}

@app.post("/upload_fast")
async def upload_images_fast(background_tasks: BackgroundTasks, files: list[UploadFile]):
    job_id = str(uuid.uuid4())
    job_dir = f"uploads/{job_id}"
    os.makedirs(job_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        file_location = f"{job_dir}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        saved_files.append(file.filename)
        
    jobs[job_id] = {"status": "queued", "images": len(saved_files)}
    
    background_tasks.add_task(run_reconstruction_pipeline_fast, job_id, job_dir)
    
    return {"info": f"Started fast job {job_id} with {len(saved_files)} files.", "job_id": job_id}

@app.post("/upload_fast2")
async def upload_images_fast2(background_tasks: BackgroundTasks, files: list[UploadFile]):
    job_id = str(uuid.uuid4())
    job_dir = f"uploads/{job_id}"
    os.makedirs(job_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        file_location = f"{job_dir}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        saved_files.append(file.filename)
        
    jobs[job_id] = {"status": "queued", "images": len(saved_files)}
    
    background_tasks.add_task(run_reconstruction_pipeline_fast2, job_id, job_dir)
    
    return {"info": f"Started medium job {job_id} with {len(saved_files)} files.", "job_id": job_id}

@app.post("/upload_fast3")
async def upload_images_fast3(background_tasks: BackgroundTasks, files: list[UploadFile]):
    job_id = str(uuid.uuid4())
    job_dir = f"uploads/{job_id}"
    os.makedirs(job_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        file_location = f"{job_dir}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        saved_files.append(file.filename)
        
    jobs[job_id] = {"status": "queued", "images": len(saved_files)}
    
    background_tasks.add_task(run_reconstruction_pipeline_fast3, job_id, job_dir)
    
    return {"info": f"Started normal job {job_id} with {len(saved_files)} files.", "job_id": job_id}

@app.post("/test_upload")
async def test_upload_images(background_tasks: BackgroundTasks, files: list[UploadFile]):
    job_id = str(uuid.uuid4())
    job_dir = f"uploads/{job_id}"
    os.makedirs(job_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        file_location = f"{job_dir}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        saved_files.append(file.filename)
        
    jobs[job_id] = {"status": "queued", "images": len(saved_files)}
    
    background_tasks.add_task(run_reconstruction_pipeline_test, job_id, job_dir)
    
    return {"info": f"Started test job {job_id} with {len(saved_files)} files.", "job_id": job_id}

@app.get("/status/{job_id}")
def get_status(job_id: str):
    if job_id not in jobs:
        return {"status": "unknown"}
    return jobs[job_id]

@app.get("/models")
def list_models():
    try:
        if not os.path.exists("models"):
            return {"models": []}
            
        files = os.listdir("models")
        glb_files = sorted([f for f in files if f.endswith('.glb')], key=lambda x: os.path.getmtime(os.path.join("models", x)), reverse=True)
        
        models_list = []
        for file in glb_files:
            models_list.append({
                "id": file.replace(".glb", ""),
                "name": file,
                "url": f"http://localhost:8000/models/{file}"
            })
            
        return {"models": models_list}
    except Exception as e:
        return {"error": str(e)}

@app.get("/models/{filename}")
def get_model(filename: str):
    file_path = f"models/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Model not found"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
