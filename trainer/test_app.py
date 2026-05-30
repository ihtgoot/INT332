import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "up"


def test_train_endpoint_creates_job():
    payload = {"dataset_path": "fake_path", "epochs": 1, "lr": 0.0001}
    response = client.post("/train", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"


def test_status_endpoint():
    # First create a job
    payload = {"epochs": 1}
    train_resp = client.post("/train", json=payload)
    job_id = train_resp.json()["job_id"]

    # Then check its status
    status_resp = client.get(f"/status/{job_id}")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["status"] in ("queued", "running", "done")
    assert "progress" in data


def test_status_not_found():
    response = client.get("/status/nonexistent-job-id")
    assert response.status_code == 404


def test_inference_endpoint():
    payload = {"model_id": "mock_model", "instruction": "hello"}
    response = client.post("/inference", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "mock_model" in data["response"].lower() or "mock" in data["response"].lower()
