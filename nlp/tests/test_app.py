import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_process_resume(client):
    with open("test_resume.pdf", "rb") as f:
        response = client.post('/api/process', data={'resume': (f, 'test_resume.pdf')})
    assert response.status_code == 200
    assert response.json['success'] is True
    assert 'data' in response.json

def test_detect_duplicates(client):
    with open("test_resume.pdf", "rb") as f:
        response = client.post('/api/detect-duplicates', data={'resume': (f, 'test_resume.pdf')})
    assert response.status_code == 200
    assert response.json['success'] is True