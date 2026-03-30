import subprocess
import os

def run_colmap_pipeline(job_id: str, image_dir: str, workspace_dir: str):
    """
    Runs the standard COLMAP Photogrammetry Pipeline.
    Prerequisite: COLMAP must be installed and added to the system PATH.
    """
    colmap_exec = os.path.join(os.path.dirname(__file__), "colmap", "COLMAP.bat")
    database_path = os.path.join(workspace_dir, "database.db")
    sparse_dir = os.path.join(workspace_dir, "sparse")
    dense_dir = os.path.join(workspace_dir, "dense")
    
    os.makedirs(sparse_dir, exist_ok=True)
    os.makedirs(dense_dir, exist_ok=True)
    
    try:
        # 1. Feature Extraction
        print(f"[{job_id}] Extracting features...")
        subprocess.run([colmap_exec, "feature_extractor", "--database_path", database_path, "--image_path", image_dir], check=True)
        
        # 2. Feature Matching
        print(f"[{job_id}] Matching features...")
        subprocess.run([colmap_exec, "exhaustive_matcher", "--database_path", database_path], check=True)
        
        # 3. Sparse Reconstruction (SfM)
        print(f"[{job_id}] Running Sparse Reconstruction...")
        subprocess.run([colmap_exec, "mapper", "--database_path", database_path, "--image_path", image_dir, "--output_path", sparse_dir], check=True)
        
        # 4. Image Undistortion (Prep for MVS)
        print(f"[{job_id}] Undistorting images...")
        subprocess.run([colmap_exec, "image_undistorter", "--image_path", image_dir, "--input_path", os.path.join(sparse_dir, "0"), "--output_path", dense_dir], check=True)
        
        # 5. Dense Reconstruction (MVS)
        # Note: patch_match_stereo requires CUDA
        print(f"[{job_id}] Running Dense Reconstruction (MVS)...")
        subprocess.run([colmap_exec, "patch_match_stereo", "--workspace_path", dense_dir, "--workspace_format", "COLMAP"], check=True)
        
        # 6. Stereo Fusion
        print(f"[{job_id}] Running Stereo Fusion...")
        fused_ply = os.path.join(dense_dir, "fused.ply")
        subprocess.run([colmap_exec, "stereo_fusion", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--input_type", "geometric", "--output_path", fused_ply], check=True)
        
        # 7. Mesh Generation (Poisson)
        print(f"[{job_id}] Generating Mesh (Poisson)...")
        meshed_ply = os.path.join(dense_dir, "meshed-poisson.ply")
        subprocess.run([colmap_exec, "poisson_mesher", "--input_path", fused_ply, "--output_path", meshed_ply], check=True)
        
        return meshed_ply
    except subprocess.CalledProcessError as e:
        print(f"[{job_id}] COLMAP Pipeline Failed: {e}")
        return None
    except FileNotFoundError:
        print(f"[{job_id}] ERROR: 'colmap' command not found. Please ensure it is installed and in the system PATH.")
        return None

def run_colmap_pipeline_fast(job_id: str, image_dir: str, workspace_dir: str):
    """
    Runs the standard COLMAP Photogrammetry Pipeline with parameters optimized for speed/low-res.
    """
    colmap_exec = os.path.join(os.path.dirname(__file__), "colmap", "COLMAP.bat")
    database_path = os.path.join(workspace_dir, "database.db")
    sparse_dir = os.path.join(workspace_dir, "sparse")
    dense_dir = os.path.join(workspace_dir, "dense")
    
    os.makedirs(sparse_dir, exist_ok=True)
    os.makedirs(dense_dir, exist_ok=True)
    
    try:
        # 1. Feature Extraction (Fast)
        print(f"[{job_id}] Extracting features (Fast Mode)...")
        # Removing max_image_size from feature_extractor to ensure we extract enough features for a valid sparse model
        subprocess.run([colmap_exec, "feature_extractor", "--database_path", database_path, "--image_path", image_dir], check=True)
        # 2. Feature Matching
        print(f"[{job_id}] Matching features...")
        subprocess.run([colmap_exec, "exhaustive_matcher", "--database_path", database_path], check=True)
        # 3. Sparse Reconstruction
        print(f"[{job_id}] Running Sparse Reconstruction...")
        subprocess.run([colmap_exec, "mapper", "--database_path", database_path, "--image_path", image_dir, "--output_path", sparse_dir], check=True)
        # 4. Image Undistortion
        print(f"[{job_id}] Undistorting images...")
        subprocess.run([colmap_exec, "image_undistorter", "--image_path", image_dir, "--input_path", os.path.join(sparse_dir, "0"), "--output_path", dense_dir], check=True)
        # 5. Dense Reconstruction (Fast Mode)
        print(f"[{job_id}] Running Dense Reconstruction (Fast Mode)...")
        # We limit the max image size and increase the window step here to vastly speed up dense stereo
        subprocess.run([colmap_exec, "patch_match_stereo", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--PatchMatchStereo.max_image_size", "1000", "--PatchMatchStereo.window_step", "2"], check=True)
        # 6. Stereo Fusion
        print(f"[{job_id}] Running Stereo Fusion...")
        fused_ply = os.path.join(dense_dir, "fused.ply")
        subprocess.run([colmap_exec, "stereo_fusion", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--input_type", "geometric", "--output_path", fused_ply], check=True)
        # 7. Mesh Generation
        print(f"[{job_id}] Generating Mesh (Poisson)...")
        meshed_ply = os.path.join(dense_dir, "meshed-poisson.ply")
        subprocess.run([colmap_exec, "poisson_mesher", "--input_path", fused_ply, "--output_path", meshed_ply], check=True)
        return meshed_ply
    except subprocess.CalledProcessError as e:
        print(f"[{job_id}] COLMAP Fast Pipeline Failed: {e}")
        return None
    except FileNotFoundError:
        print(f"[{job_id}] ERROR: 'colmap' command not found. Please ensure it is installed and in the system PATH.")
        return None

def run_colmap_pipeline_fast2(job_id: str, image_dir: str, workspace_dir: str):
    """
    Runs the standard COLMAP Photogrammetry Pipeline with parameters optimized for medium resolution (fast2).
    """
    colmap_exec = os.path.join(os.path.dirname(__file__), "colmap", "COLMAP.bat")
    database_path = os.path.join(workspace_dir, "database.db")
    sparse_dir = os.path.join(workspace_dir, "sparse")
    dense_dir = os.path.join(workspace_dir, "dense")
    
    os.makedirs(sparse_dir, exist_ok=True)
    os.makedirs(dense_dir, exist_ok=True)
    
    try:
        # 1. Feature Extraction (Medium Mode)
        print(f"[{job_id}] Extracting features (Medium Mode)...")
        subprocess.run([colmap_exec, "feature_extractor", "--database_path", database_path, "--image_path", image_dir], check=True)
        # 2. Feature Matching
        print(f"[{job_id}] Matching features...")
        subprocess.run([colmap_exec, "exhaustive_matcher", "--database_path", database_path], check=True)
        # 3. Sparse Reconstruction
        print(f"[{job_id}] Running Sparse Reconstruction...")
        subprocess.run([colmap_exec, "mapper", "--database_path", database_path, "--image_path", image_dir, "--output_path", sparse_dir], check=True)
        # 4. Image Undistortion
        print(f"[{job_id}] Undistorting images...")
        subprocess.run([colmap_exec, "image_undistorter", "--image_path", image_dir, "--input_path", os.path.join(sparse_dir, "0"), "--output_path", dense_dir], check=True)
        # 5. Dense Reconstruction (Medium Mode)
        print(f"[{job_id}] Running Dense Reconstruction (Medium Mode)...")
        # 2x the resolution of the fast mode (max_image_size expanded to 2000 from 1000)
        subprocess.run([colmap_exec, "patch_match_stereo", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--PatchMatchStereo.max_image_size", "2000", "--PatchMatchStereo.window_step", "2"], check=True)
        # 6. Stereo Fusion
        print(f"[{job_id}] Running Stereo Fusion...")
        fused_ply = os.path.join(dense_dir, "fused.ply")
        subprocess.run([colmap_exec, "stereo_fusion", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--input_type", "geometric", "--output_path", fused_ply], check=True)
        # 7. Mesh Generation
        print(f"[{job_id}] Generating Mesh (Poisson)...")
        meshed_ply = os.path.join(dense_dir, "meshed-poisson.ply")
        subprocess.run([colmap_exec, "poisson_mesher", "--input_path", fused_ply, "--output_path", meshed_ply], check=True)
        return meshed_ply
    except subprocess.CalledProcessError as e:
        print(f"[{job_id}] COLMAP Medium Pipeline Failed: {e}")
        return None
    except FileNotFoundError:
        print(f"[{job_id}] ERROR: 'colmap' command not found. Please ensure it is installed and in the system PATH.")
        return None

def run_colmap_pipeline_fast3(job_id: str, image_dir: str, workspace_dir: str):
    """
    Runs the standard COLMAP Photogrammetry Pipeline with parameters optimized for normal resolution (fast3).
    """
    colmap_exec = os.path.join(os.path.dirname(__file__), "colmap", "COLMAP.bat")
    database_path = os.path.join(workspace_dir, "database.db")
    sparse_dir = os.path.join(workspace_dir, "sparse")
    dense_dir = os.path.join(workspace_dir, "dense")
    
    os.makedirs(sparse_dir, exist_ok=True)
    os.makedirs(dense_dir, exist_ok=True)
    
    try:
        # 1. Feature Extraction (Normal Mode)
        print(f"[{job_id}] Extracting features (Normal Mode)...")
        subprocess.run([colmap_exec, "feature_extractor", "--database_path", database_path, "--image_path", image_dir], check=True)
        # 2. Feature Matching
        print(f"[{job_id}] Matching features...")
        subprocess.run([colmap_exec, "exhaustive_matcher", "--database_path", database_path], check=True)
        # 3. Sparse Reconstruction
        print(f"[{job_id}] Running Sparse Reconstruction...")
        subprocess.run([colmap_exec, "mapper", "--database_path", database_path, "--image_path", image_dir, "--output_path", sparse_dir], check=True)
        # 4. Image Undistortion
        print(f"[{job_id}] Undistorting images...")
        subprocess.run([colmap_exec, "image_undistorter", "--image_path", image_dir, "--input_path", os.path.join(sparse_dir, "0"), "--output_path", dense_dir], check=True)
        # 5. Dense Reconstruction (Normal Mode)
        print(f"[{job_id}] Running Dense Reconstruction (Normal Mode)...")
        # 2x the resolution of the medium mode (max_image_size expanded to 4000 from 2000)
        subprocess.run([colmap_exec, "patch_match_stereo", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--PatchMatchStereo.max_image_size", "4000", "--PatchMatchStereo.window_step", "2"], check=True)
        # 6. Stereo Fusion
        print(f"[{job_id}] Running Stereo Fusion...")
        fused_ply = os.path.join(dense_dir, "fused.ply")
        subprocess.run([colmap_exec, "stereo_fusion", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--input_type", "geometric", "--output_path", fused_ply], check=True)
        # 7. Mesh Generation
        print(f"[{job_id}] Generating Mesh (Poisson)...")
        meshed_ply = os.path.join(dense_dir, "meshed-poisson.ply")
        subprocess.run([colmap_exec, "poisson_mesher", "--input_path", fused_ply, "--output_path", meshed_ply], check=True)
        return meshed_ply
    except subprocess.CalledProcessError as e:
        print(f"[{job_id}] COLMAP Normal Pipeline Failed: {e}")
        return None
    except FileNotFoundError:
        print(f"[{job_id}] ERROR: 'colmap' command not found. Please ensure it is installed and in the system PATH.")
        return None

def run_colmap_pipeline_test(job_id: str, image_dir: str, workspace_dir: str):
    """
    Runs the standard COLMAP Photogrammetry Pipeline with parameters optimized for maximizing image acceptance.
    """
    colmap_exec = os.path.join(os.path.dirname(__file__), "colmap", "COLMAP.bat")
    database_path = os.path.join(workspace_dir, "database.db")
    sparse_dir = os.path.join(workspace_dir, "sparse")
    dense_dir = os.path.join(workspace_dir, "dense")
    
    os.makedirs(sparse_dir, exist_ok=True)
    os.makedirs(dense_dir, exist_ok=True)
    
    try:
        # 1. Feature Extraction (Test/Robust Mode)
        print(f"[{job_id}] Extracting features (Test Mode - High Robustness)...")
        subprocess.run([colmap_exec, "feature_extractor", "--database_path", database_path, "--image_path", image_dir, "--SiftExtraction.max_num_features", "16384"], check=True)
        # 2. Feature Matching
        print(f"[{job_id}] Matching features...")
        subprocess.run([colmap_exec, "exhaustive_matcher", "--database_path", database_path, "--SiftMatching.guided_matching", "1"], check=True)
        # 3. Sparse Reconstruction (Accepting fewer matches)
        print(f"[{job_id}] Running Sparse Reconstruction (Relaxed Constraints)...")
        subprocess.run([colmap_exec, "mapper", "--database_path", database_path, "--image_path", image_dir, "--output_path", sparse_dir, "--Mapper.min_num_matches", "10", "--Mapper.abs_pose_min_num_inliers", "15", "--Mapper.min_model_size", "3"], check=True)
        # 4. Image Undistortion
        print(f"[{job_id}] Undistorting images...")
        subprocess.run([colmap_exec, "image_undistorter", "--image_path", image_dir, "--input_path", os.path.join(sparse_dir, "0"), "--output_path", dense_dir], check=True)
        # 5. Dense Reconstruction (Fast params)
        print(f"[{job_id}] Running Dense Reconstruction (Test Mode)...")
        subprocess.run([colmap_exec, "patch_match_stereo", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--PatchMatchStereo.max_image_size", "1000", "--PatchMatchStereo.window_step", "2"], check=True)
        # 6. Stereo Fusion
        print(f"[{job_id}] Running Stereo Fusion...")
        fused_ply = os.path.join(dense_dir, "fused.ply")
        subprocess.run([colmap_exec, "stereo_fusion", "--workspace_path", dense_dir, "--workspace_format", "COLMAP", "--input_type", "geometric", "--output_path", fused_ply], check=True)
        # 7. Mesh Generation
        print(f"[{job_id}] Generating Mesh (Poisson)...")
        meshed_ply = os.path.join(dense_dir, "meshed-poisson.ply")
        subprocess.run([colmap_exec, "poisson_mesher", "--input_path", fused_ply, "--output_path", meshed_ply], check=True)
        return meshed_ply
    except subprocess.CalledProcessError as e:
        print(f"[{job_id}] COLMAP Test Pipeline Failed: {e}")
        return None
    except FileNotFoundError:
        print(f"[{job_id}] ERROR: 'colmap' command not found. Please ensure it is installed and in the system PATH.")
        return None
