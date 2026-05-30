from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uuid
import time
import os
import threading
import uvicorn
from typing import Optional

app = FastAPI()

# Shared state for tracking training progress
jobs = {}
jobs_lock = threading.Lock()


class TrainRequest(BaseModel):
    job_id: Optional[str] = None
    dataset_path: Optional[str] = None
    epochs: Optional[int] = 1
    lr: Optional[float] = 1e-4


def mock_training(job_id: str, dataset_path: Optional[str], epochs: int, lr: float):
    """Simulate training on CPU with a simple sleep loop."""
    steps = epochs * 10  # fake 10 steps per epoch
    with jobs_lock:
        jobs[job_id]["status"] = "running"

    for step in range(1, steps + 1):
        time.sleep(0.5)  # simulate compute on CPU
        progress = int((step / steps) * 100)
        with jobs_lock:
            jobs[job_id]["progress"] = progress
            jobs[job_id]["current_step"] = step
            jobs[job_id]["total_steps"] = steps

    with jobs_lock:
        jobs[job_id]["status"] = "done"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["end_time"] = time.time()


@app.post('/train', status_code=202)
def train(req: TrainRequest, background_tasks: BackgroundTasks):
    job_id = req.job_id or str(uuid.uuid4())

    with jobs_lock:
        jobs[job_id] = {
            "status": "queued",
            "progress": 0,
            "start_time": time.time(),
        }

    background_tasks.add_task(
        mock_training, job_id, req.dataset_path, req.epochs or 1, req.lr or 1e-4
    )

    return {"job_id": job_id, "status": "queued"}


@app.get('/status/{job_id}')
def status(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


class InferenceRequest(BaseModel):
    model_id: Optional[str] = "mock_model"
    instruction: Optional[str] = "what is life?"


@app.post('/inference')
def inference(req: InferenceRequest):
    """Return a mock response without loading any real model."""
    time.sleep(0.1)  # tiny CPU delay to simulate processing
    mock_response = (
        f"[MOCK] Model '{req.model_id}' received: '{req.instruction}'. "
        "This is a simulated response running entirely on CPU."
    )
    return {"response": mock_response}


@app.get('/health')
def health():
    return {"status": "up"}


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
